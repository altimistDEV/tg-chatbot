// src/utils/log-transport-simple.ts
// Simplified Better Stack integration without worker threads
import pino from 'pino';
import { Logtail } from '@logtail/node';

export interface LogTransportConfig {
  betterStackToken?: string;
  enableConsole?: boolean;
  enableBetterStack?: boolean;
  environment?: string;
  service?: string;
}

let logtailInstance: Logtail | null = null;

/**
 * Create a configured Pino logger with Better Stack integration
 */
export function createMultiTransportLogger(config: LogTransportConfig): pino.Logger {
  const isDevelopment = config.environment === 'development';
  const isTest = config.environment === 'test';
  
  // Initialize Logtail if configured
  if (config.enableBetterStack && config.betterStackToken && !logtailInstance) {
    const endpoint = process.env.BETTERSTACK_INGESTION_HOST;
    logtailInstance = new Logtail(config.betterStackToken, {
      endpoint: endpoint
    } as any);
  }
  
  const loggerConfig: pino.LoggerOptions = {
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
      request: (req: any) => ({
        method: req.method,
        url: req.url,
        path: req.path,
        parameters: req.params,
        headers: {
          'user-agent': req.headers?.['user-agent'],
          'x-correlation-id': req.headers?.['x-correlation-id']
        }
      }),
      response: (res: any) => ({
        statusCode: res.statusCode,
        headers: res.getHeaders?.()
      })
    },
    // Hook to send logs to Better Stack
    hooks: {
      logMethod(inputArgs, method) {
        if (logtailInstance && inputArgs[0]) {
          const logData = inputArgs[0];
          // Send to Better Stack asynchronously
          setImmediate(() => {
            try {
              const level = typeof logData === 'object' && logData !== null && 'level' in logData 
                ? (logData as any).level 
                : 'info';
              const levelName = getLevelName(level);
              
              // Send to Better Stack with proper level
              if (logtailInstance) {
                const message = typeof logData === 'string' 
                  ? logData 
                  : JSON.stringify(logData);
                
                const context = typeof logData === 'object' && logData !== null 
                  ? logData as Record<string, any>
                  : {};
                  
                switch (levelName) {
                  case 'trace':
                  case 'debug':
                    logtailInstance.debug(message, context);
                    break;
                  case 'info':
                    logtailInstance.info(message, context);
                    break;
                  case 'warn':
                    logtailInstance.warn(message, context);
                    break;
                  case 'error':
                    logtailInstance.error(message, context);
                    break;
                  case 'fatal':
                    logtailInstance.error(message, { ...context, fatal: true });
                    break;
                  default:
                    logtailInstance.info(message, context);
                }
              }
            } catch (err) {
              console.error('Failed to send log to Better Stack:', err);
            }
          });
        }
        // Continue with normal Pino logging
        return method.apply(this, inputArgs as any);
      }
    }
  };
  
  // Configure console output
  if (config.enableConsole !== false && !isTest) {
    if (isDevelopment) {
      // Pretty print in development
      const transport = pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname'
        }
      });
      return pino(loggerConfig, transport);
    }
  }
  
  // Return standard logger
  return pino(loggerConfig);
}

function getLevelName(level: string | number): string {
  if (typeof level === 'string') return level;
  
  const levelMap: Record<number, string> = {
    10: 'trace',
    20: 'debug',
    30: 'info',
    40: 'warn',
    50: 'error',
    60: 'fatal'
  };
  
  return levelMap[level] || 'info';
}

/**
 * Initialize Better Stack monitoring (optional features)
 */
export function initializeBetterStackMonitoring(token: string) {
  if (!token) {
    return {
      trackEvent: () => {},
      trackMetric: () => {},
      flush: () => Promise.resolve()
    };
  }

  return {
    // Track custom events
    trackEvent: (eventName: string, properties?: Record<string, any>) => {
      if (logtailInstance) {
        logtailInstance.info(`Event: ${eventName}`, {
          event: eventName,
          ...properties
        });
      }
    },

    // Track metrics
    trackMetric: (metricName: string, value: number, unit?: string) => {
      if (logtailInstance) {
        logtailInstance.info(`Metric: ${metricName}`, {
          metric: metricName,
          value,
          unit: unit || 'count'
        });
      }
    },

    // Ensure all logs are sent before shutdown
    flush: async () => {
      if (logtailInstance) {
        await logtailInstance.flush();
      }
    }
  };
}