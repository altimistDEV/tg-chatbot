import pino from 'pino';
import { randomUUID } from 'crypto';

// Log levels
export enum LogLevel {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
  AUDIT = 'audit'
}

// Log action types
export enum LogAction {
  // User actions
  COMMAND_EXECUTED = 'COMMAND_EXECUTED',
  USER_REGISTERED = 'USER_REGISTERED',
  USER_SESSION_START = 'USER_SESSION_START',
  USER_SESSION_END = 'USER_SESSION_END',
  
  // Trading actions
  POSITION_CHECKED = 'POSITION_CHECKED',
  TRADE_ANALYSIS_REQUESTED = 'TRADE_ANALYSIS_REQUESTED',
  PORTFOLIO_VIEWED = 'PORTFOLIO_VIEWED',
  
  // System actions
  MODULE_LOADED = 'MODULE_LOADED',
  SERVER_STARTED = 'SERVER_STARTED',
  HEALTH_CHECK = 'HEALTH_CHECK',
  
  // API actions
  API_CALL = 'API_CALL',
  API_ERROR = 'API_ERROR',
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  
  // AI actions
  AI_REQUEST = 'AI_REQUEST',
  AI_RESPONSE = 'AI_RESPONSE',
  WEB_SEARCH = 'WEB_SEARCH',
  
  // Error actions
  ERROR = 'ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  
  // Sensitive/Audit actions
  SENSITIVE_COMMAND = 'SENSITIVE_COMMAND',
  CONFIG_CHANGED = 'CONFIG_CHANGED',
  SECURITY_EVENT = 'SECURITY_EVENT'
}

// User context interface
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

// Performance metrics interface
export interface PerformanceMetrics {
  responseTime?: number;
  apiCalls?: Record<string, number>;
  dbQueries?: number;
  cacheHits?: number;
  cacheMisses?: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

// Error details interface
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

// Main log entry interface
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

class EnhancedLogger {
  private logger: pino.Logger;
  private correlationId: string;
  private startTime: number;
  private userContext?: UserContext;
  private performanceCollector: Map<string, number>;
  
  constructor(options?: { correlationId?: string; userContext?: UserContext }) {
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
    }) as any; // Type assertion for custom levels
  }
  
  // Set or update user context
  setUserContext(context: UserContext): void {
    this.userContext = {
      ...this.userContext,
      ...context
    };
  }
  
  // Create a child logger with inherited context
  child(options: { correlationId?: string; module?: string }): EnhancedLogger {
    const childLogger = new EnhancedLogger({
      correlationId: options.correlationId || this.correlationId,
      userContext: this.userContext
    });
    return childLogger;
  }
  
  // Start performance timing
  startTimer(label: string): void {
    this.performanceCollector.set(label, Date.now());
  }
  
  // End performance timing
  endTimer(label: string): number {
    const startTime = this.performanceCollector.get(label);
    if (!startTime) return 0;
    
    const duration = Date.now() - startTime;
    this.performanceCollector.delete(label);
    return duration;
  }
  
  // Core logging method
  private log(level: LogLevel, action: LogAction, data: Partial<LogEntry>): void {
    const entry: LogEntry = {
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
  info(action: LogAction, data: Partial<LogEntry>): void {
    this.log(LogLevel.INFO, action, data);
  }
  
  warn(action: LogAction, data: Partial<LogEntry>): void {
    this.log(LogLevel.WARN, action, data);
  }
  
  error(action: LogAction, error: Error | ErrorDetails, data?: Partial<LogEntry>): void {
    const errorDetails: ErrorDetails = 'severity' in error 
      ? error as ErrorDetails
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
  
  audit(action: LogAction, data: Partial<LogEntry>): void {
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
  logCommand(command: string, module: string, result: 'success' | 'failure', metadata?: any): void {
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
  logApiCall(
    service: string, 
    endpoint: string, 
    duration: number, 
    status: 'success' | 'failure',
    error?: Error
  ): void {
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
  logTrading(
    action: 'position_check' | 'analysis' | 'portfolio_view',
    data: any,
    performance?: PerformanceMetrics
  ): void {
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
  logSensitive(command: string, authorized: boolean, result: any): void {
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
let globalLogger: EnhancedLogger | null = null;

export function createLogger(options?: { correlationId?: string; userContext?: UserContext }): EnhancedLogger {
  if (!globalLogger) {
    globalLogger = new EnhancedLogger(options);
  }
  return options ? globalLogger.child(options) : globalLogger;
}

// Create correlation ID for new requests
export function createCorrelationId(): string {
  return `req_${randomUUID().substring(0, 12)}`;
}

// Create session ID for users
export function createSessionId(): string {
  return `sess_${randomUUID().substring(0, 12)}`;
}

export default EnhancedLogger;