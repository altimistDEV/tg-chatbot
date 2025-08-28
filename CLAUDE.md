# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
# Run the bot locally
node index.js

# Run tests
node tests/test-claude.js           # Test Claude AI integration
node tests/test-search.js           # Test web search functionality
node tests/test-hyperliquid.js      # Test Hyperliquid trading
node tests/test-core.js             # Test modular core system
node tests/test-platform-agnostic.js # Test multi-platform support
```

### Deployment
```bash
# Set Telegram webhook (after deployment)
node -e "require('./adaptors/telegram').setWebhook('https://YOUR_URL.onrender.com')"
```

## Architecture Overview

This is a platform-agnostic, modular chatbot that uses Claude Sonnet 4 API for AI chat and integrates with Hyperliquid for trading features. Currently deployed for Telegram but supports multiple messaging platforms.

### Core Components

1. **index.js**: Express server entry point that handles webhook requests. Routes:
   - `/telegram` - Telegram webhook endpoint
   - Can add: `/whatsapp`, `/discord`, etc.

2. **core.js**: Platform-agnostic modular core that:
   - Routes messages to appropriate modules based on priority
   - Maintains in-memory conversation history per chat ID
   - Accepts platform context (platform, userId, formatting)
   - Modules loaded: Trading (priority 10), Help (20), AI (50)

3. **modules/**: Self-contained feature modules (work across all platforms)
   - `trading.module.js`: Hyperliquid position checking and wallet management
   - `ai.module.js`: Claude AI chat with web search integration
   - `help.module.js`: Bot commands and help information
   - `base.module.js`: Base interface for all modules

4. **adaptors/**: Platform-specific adapters
   - `telegram.js`: Telegram Bot API integration
   - Future: `whatsapp.js`, `discord.js`, etc.

5. **utils/formatter.js**: Cross-platform message formatting
   - Converts between Markdown, HTML, WhatsApp, Discord, plain text
   - Ensures responses display correctly on each platform

6. **services.txt**: Live-editable file containing Altimist service descriptions

### Key Integration Points

- **Environment Variables Required**:
  - `ANTHROPIC_API_KEY`: Claude API authentication
  - `TG_TOKEN`: Telegram bot token
  - `SERPAPI_KEY`: For web search functionality
  - `SYSTEM_PROMPT`: Base prompt for Altimist service queries
  - `PORT`: Server port (defaults to 3000)

- **Message Flow**: 
  ```
  Platform → adapter.js → core.js (with platform context) → Modules → Response
                              ↓
                    Platform context: { platform, userId, formatting }
  ```

- **State Management**: Conversation history stored in-memory, cleared on server restart

### Adding New Messaging Platforms

To add support for a new messaging platform (e.g., WhatsApp, Discord):

1. Create adapter in `src/adaptors/[platform].js`
2. Pass platform context to core:
   ```javascript
   const response = await chat(message, chatId, {
     platform: 'whatsapp',
     formatting: 'whatsapp'
   });
   ```
3. Add route in `index.js`: `app.post('/[platform]', adapter.webhook)`
4. Use `utils/formatter.js` if custom formatting needed

### Testing Approach

Use the provided test scripts to validate functionality:
- `tests/test-claude.js` - Test Claude AI integration
- `tests/test-search.js` - Test web search functionality  
- `tests/test-hyperliquid.js` - Test Hyperliquid trading integration
- `tests/test-core.js` - Test the modular core system
- `tests/test-platform-agnostic.js` - Test multi-platform support

### Module System

To add a new module:
1. Create module extending `BaseModule` in `src/modules/`
2. Implement `canHandle()` and `handle()` methods
3. Register in `core.js` with priority (lower = higher priority)
4. Module automatically works across all platforms