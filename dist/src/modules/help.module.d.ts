import BaseModule from './base.module.js';
import { MessageContext } from '../types/index.js';
export declare class HelpModule extends BaseModule {
    constructor();
    /**
     * Check if this module can handle help-related messages
     */
    canHandle(text: string, _context: MessageContext): Promise<boolean>;
    /**
     * Handle help requests
     */
    handle(text: string, context: MessageContext): Promise<string>;
}
export default HelpModule;
//# sourceMappingURL=help.module.d.ts.map