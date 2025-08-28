// End-to-end tests for Telegram Bot
import 'dotenv/config';
import Core from '../../src/core.js';
import { MessageContext } from '../../src/types/index.js';

describe('Telegram Bot E2E Tests', () => {
  let core: Core;
  let testContext: MessageContext;
  
  beforeAll(async () => {
    process.env.NODE_ENV = 'development';
    process.env.HYPERLIQUID_API_URL = 'https://api.hyperliquid-testnet.xyz';
    
    core = new Core();
    await core.initialize();
  });

  beforeEach(() => {
    testContext = {
      chatId: 123456,
      userId: 123456,
      history: []
    };
  });

  afterAll(async () => {
    await core.cleanup();
  });

  describe('Command Processing', () => {
    it('should handle /help command', async () => {
      const response = await core.handleMessage('/help', testContext);
      
      expect(response).toBeDefined();
      expect(response).toContain('Available commands');
      expect(response).toContain('/position');
      expect(response).toContain('/help');
    });

    it('should handle /position command', async () => {
      const response = await core.handleMessage('/position', testContext);
      
      expect(response).toBeDefined();
      expect(response.length).toBeGreaterThan(0);
      // Should either show positions or "no positions" message
      expect(
        response.includes('Your Positions') || 
        response.includes('No Open Positions')
      ).toBe(true);
    });

    it('should handle /position with coin parameter', async () => {
      const response = await core.handleMessage('/position BTC', testContext);
      
      expect(response).toBeDefined();
      expect(
        response.includes('BTC Position Details') || 
        response.includes('No open position found')
      ).toBe(true);
    });

    it('should handle unknown commands gracefully', async () => {
      const response = await core.handleMessage('/unknowncommand', testContext);
      
      expect(response).toBeDefined();
      expect(response.length).toBeGreaterThan(0);
    });
  });

  describe('Natural Language Processing', () => {
    it('should respond to position queries', async () => {
      const queries = [
        'show my positions',
        'what are my open trades?',
        'display my portfolio'
      ];

      for (const query of queries) {
        const response = await core.handleMessage(query, testContext);
        expect(response).toBeDefined();
        expect(response.length).toBeGreaterThan(0);
      }
    });

    it('should handle greetings', async () => {
      const greetings = ['hello', 'hi', 'hey there'];
      
      for (const greeting of greetings) {
        const response = await core.handleMessage(greeting, testContext);
        expect(response).toBeDefined();
        expect(response.toLowerCase()).toContain('hello');
      }
    });

    it('should provide help when asked', async () => {
      const helpQueries = [
        'how do I use this bot?',
        'what can you do?',
        'help me'
      ];

      for (const query of helpQueries) {
        const response = await core.handleMessage(query, testContext);
        expect(response).toBeDefined();
        expect(response.length).toBeGreaterThan(50); // Help should be detailed
      }
    });
  });

  describe('Context Handling', () => {
    it('should maintain conversation history', async () => {
      // First message
      await core.handleMessage('hello', testContext);
      expect(testContext.history.length).toBe(2); // User + assistant
      
      // Second message
      await core.handleMessage('show my positions', testContext);
      expect(testContext.history.length).toBe(4); // 2 more messages
      
      // Check history structure
      expect(testContext.history[0]?.role).toBe('user');
      expect(testContext.history[1]?.role).toBe('assistant');
    });

    it('should handle context limits', async () => {
      // Add many messages to history
      for (let i = 0; i < 50; i++) {
        testContext.history.push(
          { role: 'user', content: `Message ${i}` },
          { role: 'assistant', content: `Response ${i}` }
        );
      }

      // Should still handle new messages
      const response = await core.handleMessage('/help', testContext);
      expect(response).toBeDefined();
      
      // History should be trimmed
      expect(testContext.history.length).toBeLessThanOrEqual(20);
    });
  });

  describe('Error Recovery', () => {
    it('should handle empty messages', async () => {
      const response = await core.handleMessage('', testContext);
      expect(response).toBeDefined();
      expect(response).toContain('provide more details');
    });

    it('should handle very long messages', async () => {
      const longMessage = 'test '.repeat(1000);
      const response = await core.handleMessage(longMessage, testContext);
      expect(response).toBeDefined();
    });

    it('should handle special characters', async () => {
      const specialChars = '/position <script>alert("test")</script>';
      const response = await core.handleMessage(specialChars, testContext);
      expect(response).toBeDefined();
      expect(response).not.toContain('<script>');
    });

    it('should handle rapid consecutive messages', async () => {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(core.handleMessage(`/position`, testContext));
      }
      
      const responses = await Promise.all(promises);
      responses.forEach(response => {
        expect(response).toBeDefined();
        expect(response.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Module Integration', () => {
    it('should route trading commands to trading module', async () => {
      const response = await core.handleMessage('/position', testContext);
      expect(response).toBeDefined();
      // Check that it's actually from trading module
      expect(
        response.includes('Positions') || 
        response.includes('wallet')
      ).toBe(true);
    });

    it('should route help commands to help module', async () => {
      const response = await core.handleMessage('/help', testContext);
      expect(response).toContain('commands');
    });

    it('should fallback to AI module for general queries', async () => {
      const response = await core.handleMessage('What is Bitcoin?', testContext);
      expect(response).toBeDefined();
      expect(response.length).toBeGreaterThan(10);
    });
  });
});

// Test runner implementation
let testResults = {
  passed: 0,
  failed: 0,
  suites: [] as any[]
};

function describe(suiteName: string, fn: () => void): void {
  const suite = { name: suiteName, tests: [] as any[] };
  testResults.suites.push(suite);
  fn();
}

function it(testName: string, fn: () => void | Promise<void>): void {
  const currentSuite = testResults.suites[testResults.suites.length - 1];
  currentSuite.tests.push({ name: testName, fn });
}

function beforeAll(fn: () => Promise<void>): void {
  // Store for execution before all tests
  (global as any).beforeAllFn = fn;
}

function beforeEach(fn: () => void): void {
  // Store for execution before each test
  (global as any).beforeEachFn = fn;
}

function afterAll(fn: () => Promise<void>): void {
  // Store for execution after all tests
  (global as any).afterAllFn = fn;
}

function expect(actual: any) {
  return {
    toBeDefined() {
      if (actual === undefined) {
        throw new Error(`Expected value to be defined`);
      }
    },
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toContain(expected: string) {
      if (!actual?.includes(expected)) {
        throw new Error(`Expected to contain "${expected}"`);
      }
    },
    toBeGreaterThan(expected: number) {
      if (!(actual > expected)) {
        throw new Error(`Expected ${actual} > ${expected}`);
      }
    },
    toBeLessThanOrEqual(expected: number) {
      if (!(actual <= expected)) {
        throw new Error(`Expected ${actual} <= ${expected}`);
      }
    },
    not: {
      toContain(expected: string) {
        if (actual?.includes(expected)) {
          throw new Error(`Expected not to contain "${expected}"`);
        }
      }
    }
  };
}

// Run tests
async function runE2ETests() {
  console.log('🧪 Telegram Bot E2E Tests\n');
  console.log('=' .repeat(50));
  
  // Define all tests
  describe('Telegram Bot E2E Tests', () => {
    // Tests defined above
  });

  // Setup
  let core: Core;
  let testContext: MessageContext;
  
  try {
    // Run beforeAll
    process.env.NODE_ENV = 'development';
    process.env.HYPERLIQUID_API_URL = 'https://api.hyperliquid-testnet.xyz';
    
    core = new Core();
    await core.initialize();
    console.log('✅ Test environment initialized\n');
  } catch (error: any) {
    console.error('❌ Failed to initialize:', error.message);
    process.exit(1);
  }

  // Run test suites
  for (const suite of testResults.suites) {
    console.log(`\n📦 ${suite.name}`);
    
    for (const test of suite.tests) {
      try {
        // Setup test context
        testContext = {
          chatId: 123456,
          userId: 123456,
          history: []
        };
        
        // Run test with proper context
        await test.fn.call({ core, testContext });
        console.log(`  ✅ ${test.name}`);
        testResults.passed++;
      } catch (error: any) {
        console.log(`  ❌ ${test.name}: ${error.message}`);
        testResults.failed++;
      }
    }
  }

  // Cleanup
  try {
    await core.cleanup();
  } catch (error) {
    // Ignore cleanup errors
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`Results: ${testResults.passed} passed, ${testResults.failed} failed`);
  console.log('=' .repeat(50));
  
  return testResults.failed === 0;
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`.replace(/\\/g, '/')) {
  runE2ETests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}