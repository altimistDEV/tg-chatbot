import BaseModule from './base.module.js';
import { MessageContext } from '../types/index.js';
export declare class TradingModule extends BaseModule {
    private userService;
    private positionCommand;
    private patterns;
    constructor();
    /**
     * Check if this module can handle the message
     */
    canHandle(text: string, _context: MessageContext): Promise<boolean>;
    /**
     * Handle the trading command
     */
    handle(text: string, context: MessageContext): Promise<string>;
    /**
     * Detect which command is being used
     */
    private detectCommand;
    /**
     * Get help message for trading commands
     */
    private getHelpMessage;
}
export default TradingModule;
//# sourceMappingURL=trading.module.d.ts.map