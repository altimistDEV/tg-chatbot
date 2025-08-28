import { MessageFormat, FormatterOptions } from '../types/index.js';
/**
 * Format a message for different platforms
 */
export declare function formatMessage(message: string, format?: MessageFormat, options?: FormatterOptions): string;
/**
 * Remove all formatting from a message
 */
export declare function stripFormatting(message: string): string;
/**
 * Convert markdown to HTML
 */
export declare function convertMarkdownToHTML(message: string): string;
/**
 * Convert markdown to WhatsApp format
 */
export declare function convertMarkdownToWhatsApp(message: string): string;
/**
 * Convert markdown to Discord format
 */
export declare function convertMarkdownToDiscord(message: string): string;
/**
 * Escape special characters for different formats
 */
export declare function escapeForFormat(text: string, format: MessageFormat): string;
/**
 * Validate message length for different platforms
 */
export declare function getMaxLength(format: MessageFormat): number;
//# sourceMappingURL=formatter.d.ts.map