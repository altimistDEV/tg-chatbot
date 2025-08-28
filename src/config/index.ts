// src/config/index.ts
// Application configuration

import { Config } from '../types/index.js';

/**
 * Validate required environment variables
 */
function validateEnvironment(): void {
  const required = ['TG_TOKEN'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Get application configuration with validation
 */
export function getConfig(): Config {
  validateEnvironment();

  const config: Config = {
    // Required
    telegramBotToken: process.env.TG_TOKEN!,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',

    // Optional
    serpApiKey: process.env.SERPAPI_KEY,
    systemPrompt: process.env.SYSTEM_PROMPT,

    // Server
    port: parseInt(process.env.PORT || '3000', 10),
    environment: (process.env.NODE_ENV as Config['environment']) || 'development',

    // Features
    features: {
      webSearch: !!process.env.SERPAPI_KEY,
      trading: !!process.env.ANTHROPIC_API_KEY, // Trading requires AI for responses
      ai: !!process.env.ANTHROPIC_API_KEY
    }
  };

  // Validate port
  if (isNaN(config.port) || config.port < 1 || config.port > 65535) {
    throw new Error(`Invalid port number: ${process.env.PORT}`);
  }

  // Validate environment
  const validEnvironments: Config['environment'][] = ['development', 'production', 'test'];
  if (!validEnvironments.includes(config.environment)) {
    throw new Error(`Invalid environment: ${process.env.NODE_ENV}. Must be one of: ${validEnvironments.join(', ')}`);
  }

  return config;
}

export default getConfig;