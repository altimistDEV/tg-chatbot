// index.ts
// Main application entry point
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Telegraf } from 'telegraf';
import Core from './src/core.js';
import getConfig from './src/config/index.js';
import logger from './src/utils/logger.js';
import { LogAction } from './src/utils/enhanced-logger.js';
import { loggingMiddleware, createTelegramLogger, extractTelegramUserContext } from './src/middleware/logging.middleware.js';
class ChatbotApp {
    app;
    state;
    config;
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
    setupMiddleware() {
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
        // Enhanced request logging
        this.app.use(loggingMiddleware);
    }
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
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
        this.app.get('/', (req, res) => {
            res.status(200).json({
                name: 'Telegram Chatbot',
                version: '2.0.0',
                description: 'Platform-agnostic modular chatbot with AI and trading features'
            });
        });
        // 404 handler
        this.app.use((req, res) => {
            logger.warn({ url: req.url, method: req.method }, '404 - Route not found');
            res.status(404).json({ error: 'Route not found' });
        });
        // Error handler
        this.app.use((err, req, res, next) => {
            logger.error({ error: err.message, stack: err.stack, url: req.url }, 'Unhandled error');
            res.status(500).json({ error: 'Internal server error' });
        });
    }
    setupTelegraf() {
        // Handle text messages
        this.state.bot.on('text', async (ctx) => {
            // Create enhanced logger for this request
            const enhancedLogger = createTelegramLogger(ctx);
            try {
                const userId = ctx.from?.id;
                const chatId = ctx.chat.id;
                const messageText = ctx.message.text;
                const username = ctx.from?.username;
                const firstName = ctx.from?.first_name;
                const lastName = ctx.from?.last_name;
                if (!userId || !messageText) {
                    return;
                }
                // Start timing
                enhancedLogger.startTimer('total_processing');
                // Get or create conversation context
                let context = this.state.conversationHistory.get(chatId);
                if (!context) {
                    context = {
                        chatId: chatId,
                        history: [],
                        userId: userId,
                        logger: enhancedLogger,
                        correlationId: enhancedLogger.correlationId,
                        userContext: extractTelegramUserContext(ctx),
                        platform: 'telegram',
                        conversationHistory: []
                    };
                    this.state.conversationHistory.set(chatId, context);
                    // Log new user session
                    enhancedLogger.info(LogAction.USER_SESSION_START, {
                        message: `New session for @${username || userId}`,
                        metadata: {
                            fullName: `${firstName || ''} ${lastName || ''}`.trim(),
                            platform: 'telegram'
                        }
                    });
                }
                else {
                    // Update context with fresh logger and user info
                    context.logger = enhancedLogger;
                    context.correlationId = enhancedLogger.correlationId;
                    context.userContext = extractTelegramUserContext(ctx);
                }
                // Log incoming message
                enhancedLogger.info(LogAction.COMMAND_EXECUTED, {
                    message: `Received: "${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}"`,
                    command: messageText.startsWith('/') ? messageText.split(' ')[0] : 'text_message',
                    metadata: {
                        username: `@${username}`,
                        fullName: `${firstName || ''} ${lastName || ''}`.trim(),
                        messageLength: messageText.length
                    }
                });
                // Process message with core
                enhancedLogger.startTimer('core_processing');
                const response = await this.state.core.handleMessage(messageText, context);
                const coreTime = enhancedLogger.endTimer('core_processing');
                // Send response
                enhancedLogger.startTimer('telegram_send');
                await ctx.reply(response);
                const sendTime = enhancedLogger.endTimer('telegram_send');
                // Log completion
                const totalTime = enhancedLogger.endTimer('total_processing');
                enhancedLogger.info(LogAction.COMMAND_EXECUTED, {
                    message: 'Message processed successfully',
                    result: 'success',
                    metadata: {
                        username: `@${username}`,
                        responseLength: response.length,
                        responsePreview: response.substring(0, 100) + (response.length > 100 ? '...' : '')
                    },
                    performance: {
                        responseTime: totalTime,
                        apiCalls: {
                            core: coreTime,
                            telegram: sendTime
                        }
                    }
                });
            }
            catch (error) {
                logger.error('Error handling Telegram message:', error);
                enhancedLogger.error(LogAction.ERROR, {
                    type: 'TelegramMessageError',
                    message: error.message,
                    severity: 'high',
                    stackTrace: error.stack
                });
                await ctx.reply('❌ Sorry, I encountered an error processing your message.');
            }
        });
        // Handle errors
        this.state.bot.catch((err, ctx) => {
            logger.error({ error: err.message, userId: ctx.from?.id }, 'Telegraf error');
        });
        // Set webhook callback for Express
        this.app.use(this.state.bot.webhookCallback('/webhook'));
    }
    async handleWebhook(req, res) {
        try {
            const update = req.body;
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
        }
        catch (error) {
            logger.error('Webhook error:', error);
            res.status(200).send('OK'); // Always return 200 to Telegram
        }
    }
    async start() {
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
            }
            else {
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
        }
        catch (error) {
            logger.error('Failed to start application:', error);
            process.exit(1);
        }
    }
    async shutdown() {
        logger.info('Shutting down application...');
        try {
            await this.state.core.cleanup();
            process.exit(0);
        }
        catch (error) {
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
//# sourceMappingURL=index.js.map