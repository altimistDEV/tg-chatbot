// index.ts
// Main application entry point

import 'dotenv/config';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Telegraf } from 'telegraf';
import Core from './src/core.js';
import getConfig from './src/config/index.js';
import logger from './src/utils/logger.js';
import { MessageContext, WebhookUpdate } from './src/types/index.js';

interface AppState {
  core: Core;
  bot: Telegraf;
  conversationHistory: Map<number, MessageContext>;
}

class ChatbotApp {
  private app: express.Application;
  private state: AppState;
  private config: ReturnType<typeof getConfig>;

  constructor() {
    this.config = getConfig();
    this.app = express();
    this.state = {
      core: new Core(),
      bot: new Telegraf(this.config.telegramBotToken),
      conversationHistory: new Map()
    };

    this.setupMiddleware();
    this.setupRoutes();
    this.setupTelegraf();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use(limiter);

    // Body parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req: Request, res: Response, next) => {
      logger.info('Incoming request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: this.config.environment,
        features: this.config.features
      });
    });

    // Telegram webhook
    this.app.post('/webhook', this.handleWebhook.bind(this));

    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.status(200).json({
        name: 'Telegram Chatbot',
        version: '2.0.0',
        description: 'Platform-agnostic modular chatbot with AI and trading features'
      });
    });

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      logger.warn({ url: req.url, method: req.method }, '404 - Route not found');
      res.status(404).json({ error: 'Route not found' });
    });

    // Error handler
    this.app.use((err: Error, req: Request, res: Response, next: Function) => {
      logger.error({ error: err.message, stack: err.stack, url: req.url }, 'Unhandled error');
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  private setupTelegraf(): void {
    // Handle text messages
    this.state.bot.on('text', async (ctx) => {
      try {
        const userId = ctx.from?.id;
        const chatId = ctx.chat.id;
        const messageText = ctx.message.text;

        if (!userId || !messageText) {
          return;
        }

        // Get or create conversation context
        let context = this.state.conversationHistory.get(chatId);
        if (!context) {
          context = {
            chatId: chatId,
            history: [],
            userId: userId
          };
          this.state.conversationHistory.set(chatId, context);
        }

        // Process message with core
        const response = await this.state.core.handleMessage(messageText, context);

        // Send response
        await ctx.reply(response);

        logger.info({
          userId,
          chatId,
          message: messageText,
          response: response.substring(0, 100) + (response.length > 100 ? '...' : '')
        }, 'Message processed');

      } catch (error) {
        logger.error('Error handling Telegram message:', error);
        await ctx.reply('❌ Sorry, I encountered an error processing your message.');
      }
    });

    // Handle errors
    this.state.bot.catch((err: any, ctx: any) => {
      logger.error({ error: err.message, userId: ctx.from?.id }, 'Telegraf error');
    });

    // Set webhook callback for Express
    this.app.use(this.state.bot.webhookCallback('/webhook'));
  }

  private async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const update: WebhookUpdate = req.body;

      if (update.message?.text && update.message?.from) {
        const userId = update.message.from.id;
        const chatId = update.message.chat.id;
        const messageText = update.message.text;

        // Get or create conversation context
        let context = this.state.conversationHistory.get(chatId);
        if (!context) {
          context = {
            chatId: chatId,
            history: [],
            userId: userId
          };
          this.state.conversationHistory.set(chatId, context);
        }

        // Process message with core
        const response = await this.state.core.handleMessage(messageText, context);

        // Send response via bot API
        await this.state.bot.telegram.sendMessage(chatId, response);

        logger.info({
          userId,
          chatId,
          message: messageText,
          responseLength: response.length
        }, 'Webhook message processed');
      }

      res.status(200).send('OK');
    } catch (error) {
      logger.error('Webhook error:', error);
      res.status(200).send('OK'); // Always return 200 to Telegram
    }
  }

  async start(): Promise<void> {
    try {
      // Initialize core
      await this.state.core.initialize();

      // For local development, use polling instead of webhooks
      if (this.config.environment === 'development') {
        // Remove any existing webhook
        await this.state.bot.telegram.deleteWebhook();
        
        // Start bot in polling mode
        this.state.bot.launch();
        logger.info('🤖 Bot started in polling mode (development)', {
          env: this.config.environment,
          features: this.config.features
        });
      } else {
        // Start Express server for production webhook
        this.app.listen(this.config.port, () => {
          logger.info('🚀 Server started on port ' + this.config.port, {
            port: this.config.port,
            env: this.config.environment,
            features: this.config.features
          });
        });
      }

      // Set up graceful shutdown
      process.on('SIGTERM', this.shutdown.bind(this));
      process.on('SIGINT', this.shutdown.bind(this));

    } catch (error) {
      logger.error('Failed to start application:', error);
      process.exit(1);
    }
  }

  private async shutdown(): Promise<void> {
    logger.info('Shutting down application...');
    
    try {
      await this.state.core.cleanup();
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Start the application
const app = new ChatbotApp();
app.start().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});