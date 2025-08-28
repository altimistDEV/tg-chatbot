#!/usr/bin/env tsx
// Simple unit test for UserService that actually runs

import 'dotenv/config';
import UserService from '../../../src/services/userService.js';

async function testUserService() {
  console.log('🧪 UserService Unit Tests\n');
  
  let passed = 0;
  let failed = 0;
  const tests: Array<{ name: string; fn: () => Promise<void> }> = [];

  // Define tests
  tests.push({
    name: 'should link wallet to user',
    fn: async () => {
      const userService = new UserService();
      const userId = 123456;
      const wallet = '0xtest123';
      
      await userService.linkUserWallet(userId, wallet);
      
      // Switch to production to bypass dev override
      process.env.NODE_ENV = 'production';
      const retrieved = await userService.getUserWallet(userId);
      
      if (retrieved !== wallet) {
        throw new Error(`Expected ${wallet}, got ${retrieved}`);
      }
    }
  });

  tests.push({
    name: 'should return hardcoded wallet in development',
    fn: async () => {
      process.env.NODE_ENV = 'development';
      const userService = new UserService();
      const wallet = await userService.getUserWallet(999999);
      
      if (wallet !== '0x0ed637de4b9ccebe6d69991661a2d14f07f569d0') {
        throw new Error(`Expected hardcoded wallet, got ${wallet}`);
      }
    }
  });

  tests.push({
    name: 'should return null for non-linked user in production',
    fn: async () => {
      process.env.NODE_ENV = 'production';
      const userService = new UserService();
      const wallet = await userService.getUserWallet(888888);
      
      if (wallet !== null) {
        throw new Error(`Expected null, got ${wallet}`);
      }
    }
  });

  tests.push({
    name: 'should update user preferences',
    fn: async () => {
      const userService = new UserService();
      const userId = 111111;
      
      await userService.updateUserPreferences(userId, { theme: 'dark' });
      const userData = await userService.getUserData(userId);
      
      if (userData?.preferences.theme !== 'dark') {
        throw new Error(`Expected theme to be dark`);
      }
    }
  });

  tests.push({
    name: 'should delete user successfully',
    fn: async () => {
      const userService = new UserService();
      const userId = 222222;
      
      await userService.linkUserWallet(userId, '0xwallet');
      const deleted = await userService.deleteUser(userId);
      
      if (!deleted) {
        throw new Error(`Expected delete to return true`);
      }
      
      process.env.NODE_ENV = 'production';
      const wallet = await userService.getUserWallet(userId);
      
      if (wallet !== null) {
        throw new Error(`Expected wallet to be null after delete`);
      }
    }
  });

  tests.push({
    name: 'should count users correctly',
    fn: async () => {
      const userService = new UserService();
      
      const initial = await userService.getUserCount();
      await userService.linkUserWallet(333, '0xaaa');
      await userService.linkUserWallet(444, '0xbbb');
      
      const afterAdd = await userService.getUserCount();
      
      if (afterAdd !== initial + 2) {
        throw new Error(`Expected count to increase by 2`);
      }
      
      await userService.deleteUser(333);
      const afterDelete = await userService.getUserCount();
      
      if (afterDelete !== initial + 1) {
        throw new Error(`Expected count to decrease by 1`);
      }
    }
  });

  // Run tests
  for (const test of tests) {
    try {
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

// Run test
testUserService().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test error:', error);
  process.exit(1);
});