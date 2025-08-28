// src/modules/base.module.ts
// Base class for all modules
export class BaseModule {
    name;
    description;
    priority;
    constructor() {
        this.name = this.constructor.name;
        this.description = 'Base module';
        this.priority = 100; // Default priority
    }
    /**
     * Optional: Initialize module (called once on load)
     */
    async initialize() {
        // Override in subclass if needed
    }
    /**
     * Optional: Cleanup module (called on unload)
     */
    async cleanup() {
        // Override in subclass if needed
    }
    /**
     * Helper: Extract command and arguments from text
     * @param text - User message
     * @returns { command, args }
     */
    parseCommand(text) {
        const parts = text.trim().split(/\s+/);
        return {
            command: parts[0] || '',
            args: parts.slice(1),
            fullText: text
        };
    }
}
export default BaseModule;
//# sourceMappingURL=base.module.js.map