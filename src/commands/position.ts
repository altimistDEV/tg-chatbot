// src/commands/position.ts
// Position command handler for Hyperliquid trading

import { formatMessage } from '../utils/formatter.js';
import { TelegramResponseContext, HyperliquidResponse, HyperliquidAllMids } from '../types/index.js';
import UserService from '../services/userService.js';
import logger from '../utils/logger.js';

export class PositionCommand {
  private userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  /**
   * Execute position command - show all positions
   */
  async execute(ctx: TelegramResponseContext, userId: number): Promise<void> {
    try {
      const walletAddress = await this.userService.getUserWallet(userId);
      
      // Debug logging
      logger.info('Position command execution', {
        userId,
        walletAddress,
        nodeEnv: process.env.NODE_ENV
      });

      if (!walletAddress) {
        await ctx.reply(
          '❌ **No wallet configured**\n\n' +
          'Unable to retrieve wallet information.'
        );
        return;
      }

      const positions = await this.fetchPositions(walletAddress);

      if (!positions || positions.length === 0) {
        await ctx.reply(
          '📊 **No Open Positions**\n\n' +
          `Wallet: \`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}\`\n` +
          'No positions found on Hyperliquid.'
        );
        return;
      }

      const message = await this.formatPositionsMessage(positions, walletAddress);
      await ctx.reply(formatMessage(message, 'markdown'));

    } catch (error) {
      logger.error('Position command error:', error);
      await ctx.reply('❌ Failed to fetch positions. Please try again later.');
    }
  }

  /**
   * Execute detailed position command for specific coin
   */
  async executeDetailed(ctx: TelegramResponseContext, userId: number, coin: string): Promise<void> {
    try {
      const walletAddress = await this.userService.getUserWallet(userId);

      if (!walletAddress) {
        await ctx.reply('❌ Unable to retrieve wallet information');
        return;
      }

      const positions = await this.fetchPositions(walletAddress);
      const position = positions?.find(p => 
        p.position.coin.toLowerCase() === coin.toLowerCase()
      );

      if (!position) {
        await ctx.reply(`📊 No open position found for ${coin.toUpperCase()}`);
        return;
      }

      const message = await this.formatDetailedPositionMessage(position, walletAddress);
      await ctx.reply(formatMessage(message, 'markdown'));

    } catch (error) {
      logger.error('Detailed position command error:', error);
      await ctx.reply('❌ Failed to fetch position details. Please try again later.');
    }
  }

  /**
   * Fetch positions from Hyperliquid API
   */
  private async fetchPositions(walletAddress: string): Promise<HyperliquidResponse['assetPositions'] | null> {
    try {
      const apiUrl = process.env.HYPERLIQUID_API_URL || 'https://api.hyperliquid.xyz';
      const response = await fetch(`${apiUrl}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'clearinghouseState',
          user: walletAddress
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: any = await response.json();
      
      // Debug logging - show full response structure
      logger.info('Hyperliquid API response', {
        walletAddress,
        hasAssetPositions: !!data.assetPositions,
        positionsCount: data.assetPositions?.length || 0,
        firstPosition: data.assetPositions?.[0]?.position?.coin,
        marginSummary: data.marginSummary,
        fullResponse: JSON.stringify(data).substring(0, 500)
      });
      
      return data.assetPositions || null;

    } catch (error) {
      logger.error('Failed to fetch positions:', error);
      throw error;
    }
  }

  /**
   * Fetch current market prices
   */
  private async fetchMarketPrices(): Promise<HyperliquidAllMids | null> {
    try {
      const apiUrl = process.env.HYPERLIQUID_API_URL || 'https://api.hyperliquid.xyz';
      const response = await fetch(`${apiUrl}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'allMids'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      logger.error('Failed to fetch market prices:', error);
      return null;
    }
  }

  /**
   * Format positions into a readable message
   */
  private async formatPositionsMessage(
    positions: HyperliquidResponse['assetPositions'],
    walletAddress: string
  ): Promise<string> {
    const marketPrices = await this.fetchMarketPrices();

    let message = '📊 **Your Positions**\n\n';
    message += `Wallet: \`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}\`\n\n`;

    let totalPnl = 0;

    for (const pos of positions) {
      const { coin, szi, entryPx, positionValue, unrealizedPnl } = pos.position;
      const size = parseFloat(szi);
      const entry = parseFloat(entryPx);
      const value = parseFloat(positionValue);
      const pnl = parseFloat(unrealizedPnl);

      totalPnl += pnl;

      const currentPrice = marketPrices?.[coin] ? parseFloat(marketPrices[coin]) : null;
      const side = size > 0 ? 'LONG' : 'SHORT';
      const pnlEmoji = pnl >= 0 ? '🟢' : '🔴';

      message += `**${coin}** ${side}\n`;
      message += `• Size: ${Math.abs(size).toFixed(4)}\n`;
      message += `• Entry: $${entry.toFixed(2)}\n`;
      
      if (currentPrice) {
        message += `• Current: $${currentPrice.toFixed(2)}\n`;
      }
      
      message += `• Value: $${Math.abs(value).toFixed(2)}\n`;
      message += `• PnL: ${pnlEmoji} $${pnl.toFixed(2)}\n\n`;
    }

    const totalPnlEmoji = totalPnl >= 0 ? '🟢' : '🔴';
    message += `**Total PnL: ${totalPnlEmoji} $${totalPnl.toFixed(2)}**`;

    return message;
  }

  /**
   * Format detailed position message for specific coin
   */
  private async formatDetailedPositionMessage(
    position: HyperliquidResponse['assetPositions'][0],
    walletAddress: string
  ): Promise<string> {
    const { coin, szi, entryPx, positionValue, unrealizedPnl } = position.position;
    const size = parseFloat(szi);
    const entry = parseFloat(entryPx);
    const value = parseFloat(positionValue);
    const pnl = parseFloat(unrealizedPnl);

    const marketPrices = await this.fetchMarketPrices();
    const currentPrice = marketPrices?.[coin] ? parseFloat(marketPrices[coin]) : null;

    const side = size > 0 ? 'LONG' : 'SHORT';
    const pnlEmoji = pnl >= 0 ? '🟢' : '🔴';
    const sideEmoji = side === 'LONG' ? '📈' : '📉';

    let message = `📊 **${coin} Position Details**\n\n`;
    message += `Wallet: \`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}\`\n\n`;
    
    message += `${sideEmoji} **${side} Position**\n`;
    message += `• Coin: **${coin}**\n`;
    message += `• Size: **${Math.abs(size).toFixed(4)}**\n`;
    message += `• Entry Price: **$${entry.toFixed(2)}**\n`;
    
    if (currentPrice) {
      message += `• Current Price: **$${currentPrice.toFixed(2)}**\n`;
      const priceChange = ((currentPrice - entry) / entry) * 100;
      const changeEmoji = priceChange >= 0 ? '📈' : '📉';
      message += `• Price Change: ${changeEmoji} **${priceChange.toFixed(2)}%**\n`;
    }
    
    message += `• Position Value: **$${Math.abs(value).toFixed(2)}**\n`;
    message += `• Unrealized PnL: ${pnlEmoji} **$${pnl.toFixed(2)}**\n`;

    if (pnl !== 0) {
      const pnlPercentage = (pnl / Math.abs(value)) * 100;
      message += `• PnL %: ${pnlEmoji} **${pnlPercentage.toFixed(2)}%**\n`;
    }

    return message;
  }
}

export default PositionCommand;