require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const tg = require('./adaptors/telegram');

const app = express();
app.use(bodyParser.json());

app.post('/telegram', tg.webhook);
app.get('/', (_, res) => res.send('ok'));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Server on', port));