// test-better-stack.ts
// Test script to verify Better Stack logging integration

import { createLogger, LogAction, flushLogs } from './src/utils/enhanced-logger.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testBetterStackIntegration() {
  console.log('🔧 Testing Better Stack Integration...\n');
  
  // Check if Better Stack token is configured
  const token = process.env.BETTERSTACK_SOURCE_TOKEN || process.env.LOGTAIL_SOURCE_TOKEN;
  
  if (!token) {
    console.log('⚠️  No Better Stack token found in environment variables.');
    console.log('📝 To enable Better Stack logging:');
    console.log('   1. Sign up at https://betterstack.com (free tier available)');
    console.log('   2. Create a new source in your Better Stack dashboard');
    console.log('   3. Copy the source token');
    console.log('   4. Add to .env: BETTERSTACK_SOURCE_TOKEN=your_token_here');
    console.log('\n🔍 Testing local logging only...\n');
  } else {
    console.log('✅ Better Stack token found!');
    console.log('📡 Logs will be streamed to Better Stack dashboard.\n');
  }
  
  // Create a test logger with user context
  const logger = createLogger({
    userContext: {
      userId: 'test_user_123',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      platform: 'telegram',
      userTier: 'premium'
    }
  });
  
  console.log('📊 Sending test logs...\n');
  
  // Test different log levels and actions
  logger.info(LogAction.USER_SESSION_START, {
    message: 'Test user session started',
    metadata: {
      testRun: true,
      timestamp: new Date().toISOString()
    }
  });
  
  // Simulate command execution
  logger.startTimer('command_execution');
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate processing
  
  logger.logCommand(
    '/test',
    'test-module',
    'success',
    {
      responseTime: 100,
      testData: 'This is a test command execution'
    }
  );
  
  // Test API call logging
  logger.logApiCall(
    'TestService',
    '/api/test',
    250,
    'success'
  );
  
  // Test trading action logging
  logger.logTrading(
    'position_check',
    {
      symbol: 'BTC-USD',
      position: 'long',
      size: 0.5,
      pnl: 150.25
    },
    {
      responseTime: 150,
      apiCalls: { hyperliquid: 2 }
    }
  );
  
  // Test warning log
  logger.warn(LogAction.API_RATE_LIMIT, {
    message: 'Approaching rate limit',
    metadata: {
      service: 'anthropic',
      remaining: 10,
      resetIn: 60
    }
  });
  
  // Test error logging
  logger.error(
    LogAction.ERROR,
    new Error('Test error for Better Stack'),
    {
      message: 'This is a test error',
      metadata: {
        errorType: 'TestError',
        testRun: true
      }
    }
  );
  
  // Test audit logging for sensitive operations
  logger.logSensitive(
    '/admin/settings',
    true,
    {
      action: 'config_updated',
      changes: ['log_level', 'api_timeout']
    }
  );
  
  console.log('✅ Test logs sent!\n');
  
  if (token) {
    console.log('📍 View your logs at:');
    console.log('   https://logs.betterstack.com\n');
    console.log('💡 Tips for Better Stack dashboard:');
    console.log('   - Use the search bar to filter by correlationId');
    console.log('   - Create charts for command_duration metrics');
    console.log('   - Set up alerts for ERROR level logs');
    console.log('   - Use the Live Tail feature for real-time monitoring\n');
  }
  
  // Ensure all logs are sent before exiting
  console.log('🔄 Flushing logs...');
  await flushLogs();
  
  console.log('✨ Test complete!\n');
}

// Run the test
testBetterStackIntegration().catch(console.error);