# Modernization Plan

## Priority 1: Quick Wins (Can do now)

### 1. Update package.json
```json
{
  "name": "tg-chatbot",
  "version": "2.0.0",
  "description": "Platform-agnostic modular chatbot with AI and trading features",
  "main": "index.js",
  "type": "module",
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/",
    "format": "prettier --write 'src/**/*.js'"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.54.0",
    "axios": "^1.11.0",
    "dotenv": "^16.6.1",
    "express": "^5.1.0",
    "serpapi": "^2.1.0",
    "telegraf": "^4.16.3",
    "pino": "^8.0.0",
    "helmet": "^7.0.0",
    "express-rate-limit": "^7.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0",
    "jest": "^29.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "@types/node": "^20.0.0"
  }
}
```

### 2. Remove unused packages
```bash
npm uninstall body-parser openai
```

### 3. Create config module
```javascript
// src/config/index.js
export default {
  port: process.env.PORT || 3000,
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY
  },
  telegram: {
    token: process.env.TG_TOKEN
  },
  hyperliquid: {
    apiUrl: process.env.HYPERLIQUID_API_URL || 'https://api.hyperliquid-testnet.xyz'
  },
  serpapi: {
    key: process.env.SERPAPI_KEY
  },
  systemPrompt: process.env.SYSTEM_PROMPT,
  logLevel: process.env.LOG_LEVEL || 'info'
};
```

### 4. Add logger
```javascript
// src/utils/logger.js
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  }
});
```

## Priority 2: ES Modules Migration

### Convert all files from CommonJS to ES Modules:

**Before (CommonJS):**
```javascript
const express = require('express');
module.exports = myFunction;
```

**After (ES Modules):**
```javascript
import express from 'express';
export default myFunction;
```

### Migration Steps:
1. Change `"type": "module"` in package.json
2. Update all `require()` to `import`
3. Update all `module.exports` to `export`
4. Update all dynamic requires to dynamic imports
5. Fix __dirname usage: `import.meta.url`

## Priority 3: TypeScript (Optional)

### Benefits:
- Type safety
- Better IDE support
- Self-documenting code
- Catch errors at compile time

### Setup:
```bash
npm install -D typescript @types/express ts-node
npx tsc --init
```

### Example conversion:
```typescript
// src/modules/base.module.ts
export interface ModuleContext {
  text: string;
  chatId: string;
  history: Message[];
  metadata: {
    platform: string;
    userId: string;
    formatting: string;
  };
}

export abstract class BaseModule {
  abstract canHandle(text: string, context: ModuleContext): Promise<boolean>;
  abstract handle(text: string, context: ModuleContext): Promise<string>;
}
```

## Priority 4: Testing

### Jest Configuration
```javascript
// jest.config.js
export default {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/tests/**'
  ],
  testMatch: [
    '**/tests/**/*.test.js'
  ]
};
```

### Example Test
```javascript
// tests/unit/modules/help.module.test.js
import { HelpModule } from '../../../src/modules/help.module.js';

describe('HelpModule', () => {
  let module;

  beforeEach(() => {
    module = new HelpModule();
  });

  test('should handle /help command', async () => {
    const canHandle = await module.canHandle('/help', {});
    expect(canHandle).toBe(true);
  });

  test('should not handle regular messages', async () => {
    const canHandle = await module.canHandle('hello world', {});
    expect(canHandle).toBe(false);
  });
});
```

## Priority 5: DevOps

### Docker
```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
```

### GitHub Actions
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      - run: npm run lint
```

## Implementation Order

1. **Week 1**: Package updates, config module, logger
2. **Week 2**: ES Modules migration
3. **Week 3**: Testing setup and initial tests
4. **Week 4**: TypeScript migration (optional)
5. **Ongoing**: Add tests as you develop features

## Benefits After Modernization

- ✅ Better performance (ES Modules are faster)
- ✅ Improved security (helmet, rate limiting)
- ✅ Better debugging (proper logging)
- ✅ Easier maintenance (tests, linting)
- ✅ Future-proof (modern JavaScript)
- ✅ Better deployment (Docker)
- ✅ Type safety (if using TypeScript)