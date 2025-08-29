import pino from 'pino';
export interface LogTransportConfig {
    betterStackToken?: string;
    enableConsole?: boolean;
    enableBetterStack?: boolean;
    environment?: string;
    service?: string;
}
/**
 * Create Pino transports based on configuration
 */
export declare function createLogTransports(config: LogTransportConfig): any;
/**
 * Create a configured Pino logger with multiple transports
 */
export declare function createMultiTransportLogger(config: LogTransportConfig): pino.Logger;
/**
 * Initialize Better Stack monitoring (optional features)
 */
export declare function initializeBetterStackMonitoring(token: string): {
    trackEvent: (eventName: string, properties?: Record<string, any>) => void;
    trackMetric: (metricName: string, value: number, unit?: string) => void;
    flush: () => Promise<void>;
};
//# sourceMappingURL=log-transport.d.ts.map