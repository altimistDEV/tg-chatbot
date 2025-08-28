// src/modules/ai.module.ts
// AI chat module using Claude
import BaseModule from './base.module.js';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { getJson } from 'serpapi';
import logger from '../utils/logger.js';
export class AIModule extends BaseModule {
    anthropic;
    excludePatterns;
    constructor() {
        super();
        this.name = 'AI';
        this.description = 'AI-powered chat using Claude for general queries and assistance';
        this.priority = 50; // Lower priority, handles everything else
        // Validate API key
        if (!process.env.ANTHROPIC_API_KEY) {
            throw new Error('ANTHROPIC_API_KEY is not set in environment variables');
        }
        this.anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
        });
        // Patterns that should NOT be handled by AI
        this.excludePatterns = [
            /^\/\w+/, // Any command starting with /
            /^!/ // Commands starting with !
        ];
    }
    /**
     * AI module handles everything except explicit commands
     */
    async canHandle(text, _context) {
        // Don't handle if it matches exclude patterns
        for (const pattern of this.excludePatterns) {
            if (pattern.test(text)) {
                return false;
            }
        }
        // AI handles all other messages
        return true;
    }
    /**
     * Handle the message with AI
     */
    async handle(text, context) {
        const { history } = context;
        try {
            // Check if we need web search
            const webResults = await this.performWebSearchIfNeeded(text);
            // Build system prompt
            const systemPrompt = await this.buildSystemPrompt(text, webResults, context);
            // Prepare messages with history
            const messages = this.prepareMessages(history, text);
            // Get AI response
            const response = await this.getAIResponse(messages, systemPrompt);
            return response;
        }
        catch (error) {
            logger.error('AI module error:', error);
            if (error instanceof Error && error.message.includes('API key')) {
                return '❌ AI service configuration error. Please contact support.';
            }
            return '❌ I encountered an error while processing your request. Please try again.';
        }
    }
    /**
     * Check if web search is needed and perform it
     */
    async performWebSearchIfNeeded(text) {
        const needsWebSearch = text.toLowerCase().includes('current') ||
            text.toLowerCase().includes('price') ||
            text.toLowerCase().includes('latest') ||
            text.toLowerCase().includes('news') ||
            text.toLowerCase().includes('weather') ||
            text.toLowerCase().includes('today') ||
            text.toLowerCase().includes('now');
        if (!needsWebSearch || !process.env.SERPAPI_KEY) {
            return null;
        }
        try {
            const results = await getJson({
                api_key: process.env.SERPAPI_KEY,
                q: text,
                engine: 'google'
            });
            if (results.organic_results && results.organic_results.length > 0) {
                return results.organic_results.slice(0, 3).map(result => ({
                    title: result.title,
                    snippet: result.snippet,
                    link: result.link
                }));
            }
        }
        catch (error) {
            logger.error('Web search error:', error);
        }
        return null;
    }
    /**
     * Build the system prompt based on context
     */
    async buildSystemPrompt(text, webResults, context) {
        let systemPrompt = 'You are a helpful AI assistant. ';
        // Check if it's about Altimist services
        const isServiceQuery = text.toLowerCase().includes('altimist') ||
            text.toLowerCase().includes('service') ||
            text.toLowerCase().includes('consulting') ||
            text.toLowerCase().includes('advisory');
        if (isServiceQuery) {
            try {
                const services = readFileSync('services.txt', 'utf8');
                systemPrompt = (process.env.SYSTEM_PROMPT || '') + '\n\n' + services;
            }
            catch (error) {
                logger.error('Could not read services.txt:', error);
                systemPrompt += 'You represent Altimist, a consulting and advisory company. ';
            }
        }
        else {
            systemPrompt +=
                'Provide accurate and helpful information. ' +
                    'Be concise but thorough. ' +
                    "If you're not sure about something, say so rather than making assumptions.";
        }
        // Add trading context if relevant
        const isTradingRelated = text.toLowerCase().includes('trading') ||
            text.toLowerCase().includes('position') ||
            text.toLowerCase().includes('hyperliquid') ||
            text.toLowerCase().includes('leverage') ||
            text.toLowerCase().includes('wallet');
        if (isTradingRelated) {
            systemPrompt +=
                '\n\nThe user can access trading features through these commands:\n' +
                    '• /position - Check current positions\n' +
                    '• /position_detail COIN - Get detailed position info\n' +
                    '• /linkwallet ADDRESS - Link a Hyperliquid wallet\n' +
                    '• /trading_help - Get list of trading commands\n' +
                    "Mention these commands when relevant to the user's query.";
        }
        // Add web search results if available
        if (webResults) {
            systemPrompt +=
                '\n\nHere is current information from the web that may be relevant:\n' +
                    JSON.stringify(webResults, null, 2) +
                    '\n\nUse this information to provide current and accurate answers.';
        }
        // Add module awareness
        const moduleInfo = context.core ? context.core.getModuleInfo() : [];
        if (moduleInfo.length > 0) {
            systemPrompt +=
                '\n\nAvailable bot features:\n' +
                    moduleInfo.map(m => `• ${m.name}: ${m.description}`).join('\n');
        }
        return systemPrompt;
    }
    /**
     * Prepare messages array for Claude
     */
    prepareMessages(history, currentText) {
        const messages = [];
        // Add conversation history (excluding the current message which is already in history)
        for (const msg of history) {
            if (msg.content !== currentText || msg.role !== 'user') {
                messages.push({
                    role: msg.role,
                    content: msg.content
                });
            }
        }
        // If the last message isn't the current user message, add it
        if (messages.length === 0 || messages[messages.length - 1]?.content !== currentText) {
            messages.push({ role: 'user', content: currentText });
        }
        return messages;
    }
    /**
     * Get response from Claude AI
     */
    async getAIResponse(messages, systemPrompt) {
        const response = await this.anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            messages: messages,
            temperature: 0.7,
            system: systemPrompt
        });
        return response.content[0]?.text || 'No response generated';
    }
}
export default AIModule;
//# sourceMappingURL=ai.module.js.map