import { Request, Response, NextFunction } from 'express';
import { createLogger, UserContext } from '../utils/enhanced-logger.js';
import { Context } from 'telegraf';
declare global {
    namespace Express {
        interface Request {
            logger?: ReturnType<typeof createLogger>;
            correlationId?: string;
            sessionId?: string;
            startTime?: number;
        }
    }
}
export declare function loggingMiddleware(req: Request, res: Response, next: NextFunction): void;
export declare function extractTelegramUserContext(ctx: Context): UserContext;
export declare function createTelegramLogger(ctx: Context, correlationId?: string): ReturnType<typeof createLogger>;
export declare function errorLoggingMiddleware(err: Error, req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=logging.middleware.d.ts.map