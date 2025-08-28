// src/core.ts
// Core modular message router
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readdir } from 'fs/promises';
import logger from './utils/logger.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
class Core {
    modules = [];
    MAX_HISTORY_LENGTH = 20;
    async initialize() {
        await this.loadModules();
        logger.info('📦 Loaded modules: ' + this.modules.map(m => m.name.toLowerCase()).join(', '));
    }
    /**
     * Load all modules from the modules directory
     */
    async loadModules() {
        try {
            const modulesDir = new URL('./modules', import.meta.url);
            const files = await readdir(modulesDir);
            const moduleFiles = files.filter(file => file.endsWith('.module.js') || file.endsWith('.module.ts'));
            for (const file of moduleFiles) {
                if (file === 'base.module.js' || file === 'base.module.ts') {
                    continue; // Skip base module
                }
                try {
                    const modulePath = `./modules/${file}`;
                    const { default: ModuleClass } = await import(modulePath);
                    if (ModuleClass && typeof ModuleClass === 'function') {
                        const moduleInstance = new ModuleClass();
                        if (this.isValidModule(moduleInstance)) {
                            await this.registerModule(moduleInstance);
                        }
                        else {
                            logger.warn(`⚠️ Invalid module: ${file}`);
                        }
                    }
                }
                catch (error) {
                    logger.error(`❌ Failed to load module ${file}:`, error);
                }
            }
            // Sort modules by priority (lower numbers = higher priority)
            this.modules.sort((a, b) => a.priority - b.priority);
        }
        catch (error) {
            logger.error('❌ Failed to load modules directory:', error);
        }
    }
    /**
     * Validate that a module implements the required interface
     */
    isValidModule(module) {
        return (module &&
            typeof module.name === 'string' &&
            typeof module.description === 'string' &&
            typeof module.priority === 'number' &&
            typeof module.canHandle === 'function' &&
            typeof module.handle === 'function');
    }
    /**
     * Register a module with the core
     */
    registerModule(module) {
        this.modules.push(module);
        logger.info(`✓ Registered module: ${module.name.toLowerCase()} (priority: ${module.priority})`);
    }
    /**
     * Handle incoming message by routing to appropriate module
     */
    async handleMessage(text, context) {
        // Add core reference to context
        context.core = this;
        // Add user message to history
        this.addToHistory(context, { role: 'user', content: text });
        try {
            // Find the first module that can handle this message
            for (const module of this.modules) {
                try {
                    if (await module.canHandle(text, context)) {
                        logger.debug(`📨 Routing message to ${module.name}`);
                        const response = await module.handle(text, context);
                        // Add assistant response to history
                        this.addToHistory(context, { role: 'assistant', content: response });
                        return response;
                    }
                }
                catch (error) {
                    logger.error(`❌ Error in module ${module.name}:`, error);
                    // Continue to next module on error
                    continue;
                }
            }
            // No module could handle the message
            const fallbackMessage = '🤔 I\'m not sure how to help with that. Try /help for available commands.';
            this.addToHistory(context, { role: 'assistant', content: fallbackMessage });
            return fallbackMessage;
        }
        catch (error) {
            logger.error('❌ Core message handling error:', error);
            return '❌ Sorry, I encountered an error processing your message.';
        }
    }
    /**
     * Add message to conversation history with length limiting
     */
    addToHistory(context, message) {
        if (!context.history) {
            context.history = [];
        }
        // Add timestamp
        message.timestamp = new Date();
        context.history.push(message);
        // Limit history length to prevent memory issues
        if (context.history.length > this.MAX_HISTORY_LENGTH) {
            // Keep the most recent messages
            context.history = context.history.slice(-this.MAX_HISTORY_LENGTH);
        }
    }
    /**
     * Get information about all loaded modules
     */
    getModuleInfo() {
        return this.modules.map(module => ({
            name: module.name,
            description: module.description
        }));
    }
    /**
     * Cleanup all modules
     */
    async cleanup() {
        for (const module of this.modules) {
            try {
                if (module.cleanup) {
                    await module.cleanup();
                }
            }
            catch (error) {
                logger.error(`❌ Error cleaning up module ${module.name}:`, error);
            }
        }
        this.modules = [];
    }
}
export default Core;
//# sourceMappingURL=core.js.map