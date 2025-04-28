require('dotenv').config();
const { OpenAI } = require('openai');
const fs = require('fs');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

module.exports = async function core(text) {
  // Read the latest services.txt every time
  const services = fs.readFileSync('services.txt', 'utf8');

  const res = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: process.env.SYSTEM_PROMPT + "\n\n" + services },
      { role: 'user',   content: text }
    ]
  });

  return res.choices[0].message.content.slice(0, 4096);
};
