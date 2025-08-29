// src/utils/log-transport.ts
// Centralized log management configuration
import pino from 'pino';
import { Logtail } from '@logtail/node';
/**
 * Create Pino transports based on configuration
 */
export function createLogTransports(config) {
    const transports = [];
    const isDevelopment = config.environment === 'development';
    const isTest = config.environment === 'test';
    // Console transport for local development
    if (config.enableConsole !== false && !isTest) {
        if (isDevelopment) {
            transports.push({
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'HH:MM:ss',
                    ignore: 'pid,hostname',
                    messageFormat: '{msg} {correlationId}'
                },
                level: process.env.LOG_LEVEL || 'info'
            });
        }
        else {
            // Production console logging (structured JSON)
            transports.push({
                target: 'pino/file',
                options: { destination: 1 }, // stdout
                level: process.env.LOG_LEVEL || 'info'
            });
        }
    }
    // Better Stack transport for centralized logging
    if (config.enableBetterStack && config.betterStackToken) {
        // Create Logtail instance with custom endpoint if provided
        const endpoint = process.env.BETTERSTACK_INGESTION_HOST
            ? `${process.env.BETTERSTACK_INGESTION_HOST}`
            : undefined;
        const logtail = new Logtail(config.betterStackToken, {
            endpoint: endpoint
        });
        // We'll use a custom transport that doesn't conflict with Pino's worker threads
        transports.push({
            target: '@logtail/pino',
            options: {
                sourceToken: config.betterStackToken,
                endpoint: endpoint
            },
            level: 'trace' // Send all logs to Better Stack
        });
    }
    return transports.length > 0 ? pino.transport({ targets: transports }) : undefined;
}
/**
 * Create a configured Pino logger with multiple transports
 */
export function createMultiTransportLogger(config) {
    const transport = createLogTransports(config);
    const loggerConfig = {
        level: process.env.LOG_LEVEL || 'info',
        // Base configuration
        base: {
            environment: config.environment || 'production',
            service: config.service || 'tg-chatbot'
        },
        // Redact sensitive information
        redact: {
            paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'req.body.password',
                'req.body.token',
                'apiKey',
                'anthropic_api_key',
                'telegram_bot_token',
                'serpapi_key',
                'betterstack_token',
                'logtail_token'
            ],
            censor: '[REDACTED]'
        },
        // Format timestamp
        timestamp: pino.stdTimeFunctions.isoTime,
        // Custom serializers
        serializers: {
            error: pino.stdSerializers.err,
            request: (req) => ({
                method: req.method,
                url: req.url,
                path: req.path,
                parameters: req.params,
                headers: {
                    'user-agent': req.headers?.['user-agent'],
                    'x-correlation-id': req.headers?.['x-correlation-id']
                }
            }),
            response: (res) => ({
                statusCode: res.statusCode,
                headers: res.getHeaders?.()
            })
        }
    };
    // Create logger with transport if available
    if (transport) {
        return pino(loggerConfig, transport);
    }
    // Fallback to basic logger if no transports configured
    return pino(loggerConfig);
}
/**
 * Initialize Better Stack monitoring (optional features)
 */
export function initializeBetterStackMonitoring(token) {
    if (!token) {
        return {
            trackEvent: () => { },
            trackMetric: () => { },
            flush: () => Promise.resolve()
        };
    }
    const logtail = new Logtail(token);
    return {
        // Track custom events
        trackEvent: (eventName, properties) => {
            logtail.info(`Event: ${eventName}`, {
                event: eventName,
                ...properties
            });
        },
        // Track metrics
        trackMetric: (metricName, value, unit) => {
            logtail.info(`Metric: ${metricName}`, {
                metric: metricName,
                value,
                unit: unit || 'count'
            });
        },
        // Ensure all logs are sent before shutdown
        flush: async () => {
            await logtail.flush();
        }
    };
}
//# sourceMappingURL=log-transport.js.map