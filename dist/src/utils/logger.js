// src/utils/logger.ts
// Structured logging with Pino
import pino from 'pino';
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';
const loggerConfig = {
    level: process.env.LOG_LEVEL || 'info',
    // Pretty print in development
    ...(isDevelopment && {
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'HH:MM:ss',
                ignore: 'pid,hostname'
            }
        }
    }),
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
            'serpapi_key'
        ],
        censor: '[REDACTED]'
    },
    // Disable logging in test environment
    ...(isTest && { level: 'silent' })
};
const logger = pino(loggerConfig);
// Export logger with proper typing
const typedLogger = {
    info: (msg, obj) => {
        if (typeof msg === 'string' && obj) {
            logger.info(obj, msg);
        }
        else {
            logger.info(msg);
        }
    },
    error: (msg, obj) => {
        if (typeof msg === 'string' && obj) {
            logger.error(obj, msg);
        }
        else {
            logger.error(msg);
        }
    },
    warn: (msg, obj) => {
        if (typeof msg === 'string' && obj) {
            logger.warn(obj, msg);
        }
        else {
            logger.warn(msg);
        }
    },
    debug: (msg, obj) => {
        if (typeof msg === 'string' && obj) {
            logger.debug(obj, msg);
        }
        else {
            logger.debug(msg);
        }
    },
    trace: (msg, obj) => {
        if (typeof msg === 'string' && obj) {
            logger.trace(obj, msg);
        }
        else {
            logger.trace(msg);
        }
    },
    fatal: (msg, obj) => {
        if (typeof msg === 'string' && obj) {
            logger.fatal(obj, msg);
        }
        else {
            logger.fatal(msg);
        }
    }
};
export default typedLogger;
//# sourceMappingURL=logger.js.map