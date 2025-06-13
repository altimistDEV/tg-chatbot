require('dotenv').config();
const core = require('./core');

async function testSearch() {
    try {
        console.log('Testing web search functionality...\n');
        
        const testQueries = [
            "What's the current price of CCD?",
            "Tell me the latest news about AI",
            "What's the weather like in London?"
        ];

        for (const query of testQueries) {
            console.log(`\nTesting query: "${query}"`);
            console.log('----------------------------------------');
            const response = await core(query);
            console.log('Response:', response);
            console.log('----------------------------------------');
        }
    } catch (error) {
        console.error('Error during test:', error);
    }
}

testSearch(); 