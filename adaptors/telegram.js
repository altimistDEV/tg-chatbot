require('dotenv').config();
const axios = require('axios');
const chat  = require('../core');

const TG_API = `https://api.telegram.org/bot${process.env.TG_TOKEN}`;

exports.webhook = async (req, res) => {
  const upd = req.body;
  if (!upd.message || !upd.message.text) return res.sendStatus(200);

  const chatId = upd.message.chat.id;
  const userMsg = upd.message.text;

  const answer = await chat(userMsg, chatId);

  await axios.post(`${TG_API}/sendMessage`, {
    chat_id: chatId,
    text: answer
  });
  res.sendStatus(200);
};

exports.setWebhook = async (publicUrl) => {
  await axios.post(`${TG_API}/setWebhook`, null, {
    params: { url: `${publicUrl}/telegram` }
  });
  console.log('Telegram webhook set to', publicUrl);
};