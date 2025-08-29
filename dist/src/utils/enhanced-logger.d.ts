export declare enum LogLevel {
    TRACE = "trace",
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error",
    FATAL = "fatal",
    AUDIT = "audit"
}
export declare enum LogAction {
    COMMAND_EXECUTED = "COMMAND_EXECUTED",
    USER_REGISTERED = "USER_REGISTERED",
    USER_SESSION_START = "USER_SESSION_START",
    USER_SESSION_END = "USER_SESSION_END",
    POSITION_CHECKED = "POSITION_CHECKED",
    TRADE_ANALYSIS_REQUESTED = "TRADE_ANALYSIS_REQUESTED",
    PORTFOLIO_VIEWED = "PORTFOLIO_VIEWED",
    MODULE_LOADED = "MODULE_LOADED",
    SERVER_STARTED = "SERVER_STARTED",
    HEALTH_CHECK = "HEALTH_CHECK",
    API_CALL = "API_CALL",
    API_ERROR = "API_ERROR",
    API_RATE_LIMIT = "API_RATE_LIMIT",
    AI_REQUEST = "AI_REQUEST",
    AI_RESPONSE = "AI_RESPONSE",
    WEB_SEARCH = "WEB_SEARCH",
    ERROR = "ERROR",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    PERMISSION_DENIED = "PERMISSION_DENIED",
    SENSITIVE_COMMAND = "SENSITIVE_COMMAND",
    CONFIG_CHANGED = "CONFIG_CHANGED",
    SECURITY_EVENT = "SECURITY_EVENT"
}
export interface UserContext {
    userId: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    platform: 'telegram' | 'whatsapp' | 'discord';
    userTier?: 'free' | 'premium' | 'vip';
    accountAge?: number;
    sessionId?: string;
    previousCommand?: string;
    commandCount?: number;
}
export interface PerformanceMetrics {
    responseTime?: number;
    apiCalls?: Record<string, number>;
    dbQueries?: number;
    cacheHits?: number;
    cacheMisses?: number;
    memoryUsage?: number;
    cpuUsage?: number;
}
export interface ErrorDetails {
    type: string;
    message: string;
    code?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    stackTrace?: string;
    retry?: {
        attempt: number;
        maxAttempts: number;
        nextRetryIn?: number;
    };
    impact?: {
        featuresAffected: string[];
        userExperience: 'normal' | 'degraded' | 'unavailable';
        estimatedRecovery?: string;
    };
}
export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    correlationId: string;
    action: LogAction;
    message?: string;
    userId?: string;
    username?: string;
    sessionId?: string;
    module?: string;
    command?: string;
    context?: Record<string, any>;
    performance?: PerformanceMetrics;
    error?: ErrorDetails;
    metadata?: Record<string, any>;
    result?: 'success' | 'failure' | 'partial';
    duration?: number;
}
declare class EnhancedLogger {
    private logger;
    private correlationId;
    private startTime;
    private userContext?;
    private performanceCollector;
    constructor(options?: {
        correlationId?: string;
        userContext?: UserContext;
    });
    setUserContext(context: UserContext): void;
    child(options: {
        correlationId?: string;
        module?: string;
    }): EnhancedLogger;
    startTimer(label: string): void;
    endTimer(label: string): number;
    private log;
    info(action: LogAction, data: Partial<LogEntry>): void;
    warn(action: LogAction, data: Partial<LogEntry>): void;
    error(action: LogAction, error: Error | ErrorDetails, data?: Partial<LogEntry>): void;
    audit(action: LogAction, data: Partial<LogEntry>): void;
    logCommand(command: string, module: string, result: 'success' | 'failure', metadata?: any): void;
    logApiCall(service: string, endpoint: string, duration: number, status: 'success' | 'failure', error?: Error): void;
    logTrading(action: 'position_check' | 'analysis' | 'portfolio_view', data: any, performance?: PerformanceMetrics): void;
    logSensitive(command: string, authorized: boolean, result: any): void;
}
export declare function createLogger(options?: {
    correlationId?: string;
    userContext?: UserContext;
}): EnhancedLogger;
export declare function createCorrelationId(): string;
export declare function createSessionId(): string;
export default EnhancedLogger;
//# sourceMappingURL=enhanced-logger.d.ts.map