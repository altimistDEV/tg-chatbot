import pino from 'pino';
import { randomUUID } from 'crypto';
// Log levels
export var LogLevel;
(function (LogLevel) {
    LogLevel["TRACE"] = "trace";
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
    LogLevel["FATAL"] = "fatal";
    LogLevel["AUDIT"] = "audit";
})(LogLevel || (LogLevel = {}));
// Log action types
export var LogAction;
(function (LogAction) {
    // User actions
    LogAction["COMMAND_EXECUTED"] = "COMMAND_EXECUTED";
    LogAction["USER_REGISTERED"] = "USER_REGISTERED";
    LogAction["USER_SESSION_START"] = "USER_SESSION_START";
    LogAction["USER_SESSION_END"] = "USER_SESSION_END";
    // Trading actions
    LogAction["POSITION_CHECKED"] = "POSITION_CHECKED";
    LogAction["TRADE_ANALYSIS_REQUESTED"] = "TRADE_ANALYSIS_REQUESTED";
    LogAction["PORTFOLIO_VIEWED"] = "PORTFOLIO_VIEWED";
    // System actions
    LogAction["MODULE_LOADED"] = "MODULE_LOADED";
    LogAction["SERVER_STARTED"] = "SERVER_STARTED";
    LogAction["HEALTH_CHECK"] = "HEALTH_CHECK";
    // API actions
    LogAction["API_CALL"] = "API_CALL";
    LogAction["API_ERROR"] = "API_ERROR";
    LogAction["API_RATE_LIMIT"] = "API_RATE_LIMIT";
    // AI actions
    LogAction["AI_REQUEST"] = "AI_REQUEST";
    LogAction["AI_RESPONSE"] = "AI_RESPONSE";
    LogAction["WEB_SEARCH"] = "WEB_SEARCH";
    // Error actions
    LogAction["ERROR"] = "ERROR";
    LogAction["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    LogAction["PERMISSION_DENIED"] = "PERMISSION_DENIED";
    // Sensitive/Audit actions
    LogAction["SENSITIVE_COMMAND"] = "SENSITIVE_COMMAND";
    LogAction["CONFIG_CHANGED"] = "CONFIG_CHANGED";
    LogAction["SECURITY_EVENT"] = "SECURITY_EVENT";
})(LogAction || (LogAction = {}));
class EnhancedLogger {
    logger;
    correlationId;
    startTime;
    userContext;
    performanceCollector;
    constructor(options) {
        this.correlationId = options?.correlationId || randomUUID();
        this.userContext = options?.userContext;
        this.startTime = Date.now();
        this.performanceCollector = new Map();
        // Configure Pino with custom formatting
        this.logger = pino({
            level: process.env.LOG_LEVEL || 'info',
            formatters: {
                level: (label) => ({ level: label }),
                bindings: () => ({})
            },
            timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
            messageKey: 'message'
        }); // Type assertion for custom levels
    }
    // Set or update user context
    setUserContext(context) {
        this.userContext = {
            ...this.userContext,
            ...context
        };
    }
    // Create a child logger with inherited context
    child(options) {
        const childLogger = new EnhancedLogger({
            correlationId: options.correlationId || this.correlationId,
            userContext: this.userContext
        });
        return childLogger;
    }
    // Start performance timing
    startTimer(label) {
        this.performanceCollector.set(label, Date.now());
    }
    // End performance timing
    endTimer(label) {
        const startTime = this.performanceCollector.get(label);
        if (!startTime)
            return 0;
        const duration = Date.now() - startTime;
        this.performanceCollector.delete(label);
        return duration;
    }
    // Core logging method
    log(level, action, data) {
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            correlationId: this.correlationId,
            action,
            userId: this.userContext?.userId,
            username: this.userContext?.username,
            sessionId: this.userContext?.sessionId,
            duration: Date.now() - this.startTime,
            ...data
        };
        // Add platform-specific username formatting
        if (this.userContext?.username) {
            entry.username = `@${this.userContext.username}`;
        }
        // Add full name if available
        if (this.userContext?.firstName || this.userContext?.lastName) {
            entry.metadata = {
                ...entry.metadata,
                fullName: `${this.userContext.firstName || ''} ${this.userContext.lastName || ''}`.trim()
            };
        }
        // Use appropriate Pino method
        switch (level) {
            case LogLevel.TRACE:
                this.logger.trace(entry);
                break;
            case LogLevel.DEBUG:
                this.logger.debug(entry);
                break;
            case LogLevel.INFO:
                this.logger.info(entry);
                break;
            case LogLevel.WARN:
                this.logger.warn(entry);
                break;
            case LogLevel.ERROR:
                this.logger.error(entry);
                break;
            case LogLevel.FATAL:
                this.logger.fatal(entry);
                break;
            case LogLevel.AUDIT:
                // Log audit events as info with audit flag
                this.logger.info({ ...entry, audit: true });
                break;
        }
    }
    // Convenience methods
    info(action, data) {
        this.log(LogLevel.INFO, action, data);
    }
    warn(action, data) {
        this.log(LogLevel.WARN, action, data);
    }
    error(action, error, data) {
        const errorDetails = 'severity' in error
            ? error
            : {
                type: error.name || 'UnknownError',
                message: error.message,
                severity: 'medium',
                stackTrace: error.stack
            };
        this.log(LogLevel.ERROR, action, {
            ...data,
            error: errorDetails
        });
    }
    audit(action, data) {
        this.log(LogLevel.AUDIT, action, {
            ...data,
            metadata: {
                ...data.metadata,
                compliance: {
                    logged: true,
                    timestamp: new Date().toISOString(),
                    retention: '7_years'
                }
            }
        });
    }
    // Log command execution
    logCommand(command, module, result, metadata) {
        const duration = this.endTimer('command_execution');
        this.info(LogAction.COMMAND_EXECUTED, {
            command,
            module,
            result,
            metadata,
            performance: {
                responseTime: duration
            },
            context: {
                userTier: this.userContext?.userTier,
                accountAge: this.userContext?.accountAge,
                previousCommand: this.userContext?.previousCommand,
                commandCount: this.userContext?.commandCount
            }
        });
    }
    // Log API calls
    logApiCall(service, endpoint, duration, status, error) {
        const action = status === 'success' ? LogAction.API_CALL : LogAction.API_ERROR;
        this.info(action, {
            module: service,
            metadata: {
                endpoint,
                status
            },
            performance: {
                responseTime: duration,
                apiCalls: { [service]: 1 }
            },
            error: error ? {
                type: 'APIError',
                message: error.message,
                severity: 'medium'
            } : undefined
        });
    }
    // Log trading activities
    logTrading(action, data, performance) {
        const actionMap = {
            'position_check': LogAction.POSITION_CHECKED,
            'analysis': LogAction.TRADE_ANALYSIS_REQUESTED,
            'portfolio_view': LogAction.PORTFOLIO_VIEWED
        };
        this.info(actionMap[action], {
            metadata: data,
            performance,
            context: {
                platform: this.userContext?.platform,
                userTier: this.userContext?.userTier
            }
        });
    }
    // Log sensitive operations for audit
    logSensitive(command, authorized, result) {
        this.audit(LogAction.SENSITIVE_COMMAND, {
            command,
            metadata: {
                authorized,
                result,
                userPlatform: this.userContext?.platform,
                userIdentity: {
                    userId: this.userContext?.userId,
                    username: this.userContext?.username,
                    fullName: `${this.userContext?.firstName || ''} ${this.userContext?.lastName || ''}`.trim()
                }
            }
        });
    }
}
// Singleton logger instance factory
let globalLogger = null;
export function createLogger(options) {
    if (!globalLogger) {
        globalLogger = new EnhancedLogger(options);
    }
    return options ? globalLogger.child(options) : globalLogger;
}
// Create correlation ID for new requests
export function createCorrelationId() {
    return `req_${randomUUID().substring(0, 12)}`;
}
// Create session ID for users
export function createSessionId() {
    return `sess_${randomUUID().substring(0, 12)}`;
}
export default EnhancedLogger;
//# sourceMappingURL=enhanced-logger.js.map