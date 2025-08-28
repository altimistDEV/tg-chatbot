# 🤖 Telegram Trading Bot

A sophisticated Telegram bot with AI capabilities and Hyperliquid trading integration, built with TypeScript and Claude AI.

## 🚀 Features

- **AI-Powered Conversations**: Powered by Claude (Anthropic) for natural language interactions
- **Trading Integration**: Real-time position tracking with Hyperliquid DEX
- **Web Search**: SerpAPI integration for current information
- **Modular Architecture**: Clean, extensible module system
- **TypeScript**: Full type safety and modern development experience
- **Comprehensive Testing**: Unit, integration, and e2e test suites

## 📦 Tech Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express + Telegraf
- **AI**: Anthropic Claude API
- **Trading**: Hyperliquid API
- **Testing**: Custom TypeScript test framework
- **Logging**: Pino with pretty formatting

## 🏗️ Architecture

```
Telegram ↔ Webhook/Polling ─┐
                            ├─ index.ts (Express + Telegraf)
                            ├─ core.ts (Message Router)
                            └─ modules/
                                ├─ trading.module.ts (Hyperliquid)
                                ├─ ai.module.ts (Claude)
                                └─ help.module.ts (Commands)
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Telegram Bot Token (from [@BotFather](https://t.me/botfather))
- API Keys (see Environment Setup)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/tg-chatbot.git
cd tg-chatbot

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys
```

### Environment Setup

Create a `.env` file with:

```env
# Required
TG_TOKEN=your_telegram_bot_token
ANTHROPIC_API_KEY=your_anthropic_api_key

# Optional
SERPAPI_KEY=your_serpapi_key_for_web_search
NODE_ENV=development
PORT=3000

# Hyperliquid Configuration
HYPERLIQUID_API_URL=https://api.hyperliquid.xyz  # or testnet
HYPERLIQUID_TIMEOUT=10000
```

### Running the Bot

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start

# Run tests
npm test
```

## 📝 Available Commands

### Trading Commands
- `/position` - Show all your open positions
- `/position BTC` - Show detailed BTC position
- `/linkwallet 0x...` - Link your Hyperliquid wallet
- Natural language: "show my positions", "what are my trades"

### General Commands
- `/help` - Display available commands
- `/start` - Welcome message
- AI chat - Just type naturally!

## 🧪 Testing

The project includes a comprehensive test suite:

```bash
# Run all tests
npm test

# Run specific test categories
npm run test:unit         # Unit tests
npm run test:integration  # Integration tests
npm run test:e2e         # End-to-end tests

# Run individual test suites
npm run test:position     # Position command tests
npm run test:userservice  # UserService tests
```

### Test Coverage
- ✅ UserService: Wallet management and user data
- ✅ Position Command: Hyperliquid integration
- ✅ Trading Module: Command routing and responses
- ✅ Core Functions: Message handling and routing

## 🔧 Development

### Project Structure

```
tg-chatbot/
├── src/
│   ├── modules/          # Bot modules (trading, AI, help)
│   ├── commands/         # Command handlers
│   ├── services/         # Business logic
│   ├── utils/            # Utilities
│   └── types/            # TypeScript types
├── tests/
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   └── e2e/            # End-to-end tests
├── index.ts             # Application entry
└── package.json
```

### Adding New Features

1. **Create a new module** in `src/modules/`
2. **Extend BaseModule** class
3. **Register patterns** for command matching
4. **Implement handle()** method
5. **Add tests** in appropriate test directory

Example module:

```typescript
import BaseModule from './base.module.js';

export class MyModule extends BaseModule {
  constructor() {
    super();
    this.name = 'MyModule';
    this.patterns = [
      { pattern: /^\/mycommand/, handler: 'handleMyCommand' }
    ];
  }

  async handle(message: string, ctx: any): Promise<string> {
    return 'Response from MyModule';
  }
}
```

## 🚀 Deployment

### Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start the bot
pm2 start npm --name "tg-bot" -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

### Using Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### Using Render

1. Connect your GitHub repository
2. Set build command: `npm install && npm run build`
3. Set start command: `npm start`
4. Add environment variables
5. Deploy!

## 🔒 Security Notes

- Never commit `.env` files
- Use environment variables for all secrets
- Validate all user inputs
- Implement rate limiting for production
- Use HTTPS webhooks in production

## 📊 Monitoring

The bot includes comprehensive logging with Pino:

```bash
# View logs in development
npm run dev

# Production logs (JSON format)
npm start | pino-pretty
```

Log levels:
- `ERROR`: Critical errors
- `WARN`: Warning conditions
- `INFO`: General information
- `DEBUG`: Detailed debug info

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards

- Use TypeScript for all new code
- Follow existing code style
- Write tests for new features
- Update documentation as needed
- Run `npm run typecheck` before committing

## 🐛 Troubleshooting

### Bot not responding?
- Check bot token is correct
- Verify webhook is set (production) or polling is active (development)
- Check logs for errors

### Position command not working?
- Ensure Hyperliquid API URL is correct (mainnet vs testnet)
- Verify wallet is linked (in production)
- Check if wallet has open positions

### Tests failing?
- Run `npm install` to ensure all dependencies are installed
- Check environment variables are set
- Verify network connectivity for integration tests

## 📜 License

MIT © 2025

## 🙏 Acknowledgments

- [Telegraf](https://telegraf.js.org/) - Telegram Bot Framework
- [Anthropic](https://www.anthropic.com/) - Claude AI
- [Hyperliquid](https://hyperliquid.xyz/) - DEX Integration
- [TypeScript](https://www.typescriptlang.org/) - Type Safety

## 📮 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact via Telegram: @yourusername
- Email: support@yourproject.com

---

Built with ❤️ by the Altimist team