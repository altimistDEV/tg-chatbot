# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Commands

### Development
```bash
npm run dev              # Development with hot reload
npm run build           # Compile TypeScript
npm run start           # Run production build
npm run test            # Run all tests
npm run type-check      # TypeScript type checking
```

### Docker
```bash
npm run docker:build   # Build production Docker image
npm run docker:up      # Start with docker-compose
npm run docker:logs    # View container logs
npm run docker:down    # Stop containers
```

### Testing
```bash
npm run test:unit           # Unit tests
npm run test:integration    # Integration tests
npm run test:e2e           # End-to-end tests
```

## Architecture Overview

Modern TypeScript trading bot with modular architecture, Docker support, and AI-powered features. Uses Claude Sonnet 4 for intelligent responses and integrates with Hyperliquid DEX for trading.

### Current Architecture

**📁 Core Structure:**
```
src/
├── commands/           # Trading commands (position tracking)
├── modules/           # Feature modules (AI, Help, Trading)
├── services/          # Business logic (UserService)
├── utils/            # Utilities (Logger, Formatter)
├── config/           # Configuration management
└── types/            # TypeScript type definitions
```

**🚀 Entry Point:** `index.ts` - Express server with health checks
**🔄 Core Engine:** `src/core.ts` - Message routing and module management
**🐳 Deployment:** Docker with multi-stage builds, Node.js 20

### Key Components

1. **Modular System**: Priority-based module routing (Trading → Help → AI)
2. **TypeScript**: Full type safety with strict configuration
3. **Docker Ready**: Multi-stage builds, health checks, non-root security
4. **Testing**: Comprehensive unit/integration/e2e test suite
5. **Logging**: Structured JSON logging with Pino
6. **User Management**: Persistent user preferences and context

### Environment Variables

**Required:**
- `TG_TOKEN` - Telegram bot token
- `ANTHROPIC_API_KEY` - Claude API key

**Optional:**
- `SERPAPI_KEY` - Web search functionality
- `SYSTEM_PROMPT` - Custom bot personality
- `HYPERLIQUID_API_URL` - Trading API endpoint
- `NODE_ENV` - Environment (production/development)
- `PORT` - Server port (default: 3000)

### Current Features

**✅ Implemented:**
- Position tracking without wallet management
- AI chat with web search integration
- Help system with command discovery
- User preferences and context storage
- Comprehensive error handling and logging
- Docker deployment with health monitoring

**🚧 In Progress (see ENHANCEMENT_ROADMAP.md):**
- Order placement and management
- Advanced portfolio analytics
- Real-time market data streaming
- Risk management automation
- Enhanced AI with market analysis

### Message Flow
```
Telegram → index.ts → core.ts → Module Priority Router
                                      ↓
                           [Trading, Help, AI] → Response
```

### Adding Features

**New Module:**
1. Extend `BaseModule` in `src/modules/`
2. Implement `canHandle()` and `handle()` methods  
3. Register in `core.ts` with priority
4. Add tests in `tests/`

**New Command:**
1. Add command logic in `src/commands/`
2. Register patterns in appropriate module
3. Add integration tests
4. Update help documentation

### Development Workflow

1. **Local Development:** `npm run dev` (hot reload with tsx)
2. **Type Checking:** `npm run type-check` (validate TypeScript)
3. **Testing:** `npm run test` (run full test suite)
4. **Docker Testing:** `npm run docker:up` (test containerized)
5. **Production:** Deployed via Docker on Render

### Docker Architecture

- **Multi-stage build:** Builder → Runtime optimization
- **Security:** Non-root user, minimal Alpine Linux
- **Performance:** Production-only dependencies, health checks
- **Monitoring:** Structured logs, port 3000 health endpoint

### Testing Strategy

- **Unit Tests:** Individual components (services, utils)
- **Integration Tests:** Module interactions, API calls
- **E2E Tests:** Full user workflows via Telegram
- **Custom Test Runner:** `test-runner.ts` with parallel execution

### Current Deployment

- **Platform:** Render (Docker environment)
- **URL:** https://altimist-copilot.onrender.com
- **Health:** /health endpoint with feature status
- **Logs:** Structured JSON with correlation IDs

For detailed enhancement plans, see `ENHANCEMENT_ROADMAP.md`.