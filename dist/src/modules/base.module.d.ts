import { BaseModuleInterface, MessageContext } from '../types/index.js';
export declare abstract class BaseModule implements BaseModuleInterface {
    name: string;
    description: string;
    priority: number;
    constructor();
    /**
     * Check if this module can handle the given message
     * @param text - User message
     * @param context - Context object with chatId, history, etc.
     * @returns True if module can handle
     */
    abstract canHandle(text: string, context: MessageContext): Promise<boolean>;
    /**
     * Handle the message and return a response
     * @param text - User message
     * @param context - Context object
     * @returns Response message
     */
    abstract handle(text: string, context: MessageContext): Promise<string>;
    /**
     * Optional: Initialize module (called once on load)
     */
    initialize(): Promise<void>;
    /**
     * Optional: Cleanup module (called on unload)
     */
    cleanup(): Promise<void>;
    /**
     * Helper: Extract command and arguments from text
     * @param text - User message
     * @returns { command, args }
     */
    protected parseCommand(text: string): {
        command: string;
        args: string[];
        fullText: string;
    };
}
export default BaseModule;
//# sourceMappingURL=base.module.d.ts.map