# Core Architecture Comparison

## Current Architecture (Disconnected)

```
User Message → telegram.js → core.js → Claude AI
                    ↓
              (No trading commands)
```

**Problems:**
- Trading commands in `handlers.js` are never called
- No unified message routing
- Two separate systems that don't communicate
- User can't use trading commands through the main bot

## Enhanced Architecture (Integrated)

```
User Message → telegram.js → core-enhanced.js
                                    ↓
                            Command Detection
                            ↓               ↓
                    Trading Commands    AI Chat
                            ↓               ↓
                    position.js      Claude + Web Search
                            ↓               ↓
                    Hyperliquid API   AI Response
```

## What Should Be in Core

### 1. **Message Router** (PRIMARY ROLE)
The core should detect intent and route to appropriate handler:
- Trading commands → Trading handlers
- AI questions → Claude AI
- Service queries → Claude with context

### 2. **Context Management**
- Conversation history (already exists)
- User state tracking
- Command history for better AI responses

### 3. **Unified Response Interface**
- Consistent error handling
- Response formatting
- Rate limiting and security

## Recommended Changes

### Option 1: Replace core.js with core-enhanced.js
```javascript
// In telegram.js
const chat = require('../core-enhanced');
```

### Option 2: Modular Approach
```javascript
// src/core.js - Main router
const aiHandler = require('./handlers/ai');
const tradingHandler = require('./handlers/trading');
const commandDetector = require('./utils/commandDetector');

module.exports = async function core(text, chatId) {
  const intent = commandDetector.detect(text);
  
  switch (intent.type) {
    case 'trading':
      return tradingHandler.handle(intent, chatId);
    case 'ai':
      return aiHandler.handle(text, chatId);
    default:
      return aiHandler.handle(text, chatId);
  }
};
```

## Benefits of Integration

1. **Single Entry Point**: All messages flow through core.js
2. **Intelligent Routing**: Automatically detect trading commands vs AI queries
3. **Context Awareness**: AI can reference trading data when answering questions
4. **Extensibility**: Easy to add new command types
5. **Consistent UX**: Users don't need to know different endpoints

## Implementation Steps

1. **Immediate**: Use `core-enhanced.js` as a drop-in replacement
2. **Short-term**: Refactor into modular handlers
3. **Long-term**: Add database for persistent user state

## Trading Logic That Belongs in Core

- **Command Detection**: Pattern matching for commands
- **User Authentication**: Verify user has wallet linked
- **Rate Limiting**: Prevent API abuse
- **Error Recovery**: Graceful handling of API failures
- **Response Caching**: Cache position data briefly

## Trading Logic That Stays in Handlers

- **API Integration**: Direct Hyperliquid calls
- **Data Formatting**: Position message formatting
- **Business Logic**: Trading-specific calculations
- **Command Execution**: Actual command implementation