// Integration test for position command
import 'dotenv/config';
import { PositionCommand } from '../../src/commands/position.js';
import UserService from '../../src/services/userService.js';

const testWallet = '0x0ed637de4b9ccebe6d69991661a2d14f07f569d0';
const testUserId = 123456;

async function testPositionCommand() {
  console.log('🧪 Position Command Integration Test');
  console.log('====================================\n');
  
  // Set up environment
  process.env.NODE_ENV = 'development';
  process.env.HYPERLIQUID_API_URL = 'https://api.hyperliquid-testnet.xyz';
  
  console.log('Configuration:');
  console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`  API URL: ${process.env.HYPERLIQUID_API_URL}`);
  console.log(`  Test Wallet: ${testWallet}\n`);
  
  // Initialize services
  const userService = new UserService();
  const positionCommand = new PositionCommand(userService);
  
  // Create mock context
  let replyContent: string | null = null;
  const mockCtx: any = {
    reply: async (content: string) => {
      replyContent = content;
      return Promise.resolve();
    },
    from: { id: testUserId },
    chat: { id: testUserId }
  };
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  try {
    // Test 1: Fetch positions in development mode
    console.log('Test 1: Fetching positions (development mode)');
    await positionCommand.execute(mockCtx, testUserId);
    
    if (replyContent) {
      if (replyContent.includes('BTC') || replyContent.includes('No Open Positions')) {
        console.log('  ✅ PASS: Command executed successfully');
        if (replyContent.includes('BTC')) {
          console.log('    - Found BTC position');
          const sizeMatch = replyContent.match(/Size: ([\d.]+)/);
          if (sizeMatch) console.log(`    - Size: ${sizeMatch[1]}`);
        } else {
          console.log('    - No positions currently open');
        }
        testsPassed++;
      } else {
        console.log('  ❌ FAIL: Unexpected response');
        testsFailed++;
      }
    } else {
      console.log('  ❌ FAIL: No response received');
      testsFailed++;
    }
    
    // Test 2: Production mode (no wallet configured)
    console.log('\nTest 2: Production mode (should show no wallet)');
    process.env.NODE_ENV = 'production';
    replyContent = null;
    await positionCommand.execute(mockCtx, testUserId);
    
    if (replyContent && replyContent.includes('No wallet configured')) {
      console.log('  ✅ PASS: Shows no wallet configured in production');
      testsPassed++;
    } else {
      console.log('  ❌ FAIL: Should show no wallet configured');
      testsFailed++;
    }
    
    // Test 3: Detailed position view
    console.log('\nTest 3: Detailed position view');
    process.env.NODE_ENV = 'development';
    replyContent = null;
    await positionCommand.executeDetailed(mockCtx, testUserId, 'BTC');
    
    if (replyContent) {
      if (replyContent.includes('BTC Position Details') || replyContent.includes('No open position found')) {
        console.log('  ✅ PASS: Detailed view works correctly');
        testsPassed++;
      } else {
        console.log('  ❌ FAIL: Unexpected detailed view response');
        testsFailed++;
      }
    } else {
      console.log('  ❌ FAIL: No response for detailed view');
      testsFailed++;
    }
    
    // Summary
    console.log('\n' + '='.repeat(40));
    console.log(`Test Results: ${testsPassed} passed, ${testsFailed} failed`);
    
    if (testsFailed === 0) {
      console.log('🎉 All tests passed!');
      process.exit(0);
    } else {
      console.log('⚠️  Some tests failed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Test execution error:', error);
    process.exit(1);
  }
}

// Run the tests
testPositionCommand().catch(console.error);