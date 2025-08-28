// Unit tests for UserService
import 'dotenv/config';
import UserService from '../../../src/services/userService.js';
import { UserData } from '../../../src/types/index.js';

describe('UserService Unit Tests', () => {
  let userService: UserService;
  const testUserId = 123456;
  const testWallet = '0xtest123456789';
  
  beforeEach(() => {
    // Create fresh instance for each test
    userService = new UserService();
    // Reset environment
    delete process.env.NODE_ENV;
  });

  describe('linkUserWallet', () => {
    it('should link a wallet to a user', async () => {
      await userService.linkUserWallet(testUserId, testWallet);
      const wallet = await userService.getUserWallet(testUserId);
      
      expect(wallet).toBe(testWallet);
    });

    it('should update existing user wallet', async () => {
      const newWallet = '0xnewwallet999';
      
      await userService.linkUserWallet(testUserId, testWallet);
      await userService.linkUserWallet(testUserId, newWallet);
      
      const wallet = await userService.getUserWallet(testUserId);
      expect(wallet).toBe(newWallet);
    });

    it('should preserve user preferences when updating wallet', async () => {
      await userService.updateUserPreferences(testUserId, { theme: 'dark' });
      await userService.linkUserWallet(testUserId, testWallet);
      
      const userData = await userService.getUserData(testUserId);
      expect(userData?.preferences.theme).toBe('dark');
      expect(userData?.walletAddress).toBe(testWallet);
    });
  });

  describe('getUserWallet', () => {
    it('should return hardcoded wallet in development mode', async () => {
      process.env.NODE_ENV = 'development';
      const wallet = await userService.getUserWallet(999999); // Any user ID
      
      expect(wallet).toBe('0x0ed637de4b9ccebe6d69991661a2d14f07f569d0');
    });

    it('should return null for non-linked user in production', async () => {
      process.env.NODE_ENV = 'production';
      const wallet = await userService.getUserWallet(999999);
      
      expect(wallet).toBeNull();
    });

    it('should return linked wallet in production', async () => {
      process.env.NODE_ENV = 'production';
      await userService.linkUserWallet(testUserId, testWallet);
      
      const wallet = await userService.getUserWallet(testUserId);
      expect(wallet).toBe(testWallet);
    });
  });

  describe('hasLinkedWallet', () => {
    it('should return true in development mode', async () => {
      process.env.NODE_ENV = 'development';
      const hasWallet = await userService.hasLinkedWallet(999999);
      
      expect(hasWallet).toBe(true);
    });

    it('should return false for non-linked user in production', async () => {
      process.env.NODE_ENV = 'production';
      const hasWallet = await userService.hasLinkedWallet(999999);
      
      expect(hasWallet).toBe(false);
    });

    it('should return true for linked user in production', async () => {
      process.env.NODE_ENV = 'production';
      await userService.linkUserWallet(testUserId, testWallet);
      
      const hasWallet = await userService.hasLinkedWallet(testUserId);
      expect(hasWallet).toBe(true);
    });
  });

  describe('unlinkUserWallet', () => {
    it('should unlink wallet from user', async () => {
      await userService.linkUserWallet(testUserId, testWallet);
      await userService.unlinkUserWallet(testUserId);
      
      process.env.NODE_ENV = 'production'; // Force production to bypass dev wallet
      const wallet = await userService.getUserWallet(testUserId);
      expect(wallet).toBeNull();
    });

    it('should preserve user data when unlinking', async () => {
      await userService.updateUserPreferences(testUserId, { theme: 'dark' });
      await userService.linkUserWallet(testUserId, testWallet);
      await userService.unlinkUserWallet(testUserId);
      
      const userData = await userService.getUserData(testUserId);
      expect(userData?.preferences.theme).toBe('dark');
      expect(userData?.walletAddress).toBeUndefined();
    });
  });

  describe('updateUserPreferences', () => {
    it('should create new user with preferences', async () => {
      await userService.updateUserPreferences(testUserId, { 
        theme: 'dark',
        notifications: true 
      });
      
      const userData = await userService.getUserData(testUserId);
      expect(userData?.preferences.theme).toBe('dark');
      expect(userData?.preferences.notifications).toBe(true);
    });

    it('should merge preferences for existing user', async () => {
      await userService.updateUserPreferences(testUserId, { theme: 'dark' });
      await userService.updateUserPreferences(testUserId, { notifications: true });
      
      const userData = await userService.getUserData(testUserId);
      expect(userData?.preferences.theme).toBe('dark');
      expect(userData?.preferences.notifications).toBe(true);
    });
  });

  describe('deleteUser', () => {
    it('should delete existing user', async () => {
      await userService.linkUserWallet(testUserId, testWallet);
      const deleted = await userService.deleteUser(testUserId);
      
      expect(deleted).toBe(true);
      
      process.env.NODE_ENV = 'production';
      const wallet = await userService.getUserWallet(testUserId);
      expect(wallet).toBeNull();
    });

    it('should return false when deleting non-existent user', async () => {
      const deleted = await userService.deleteUser(999999);
      expect(deleted).toBe(false);
    });
  });

  describe('getAllUsers', () => {
    it('should return empty array initially', async () => {
      const users = await userService.getAllUsers();
      expect(users).toEqual([]);
    });

    it('should return all users', async () => {
      await userService.linkUserWallet(111, '0xwallet1');
      await userService.linkUserWallet(222, '0xwallet2');
      
      const users = await userService.getAllUsers();
      expect(users).toHaveLength(2);
      expect(users.map(u => u.userId).sort()).toEqual([111, 222]);
    });
  });

  describe('getUserCount', () => {
    it('should return correct user count', async () => {
      expect(await userService.getUserCount()).toBe(0);
      
      await userService.linkUserWallet(111, '0xwallet1');
      expect(await userService.getUserCount()).toBe(1);
      
      await userService.linkUserWallet(222, '0xwallet2');
      expect(await userService.getUserCount()).toBe(2);
      
      await userService.deleteUser(111);
      expect(await userService.getUserCount()).toBe(1);
    });
  });
});

// Simple test runner
async function runTests() {
  const tests: Array<{ name: string; fn: () => Promise<void> | void }> = [];
  let currentDescribe = '';
  let currentIt = '';
  
  // Mock describe, it, beforeEach
  (global as any).describe = (name: string, fn: () => void) => {
    currentDescribe = name;
    fn();
  };
  
  (global as any).it = (name: string, fn: () => Promise<void> | void) => {
    tests.push({ name: `${currentDescribe} > ${name}`, fn });
  };
  
  (global as any).beforeEach = (fn: () => void) => {
    // Store for later use
  };
  
  (global as any).expect = (actual: any) => ({
    toBe: (expected: any) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`);
      }
    },
    toBeNull: () => {
      if (actual !== null) {
        throw new Error(`Expected null, got ${actual}`);
      }
    },
    toBeUndefined: () => {
      if (actual !== undefined) {
        throw new Error(`Expected undefined, got ${actual}`);
      }
    },
    toEqual: (expected: any) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toHaveLength: (expected: number) => {
      if (actual.length !== expected) {
        throw new Error(`Expected length ${expected}, got ${actual.length}`);
      }
    }
  });

  // Load test definitions
  describe('UserService Unit Tests', () => {
    // Tests are defined above
  });

  // Run tests
  console.log('🧪 UserService Unit Tests\n');
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const userService = new UserService();
      await test.fn();
      console.log(`  ✅ ${test.name}`);
      passed++;
    } catch (error: any) {
      console.log(`  ❌ ${test.name}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`.replace(/\\/g, '/')) {
  runTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}