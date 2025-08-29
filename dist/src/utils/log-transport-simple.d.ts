import pino from 'pino';
export interface LogTransportConfig {
    betterStackToken?: string;
    enableConsole?: boolean;
    enableBetterStack?: boolean;
    environment?: string;
    service?: string;
}
/**
 * Create a configured Pino logger with Better Stack integration
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
//# sourceMappingURL=log-transport-simple.d.ts.map