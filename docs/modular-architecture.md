# Modular Core Architecture

## Overview

The modular core system allows the bot to dynamically load and manage different functionality modules. Each module can handle specific types of messages and commands.

## Architecture

```
telegram.js → core-modular.js → Module Router
                                      ↓
                    ┌─────────────────┼─────────────────┐
                    ↓                 ↓                 ↓
            Trading Module      AI Module        Help Module
                    ↓                 ↓                 ↓
            Hyperliquid API     Claude API       Static Help
```

## Key Components

### 1. Core (core-modular.js)
- Module registration and management
- Message routing based on priority
- Conversation history management
- Shared context between modules

### 2. Base Module (base.module.js)
- Interface that all modules must implement
- `canHandle()`: Check if module can process the message
- `handle()`: Process and return response

### 3. Modules

#### Trading Module (Priority: 10)
- Handles all trading commands
- Hyperliquid position queries
- Wallet management
- Natural language trading queries

#### Help Module (Priority: 20)  
- `/help`, `/start` commands
- General bot information
- Lists available features

#### AI Module (Priority: 50)
- Handles all non-command messages
- Web search integration
- Altimist service queries
- General AI chat

## How It Works

1. **Message Received**: Core receives a message from Telegram
2. **Module Check**: Iterates through modules by priority order
3. **First Match**: First module that returns `true` from `canHandle()` processes the message
4. **Response**: Module returns response, core sends it back to user

## Adding a New Module

### Step 1: Create the module file

```javascript
// src/modules/weather.module.js
const BaseModule = require('./base.module');

class WeatherModule extends BaseModule {
  constructor() {
    super();
    this.name = 'Weather';
    this.description = 'Provides weather information';
  }

  async canHandle(text, context) {
    return text.toLowerCase().includes('weather') || 
           text.startsWith('/weather');
  }

  async handle(text, context) {
    // Your weather logic here
    return 'Weather information...';
  }
}

module.exports = WeatherModule;
```

### Step 2: Register in core-modular.js

```javascript
// In loadModules() function
const WeatherModule = require('./modules/weather.module');
const weatherModule = new WeatherModule();
core.registerModule('weather', weatherModule, 15); // Priority 15
```

## Module Priorities

Lower number = Higher priority (checked first)

- **0-10**: Critical commands (trading, security)
- **11-30**: Feature commands (help, settings)  
- **31-50**: Content modules (news, weather)
- **51-100**: Fallback handlers (AI chat)

## Benefits

1. **Modularity**: Easy to add/remove features without touching core
2. **Priority System**: Control which modules get first chance at messages
3. **Isolation**: Module failures don't crash the bot
4. **Testability**: Each module can be tested independently
5. **Extensibility**: Third-party modules can be added easily

## Module Context

Each module receives a context object:

```javascript
{
  text: 'user message',
  chatId: 'telegram_chat_id',
  history: [...conversation history],
  core: ModularCore instance,
  metadata: {
    timestamp: Date,
    platform: 'telegram'
  }
}
```

## Usage

### Replace existing core:
```bash
# Backup original
mv src/core.js src/core-original.js

# Use modular core
mv src/core-modular.js src/core.js
```

### Or update telegram.js:
```javascript
// Change from:
const chat = require('../core');

// To:
const chat = require('../core-modular');
```

## Future Enhancements

1. **Module Hot-Reload**: Reload modules without restarting
2. **Module Dependencies**: Modules can depend on other modules
3. **Module Config**: Per-module configuration files
4. **Module Store**: Download and install modules from registry
5. **Module Hooks**: Pre/post processing hooks
6. **Multi-Platform**: Support Discord, Slack, etc.

## Example: Adding a Crypto Price Module

```javascript
// src/modules/crypto-price.module.js
const BaseModule = require('./base.module');
const axios = require('axios');

class CryptoPriceModule extends BaseModule {
  constructor() {
    super();
    this.name = 'CryptoPrice';
    this.description = 'Get cryptocurrency prices';
    this.patterns = [
      /price of (\w+)/i,
      /(\w+) price/i,
      /^\/price (\w+)/i
    ];
  }

  async canHandle(text) {
    return this.patterns.some(p => p.test(text));
  }

  async handle(text) {
    const match = this.patterns.find(p => p.test(text));
    const coin = text.match(match)[1];
    
    try {
      const price = await this.fetchPrice(coin);
      return `💰 ${coin.toUpperCase()} Price: $${price}`;
    } catch (error) {
      return `❌ Could not fetch price for ${coin}`;
    }
  }

  async fetchPrice(coin) {
    // Implementation here
  }
}

module.exports = CryptoPriceModule;
```

Register with priority 25 to handle before AI but after trading commands.