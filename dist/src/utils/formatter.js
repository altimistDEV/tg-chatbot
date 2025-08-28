// src/utils/formatter.ts
// Platform-agnostic message formatting utilities
/**
 * Format a message for different platforms
 */
export function formatMessage(message, format = 'markdown', options = {}) {
    const { maxLength = 4000, preserveLinks = true, convertEmojis = false } = options;
    let formatted = message;
    switch (format) {
        case 'html':
            formatted = convertMarkdownToHTML(message);
            break;
        case 'plain':
            formatted = stripFormatting(message);
            break;
        case 'whatsapp':
            formatted = convertMarkdownToWhatsApp(message);
            break;
        case 'discord':
            formatted = convertMarkdownToDiscord(message);
            break;
        case 'markdown':
        default:
            // Keep as-is for markdown
            break;
    }
    // Apply length limit
    if (formatted.length > maxLength) {
        formatted = formatted.substring(0, maxLength - 3) + '...';
    }
    return formatted;
}
/**
 * Remove all formatting from a message
 */
export function stripFormatting(message) {
    return message
        // Remove bold
        .replace(/\*\*(.*?)\*\*/g, '$1')
        // Remove italic  
        .replace(/\*(.*?)\*/g, '$1')
        // Remove code blocks
        .replace(/`(.*?)`/g, '$1')
        // Simplify links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
        // Remove headers
        .replace(/^#{1,6}\s*/gm, '')
        // Clean up extra whitespace
        .replace(/\n\s*\n/g, '\n')
        .trim();
}
/**
 * Convert markdown to HTML
 */
export function convertMarkdownToHTML(message) {
    return message
        // Headers
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        // Italic
        .replace(/\*(.*?)\*/g, '<i>$1</i>')
        // Code
        .replace(/`(.*?)`/g, '<code>$1</code>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        // Line breaks
        .replace(/\n/g, '<br>');
}
/**
 * Convert markdown to WhatsApp format
 */
export function convertMarkdownToWhatsApp(message) {
    // Use placeholders to avoid conflicts during conversion
    const BOLD_PLACEHOLDER = '___BOLD_PLACEHOLDER___';
    const ITALIC_PLACEHOLDER = '___ITALIC_PLACEHOLDER___';
    return message
        // Convert markdown bold (**) to placeholder first
        .replace(/\*\*(.*?)\*\*/g, `${BOLD_PLACEHOLDER}$1${BOLD_PLACEHOLDER}`)
        // Convert markdown italic (*) to WhatsApp italic (_)
        .replace(/\*(.*?)\*/g, '_$1_')
        // Convert placeholder back to WhatsApp bold (*)
        .replace(new RegExp(BOLD_PLACEHOLDER, 'g'), '*')
        // Remove unsupported formatting
        .replace(/`(.*?)`/g, '$1') // Remove code formatting
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1: $2') // Simplify links
        .replace(/^#{1,6}\s*/gm, ''); // Remove headers
}
/**
 * Convert markdown to Discord format
 */
export function convertMarkdownToDiscord(message) {
    return message
        // Discord uses same markdown mostly, but has some differences
        .replace(/^#{1,6}\s*/gm, '**') // Convert headers to bold
        .replace(/\n\n/g, '\n'); // Single line breaks in Discord
}
/**
 * Escape special characters for different formats
 */
export function escapeForFormat(text, format) {
    switch (format) {
        case 'html':
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;');
        case 'markdown':
            return text
                .replace(/([*_`[\]()~>#+\-=|{}.!])/g, '\\$1');
        case 'whatsapp':
            // WhatsApp has limited special characters
            return text.replace(/([*_~`])/g, '\\$1');
        default:
            return text;
    }
}
/**
 * Validate message length for different platforms
 */
export function getMaxLength(format) {
    const maxLengths = {
        whatsapp: 65536,
        discord: 2000,
        html: 4096,
        markdown: 4096,
        plain: 4096
    };
    return maxLengths[format] || 4096;
}
//# sourceMappingURL=formatter.js.map