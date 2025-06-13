require('dotenv').config();
const { OpenAI } = require('openai');
const fs = require('fs');
const { getJson } = require('serpapi');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

module.exports = async function core(text) {
  // Read the latest services.txt every time
  const services = fs.readFileSync('services.txt', 'utf8');

  // Check if the message is asking for current information
  const needsWebSearch = text.toLowerCase().includes('current') || 
                        text.toLowerCase().includes('price') ||
                        text.toLowerCase().includes('latest') ||
                        text.toLowerCase().includes('news');

  let webResults = null;
  if (needsWebSearch) {
    webResults = await searchWeb(text);
  }

  let systemPrompt = process.env.SYSTEM_PROMPT + "\n\n" + services;
  if (webResults) {
    systemPrompt += "\n\nHere is some current information from the web:\n" + 
                   JSON.stringify(webResults, null, 2);
  }

  const res = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text }
    ]
  });

  return res.choices[0].message.content.slice(0, 4096);
};
