require('dotenv').config();
const core = require('./core');

async function testClaude() {
  try {
    console.log('Testing Claude integration...\n');
    
    // Test 1: Basic conversation
    console.log('Test 1: Basic conversation');
    const response1 = await core('Hello, how are you?', 'test-chat-1');
    console.log('Response:', response1);
    console.log('\n-------------------\n');

    // Test 2: Service-related query
    console.log('Test 2: Service-related query');
    const response2 = await core('What services does Altimist offer?', 'test-chat-2');
    console.log('Response:', response2);
    console.log('\n-------------------\n');

    // Test 3: Web search query
    console.log('Test 3: Web search query');
    const response3 = await core('What are the current market trends?', 'test-chat-3');
    console.log('Response:', response3);
    console.log('\n-------------------\n');

  } catch (error) {
    console.error('Error during testing:', error);
  }
}

testClaude(); 