// src/core.ts
// Core modular message router

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readdir } from 'fs/promises';
import logger from './utils/logger.js';
import { createLogger, LogAction, UserContext } from './utils/enhanced-logger.js';
import { 
  BaseModuleInterface, 
  MessageContext, 
  ModuleInfo, 
  Core as CoreInterface,
  ConversationMessage 
} from './types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class Core implements CoreInterface {
  public modules: BaseModuleInterface[] = [];
  private readonly MAX_HISTORY_LENGTH = 20;

  async initialize(): Promise<void> {
    await this.loadModules();
    logger.info('📦 Loaded modules: ' + this.modules.map(m => m.name.toLowerCase()).join(', '));
  }

  /**
   * Load all modules from the modules directory
   */
  private async loadModules(): Promise<void> {
    try {
      const modulesDir = new URL('./modules', import.meta.url);
      const files = await readdir(modulesDir);
      
      const moduleFiles = files.filter(file => 
        file.endsWith('.module.js') || file.endsWith('.module.ts')
      );

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
            } else {
              logger.warn(`⚠️ Invalid module: ${file}`);
            }
          }
        } catch (error) {
          logger.error(`❌ Failed to load module ${file}:`, error);
        }
      }

      // Sort modules by priority (lower numbers = higher priority)
      this.modules.sort((a, b) => a.priority - b.priority);

    } catch (error) {
      logger.error('❌ Failed to load modules directory:', error);
    }
  }

  /**
   * Validate that a module implements the required interface
   */
  private isValidModule(module: any): module is BaseModuleInterface {
    return (
      module &&
      typeof module.name === 'string' &&
      typeof module.description === 'string' &&
      typeof module.priority === 'number' &&
      typeof module.canHandle === 'function' &&
      typeof module.handle === 'function'
    );
  }

  /**
   * Register a module with the core
   */
  registerModule(module: BaseModuleInterface): void {
    this.modules.push(module);
    logger.info(`✓ Registered module: ${module.name.toLowerCase()} (priority: ${module.priority})`);
  }

  /**
   * Handle incoming message by routing to appropriate module
   */
  async handleMessage(text: string, context: MessageContext): Promise<string> {
    // Create enhanced logger for this request
    const enhancedLogger = context.logger || createLogger({
      correlationId: context.correlationId,
      userContext: context.userContext as UserContext
    });
    
    // Start timing
    enhancedLogger.startTimer('message_processing');
    enhancedLogger.startTimer('module_routing');
    
    // Add core reference to context
    context.core = this;
    context.logger = enhancedLogger;

    // Add user message to history
    this.addToHistory(context, { role: 'user', content: text });
    
    // Log incoming message with user context
    enhancedLogger.info(LogAction.COMMAND_EXECUTED, {
      message: `Processing message from @${context.userContext?.username || context.userId}`,
      command: text.startsWith('/') ? text.split(' ')[0] : 'text_message',
      metadata: {
        messageLength: text.length,
        historySize: context.conversationHistory?.length || 0,
        platform: context.platform
      }
    });

    try {
      // Find the first module that can handle this message
      for (const module of this.modules) {
        try {
          if (await module.canHandle(text, context)) {
            const routingTime = enhancedLogger.endTimer('module_routing');
            
            enhancedLogger.info(LogAction.COMMAND_EXECUTED, {
              message: `Routing to ${module.name} module`,
              module: module.name,
              metadata: {
                routingTime,
                priority: module.priority
              }
            });
            
            enhancedLogger.startTimer('module_execution');
            const response = await module.handle(text, context);
            const executionTime = enhancedLogger.endTimer('module_execution');
            
            // Add assistant response to history
            this.addToHistory(context, { role: 'assistant', content: response });
            
            // Log successful completion
            const totalTime = enhancedLogger.endTimer('message_processing');
            enhancedLogger.logCommand(
              text.startsWith('/') ? (text.split(' ')[0] || '/unknown') : 'message',
              module.name!,
              'success',
              {
                responseLength: response.length,
                timingBreakdown: {
                  routing: routingTime,
                  execution: executionTime,
                  total: totalTime
                }
              }
            );
            
            return response;
          }
        } catch (error) {
          logger.error(`❌ Error in module ${module.name}:`, error);
          enhancedLogger.error(LogAction.ERROR, {
            type: 'ModuleError',
            message: `Error in ${module.name}: ${(error as Error).message}`,
            severity: 'medium',
            stackTrace: (error as Error).stack
          });
          // Continue to next module on error
          continue;
        }
      }

      // No module could handle the message
      const fallbackMessage = '🤔 I\'m not sure how to help with that. Try /help for available commands.';
      this.addToHistory(context, { role: 'assistant', content: fallbackMessage });
      
      const totalTime = enhancedLogger.endTimer('message_processing');
      enhancedLogger.warn(LogAction.COMMAND_EXECUTED, {
        message: 'No module could handle message',
        command: text.startsWith('/') ? text.split(' ')[0] : 'unknown',
        result: 'failure',
        metadata: {
          fallbackUsed: true,
          totalTime
        }
      });
      
      return fallbackMessage;

    } catch (error) {
      logger.error('❌ Core message handling error:', error);
      return '❌ Sorry, I encountered an error processing your message.';
    }
  }

  /**
   * Add message to conversation history with length limiting
   */
  private addToHistory(context: MessageContext, message: ConversationMessage): void {
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
  getModuleInfo(): ModuleInfo[] {
    return this.modules.map(module => ({
      name: module.name,
      description: module.description
    }));
  }

  /**
   * Cleanup all modules
   */
  async cleanup(): Promise<void> {
    for (const module of this.modules) {
      try {
        if (module.cleanup) {
          await module.cleanup();
        }
      } catch (error) {
        logger.error(`❌ Error cleaning up module ${module.name}:`, error);
      }
    }
    this.modules = [];
  }
}

export default Core;