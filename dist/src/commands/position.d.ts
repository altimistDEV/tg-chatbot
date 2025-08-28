import { TelegramResponseContext } from '../types/index.js';
import UserService from '../services/userService.js';
export declare class PositionCommand {
    private userService;
    constructor(userService: UserService);
    /**
     * Execute position command - show all positions
     */
    execute(ctx: TelegramResponseContext, userId: number): Promise<void>;
    /**
     * Execute detailed position command for specific coin
     */
    executeDetailed(ctx: TelegramResponseContext, userId: number, coin: string): Promise<void>;
    /**
     * Fetch positions from Hyperliquid API
     */
    private fetchPositions;
    /**
     * Fetch current market prices
     */
    private fetchMarketPrices;
    /**
     * Format positions into a readable message
     */
    private formatPositionsMessage;
    /**
     * Format detailed position message for specific coin
     */
    private formatDetailedPositionMessage;
}
export default PositionCommand;
//# sourceMappingURL=position.d.ts.map