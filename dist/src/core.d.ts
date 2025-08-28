import { BaseModuleInterface, MessageContext, ModuleInfo, Core as CoreInterface } from './types/index.js';
declare class Core implements CoreInterface {
    modules: BaseModuleInterface[];
    private readonly MAX_HISTORY_LENGTH;
    initialize(): Promise<void>;
    /**
     * Load all modules from the modules directory
     */
    private loadModules;
    /**
     * Validate that a module implements the required interface
     */
    private isValidModule;
    /**
     * Register a module with the core
     */
    registerModule(module: BaseModuleInterface): void;
    /**
     * Handle incoming message by routing to appropriate module
     */
    handleMessage(text: string, context: MessageContext): Promise<string>;
    /**
     * Add message to conversation history with length limiting
     */
    private addToHistory;
    /**
     * Get information about all loaded modules
     */
    getModuleInfo(): ModuleInfo[];
    /**
     * Cleanup all modules
     */
    cleanup(): Promise<void>;
}
export default Core;
//# sourceMappingURL=core.d.ts.map