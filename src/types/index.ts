// src/types/index.ts
// Core type definitions for the chatbot application

export interface MessageContext {
  chatId: number;
  history: ConversationMessage[];
  core?: Core;
  userId?: number;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface ModuleInfo {
  name: string;
  description: string;
}

export interface BaseModuleInterface {
  name: string;
  description: string;
  priority: number;
  canHandle(text: string, context: MessageContext): Promise<boolean>;
  handle(text: string, context: MessageContext): Promise<string>;
  initialize?(): Promise<void>;
  cleanup?(): Promise<void>;
}

export interface Core {
  modules: BaseModuleInterface[];
  registerModule(module: BaseModuleInterface): void;
  handleMessage(text: string, context: MessageContext): Promise<string>;
  getModuleInfo(): ModuleInfo[];
  initialize(): Promise<void>;
}

// Configuration types
export interface Config {
  anthropicApiKey: string;
  telegramBotToken: string;
  serpApiKey?: string;
  systemPrompt?: string;
  port: number;
  environment: 'development' | 'production' | 'test';
  features: {
    webSearch: boolean;
    trading: boolean;
    ai: boolean;
  };
}

// AI Module types
export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AnthropicResponse {
  content: Array<{
    text?: string;
    type: string;
  }>;
}

export interface WebSearchResult {
  title: string;
  snippet: string;
  link: string;
}

export interface SerpApiResponse {
  organic_results?: Array<{
    title: string;
    snippet: string;
    link: string;
  }>;
}

// Trading Module types
export interface CommandMatch {
  type: string;
  match: RegExpMatchArray | null;
  coin?: string | null;
  address?: string | null;
}

export interface TelegramResponseContext {
  reply(message: string, options?: any): Promise<void>;
  replyWithMarkdown?(message: string, options?: any): Promise<void>;
  replyWithHTML?(message: string, options?: any): Promise<void>;
  from: {
    id: number;
  };
}

// Hyperliquid API types
export interface HyperliquidPosition {
  position: {
    coin: string;
    szi: string;
    entryPx: string;
    positionValue: string;
    unrealizedPnl: string;
    leverage?: {
      type: string;
      value: number;
    };
  };
}

export interface HyperliquidResponse {
  assetPositions: HyperliquidPosition[];
}

export interface HyperliquidAllMids {
  [coin: string]: string;
}

// User Service types
export interface UserData {
  userId: number;
  walletAddress?: string;
  preferences?: {
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Formatter types
export type MessageFormat = 'markdown' | 'html' | 'plain' | 'whatsapp' | 'discord';

export interface FormatterOptions {
  maxLength?: number;
  preserveLinks?: boolean;
  convertEmojis?: boolean;
}

// Logger types
export interface LoggerConfig {
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  prettyPrint?: boolean;
  redact?: string[];
}

// Express types (extending existing)
export interface WebhookUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: 'private' | 'group' | 'supergroup' | 'channel';
    };
    date: number;
    text?: string;
  };
}

// Error types
export interface ChatbotError extends Error {
  code?: string;
  statusCode?: number;
  context?: any;
}

export interface ModuleError extends ChatbotError {
  moduleName: string;
}

// Utility types
export type Awaitable<T> = T | Promise<T>;

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = 
  Pick<T, Exclude<keyof T, Keys>> & 
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];