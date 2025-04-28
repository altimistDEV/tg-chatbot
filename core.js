require('dotenv').config();
const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

module.exports = async function core(text) {
  const rsp = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: process.env.SYSTEM_PROMPT },
      { role: 'user',   content: text }
    ]
  });
  return rsp.choices[0].message.content.slice(0, 4096);
};