require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const { getJson } = require('serpapi');

// Debug: Check if API key is loaded
console.log('API Key loaded:', process.env.ANTHROPIC_API_KEY ? 'Yes' : 'No');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// In-memory conversation history store
const conversationHistory = {};

async function searchWeb(query) {
  try {
    const results = await getJson({
      api_key: process.env.SERPAPI_KEY,
      q: query,
      engine: "google"
    });
    
    if (results.organic_results && results.organic_results.length > 0) {
      return results.organic_results.slice(0, 3).map(result => ({
        title: result.title,
        snippet: result.snippet,
        link: result.link
      }));
    }
    return null;
  } catch (error) {
    console.error('Web search error:', error);
    return null;
  }
}

module.exports = async function core(text, chatId) {
  // Read the latest services.txt every time
  const services = fs.readFileSync('services.txt', 'utf8');

  // Check if the message is asking for current information
  const needsWebSearch = text.toLowerCase().includes('current') || 
                        text.toLowerCase().includes('price') ||
                        text.toLowerCase().includes('latest') ||
                        text.toLowerCase().includes('news') ||
                        text.toLowerCase().includes('weather');

  // Check if the query is about Altimist services
  const isServiceQuery = text.toLowerCase().includes('altimist') ||
                        text.toLowerCase().includes('service') ||
                        text.toLowerCase().includes('consulting') ||
                        text.toLowerCase().includes('advisory');

  let webResults = null;
  if (needsWebSearch) {
    webResults = await searchWeb(text);
  }

  let systemPrompt;
  if (isServiceQuery) {
    // Use Altimist service prompt for service-related queries
    systemPrompt = process.env.SYSTEM_PROMPT + "\n\n" + services;
  } else {
    // Use a more general prompt for web search queries
    systemPrompt = "You are a helpful assistant that provides accurate and up-to-date information from the web. " +
                  "When providing information, cite your sources and be clear about what information is current and what might be outdated. " +
                  "If you're not sure about something, say so rather than making assumptions.";
  }

  if (webResults) {
    systemPrompt += "\n\nHere is some current information from the web:\n" + 
                   JSON.stringify(webResults, null, 2);
  }

  // Retrieve conversation history for this chat
  if (!conversationHistory[chatId]) {
    conversationHistory[chatId] = [];
  }
  const history = conversationHistory[chatId];

  // Add the current user message to history
  history.push({ role: 'user', content: text });

  // Prepare messages for Claude, including conversation history
  const messages = history;

  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: messages,
    temperature: 0.7,
    system: systemPrompt,
  });

  const response = res.content[0].text;
  
  // Add the assistant's response to history
  history.push({ role: 'assistant', content: response });

  // Limit history to last 10 messages to prevent token overflow
  if (history.length > 10) {
    history.shift();
  }

  return response;
};
