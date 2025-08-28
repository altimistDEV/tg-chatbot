// src/modules/trading.module.ts
// Trading module for Hyperliquid integration
import BaseModule from './base.module.js';
import PositionCommand from '../commands/position.js';
import UserService from '../services/userService.js';
import logger from '../utils/logger.js';
export class TradingModule extends BaseModule {
    userService;
    positionCommand;
    patterns;
    constructor() {
        super();
        this.name = 'Trading';
        this.description = 'Handles trading commands and position queries for Hyperliquid';
        this.priority = 10; // High priority for trading commands
        // Initialize services
        this.userService = new UserService();
        this.positionCommand = new PositionCommand(this.userService);
        // Define command patterns
        this.patterns = {
            position: [
                /^\/position$/i,
                /^\/pos$/i,
                /^\/portfolio$/i,
                /my position/i,
                /check position/i,
                /show position/i,
                /what's my position/i,
                /what are my positions/i,
                /open positions/i,
                /current positions/i
            ],
            positionDetail: [
                /^\/position_detail\s+(\w+)/i,
                /position\s+(btc|eth|sol|matic|arb|op|avax|bnb|ada|dot)/i,
                /show\s+(btc|eth|sol|matic|arb|op|avax|bnb|ada|dot)\s+position/i
            ],
            help: [
                /^\/trading_help/i,
                /^\/trading-help/i,
                /^\/tradinghelp/i,
                /trading commands/i,
                /how to check position/i
            ]
        };
    }
    /**
     * Check if this module can handle the message
     */
    async canHandle(text, _context) {
        for (const patterns of Object.values(this.patterns)) {
            for (const pattern of patterns) {
                if (pattern.test(text)) {
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * Handle the trading command
     */
    async handle(text, context) {
        const { chatId } = context;
        // Detect command type
        const command = this.detectCommand(text);
        if (!command) {
            return 'Trading command not recognized. Use /trading-help for available commands.';
        }
        // Create a response context
        let response = '';
        const responseCtx = {
            reply: async (message, _options) => {
                response = message;
                return Promise.resolve();
            },
            from: { id: chatId }
        };
        try {
            switch (command.type) {
                case 'position':
                    await this.positionCommand.execute(responseCtx, chatId);
                    break;
                case 'positionDetail':
                    if (command.coin) {
                        await this.positionCommand.executeDetailed(responseCtx, chatId, command.coin);
                    }
                    else {
                        response = '❌ Please specify a coin. Example: `/position_detail BTC`';
                    }
                    break;
                case 'help':
                    response = this.getHelpMessage();
                    break;
                default:
                    response = 'Unknown trading command. Use /trading-help for available commands.';
            }
        }
        catch (error) {
            logger.error('Trading module error:', error);
            response = '❌ Error processing trading command. Please try again later.';
        }
        return response;
    }
    /**
     * Detect which command is being used
     */
    detectCommand(text) {
        for (const [commandType, patterns] of Object.entries(this.patterns)) {
            for (const pattern of patterns) {
                const match = text.match(pattern);
                if (match) {
                    return {
                        type: commandType,
                        match: match,
                        coin: match && match[1] ? match[1].toUpperCase() : null,
                        address: match && match[1] ? match[1] : null
                    };
                }
            }
        }
        return null;
    }
    /**
     * Get help message for trading commands
     */
    getHelpMessage() {
        return '📊 **Trading Commands**\n\n' +
            '**Position Management:**\n' +
            '• /position - View all your positions\n' +
            '• /pos - Short alias for position\n' +
            '• /portfolio - View your portfolio\n' +
            '• /position_detail COIN - Detailed view of specific coin\n\n' +
            '**Natural Language:**\n' +
            'You can also use phrases like:\n' +
            '• "show my positions"\n' +
            '• "check my portfolio"\n' +
            '• "what\'s my BTC position"\n\n' +
            '**Exchange:** Hyperliquid DEX\n' +
            '**Network:** Arbitrum';
    }
}
export default TradingModule;
//# sourceMappingURL=trading.module.js.map