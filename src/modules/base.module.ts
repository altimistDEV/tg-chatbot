// src/modules/base.module.ts
// Base class for all modules

import { BaseModuleInterface, MessageContext } from '../types/index.js';

export abstract class BaseModule implements BaseModuleInterface {
  public name: string;
  public description: string;
  public priority: number;

  constructor() {
    this.name = this.constructor.name;
    this.description = 'Base module';
    this.priority = 100; // Default priority
  }

  /**
   * Check if this module can handle the given message
   * @param text - User message
   * @param context - Context object with chatId, history, etc.
   * @returns True if module can handle
   */
  abstract canHandle(text: string, context: MessageContext): Promise<boolean>;

  /**
   * Handle the message and return a response
   * @param text - User message
   * @param context - Context object
   * @returns Response message
   */
  abstract handle(text: string, context: MessageContext): Promise<string>;

  /**
   * Optional: Initialize module (called once on load)
   */
  async initialize(): Promise<void> {
    // Override in subclass if needed
  }

  /**
   * Optional: Cleanup module (called on unload)
   */
  async cleanup(): Promise<void> {
    // Override in subclass if needed
  }

  /**
   * Helper: Extract command and arguments from text
   * @param text - User message
   * @returns { command, args }
   */
  protected parseCommand(text: string): {
    command: string;
    args: string[];
    fullText: string;
  } {
    const parts = text.trim().split(/\s+/);
    return {
      command: parts[0] || '',
      args: parts.slice(1),
      fullText: text
    };
  }
}

export default BaseModule;