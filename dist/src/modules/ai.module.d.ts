import BaseModule from './base.module.js';
import { MessageContext } from '../types/index.js';
export declare class AIModule extends BaseModule {
    private anthropic;
    private excludePatterns;
    constructor();
    /**
     * AI module handles everything except explicit commands
     */
    canHandle(text: string, _context: MessageContext): Promise<boolean>;
    /**
     * Handle the message with AI
     */
    handle(text: string, context: MessageContext): Promise<string>;
    /**
     * Check if web search is needed and perform it
     */
    private performWebSearchIfNeeded;
    /**
     * Build the system prompt based on context
     */
    private buildSystemPrompt;
    /**
     * Prepare messages array for Claude
     */
    private prepareMessages;
    /**
     * Get response from Claude AI
     */
    private getAIResponse;
}
export default AIModule;
//# sourceMappingURL=ai.module.d.ts.map