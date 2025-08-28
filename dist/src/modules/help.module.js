// src/modules/help.module.ts
// Help command module
import BaseModule from './base.module.js';
export class HelpModule extends BaseModule {
    constructor() {
        super();
        this.name = 'Help';
        this.description = 'Provides help and command information';
        this.priority = 20; // Medium priority
    }
    /**
     * Check if this module can handle help-related messages
     */
    async canHandle(text, _context) {
        const helpPatterns = [
            /^\/help$/i,
            /^\/start$/i,
            /^help$/i,
            /what can you do/i,
            /how do i/i,
            /commands/i
        ];
        return helpPatterns.some(pattern => pattern.test(text));
    }
    /**
     * Handle help requests
     */
    async handle(text, context) {
        const moduleInfo = context.core ? context.core.getModuleInfo() : [];
        let helpMessage = '🤖 **Telegram Bot Help**\n\n';
        helpMessage += 'I can help you with the following:\n\n';
        // Add module-specific help
        for (const module of moduleInfo) {
            if (module.name === 'Help')
                continue; // Skip self
            helpMessage += `**${module.name}**\n`;
            helpMessage += `${module.description}\n\n`;
        }
        // Add general commands
        helpMessage += '**General Commands:**\n';
        helpMessage += '• /help - Show this help message\n';
        helpMessage += '• /trading-help - Trading-specific commands\n\n';
        helpMessage += '**Natural Language:**\n';
        helpMessage += 'You can also just type questions naturally!\n';
        helpMessage += 'Examples:\n';
        helpMessage += '• "What is Bitcoin?"\n';
        helpMessage += '• "Check my trading positions"\n\n';
        helpMessage += '**Available Commands:**\n';
        helpMessage += '• /position - View your trading positions\n';
        helpMessage += '• /trading-help - More trading commands\n\n';
        helpMessage += '💡 **Tip:** Start commands with `/` or just ask me anything!';
        return helpMessage;
    }
}
export default HelpModule;
//# sourceMappingURL=help.module.js.map