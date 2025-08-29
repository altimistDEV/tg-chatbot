import { createLogger, createCorrelationId, createSessionId, LogAction } from '../utils/enhanced-logger.js';
// Session storage (in production, use Redis or similar)
const sessionStore = new Map();
// Middleware for Express HTTP requests
export function loggingMiddleware(req, res, next) {
    // Create correlation ID for this request
    const correlationId = createCorrelationId();
    req.correlationId = correlationId;
    req.startTime = Date.now();
    // Create logger for this request
    req.logger = createLogger({ correlationId });
    // Log incoming request
    req.logger.info(LogAction.API_CALL, {
        message: `Incoming ${req.method} request`,
        metadata: {
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.get('user-agent')
        }
    });
    // Capture response
    const originalSend = res.send;
    res.send = function (data) {
        res.send = originalSend;
        // Log response
        const duration = Date.now() - (req.startTime || 0);
        req.logger?.info(LogAction.API_CALL, {
            message: `Request completed`,
            metadata: {
                method: req.method,
                url: req.url,
                statusCode: res.statusCode,
                duration
            },
            performance: {
                responseTime: duration
            },
            result: res.statusCode < 400 ? 'success' : 'failure'
        });
        return res.send(data);
    };
    next();
}
// Extract user context from Telegram update
export function extractTelegramUserContext(ctx) {
    const from = ctx.from;
    const chat = ctx.chat;
    return {
        userId: from?.id?.toString() || 'unknown',
        username: from?.username,
        firstName: from?.first_name,
        lastName: from?.last_name,
        platform: 'telegram',
        sessionId: getOrCreateSession(from?.id?.toString() || 'unknown')
    };
}
// Get or create session for user
function getOrCreateSession(userId) {
    let sessionId = sessionStore.get(userId);
    if (!sessionId) {
        sessionId = createSessionId();
        sessionStore.set(userId, sessionId);
        // Clear old sessions periodically (in production, use TTL in Redis)
        setTimeout(() => {
            sessionStore.delete(userId);
        }, 24 * 60 * 60 * 1000); // 24 hours
    }
    return sessionId;
}
// Create logger for Telegram context
export function createTelegramLogger(ctx, correlationId) {
    const userContext = extractTelegramUserContext(ctx);
    const logger = createLogger({
        correlationId: correlationId || createCorrelationId(),
        userContext
    });
    // Log session start if new session
    if (!sessionStore.has(userContext.userId)) {
        logger.info(LogAction.USER_SESSION_START, {
            message: `New session started for user @${userContext.username || userContext.userId}`,
            metadata: {
                platform: 'telegram',
                userDetails: {
                    firstName: userContext.firstName,
                    lastName: userContext.lastName,
                    username: userContext.username
                }
            }
        });
    }
    return logger;
}
// Error handling middleware
export function errorLoggingMiddleware(err, req, res, next) {
    const logger = req.logger || createLogger({ correlationId: req.correlationId });
    logger.error(LogAction.ERROR, {
        type: err.name,
        message: err.message,
        severity: 'high',
        stackTrace: err.stack
    }, {
        metadata: {
            method: req.method,
            url: req.url,
            body: req.body,
            params: req.params,
            query: req.query
        }
    });
    res.status(500).json({
        error: 'Internal server error',
        correlationId: req.correlationId
    });
}
//# sourceMappingURL=logging.middleware.js.map