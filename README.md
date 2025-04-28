🧠 Altimist Telegram Chatbot

A lightweight, always‑on Telegram bot that uses OpenAI GPT‑3.5‑Turbo to answer customers’ questions about Altimist’s services.

Stack : Node 18 • Express • OpenAI SDK • dotenv

Hosting : Render (Free Web Service)

Messaging : Telegram Bot API

## Project Rationale

Altimist needed a quick, low‑maintenance way to:

Give prospects instant, 24 × 7 answers about our consulting, incubation and AI services.

Keep all logic outside vendor platforms (Twilio was too heavy).

Allow easy future expansion to Discord, Signal & WhatsApp.

Let non‑developers update the service catalogue by editing a simple services.txt file—no redeploy required locally.

## Architecture (Today)

Telegram ↔ webhook  ─┐        (Render free dyno)
                     ├─ index.js (Express)
services.txt ← fs.readFile ─┤
                     └─ core.js  ──► OpenAI Chat Completion

index.js routes Telegram POSTs to adapters/telegram.js.

core.js constructs the prompt from SYSTEM_PROMPT + the live contents of services.txt.

The bot replies via Telegram’s sendMessage endpoint.

## Step‑by‑Step Build Log

Exactly what we did (so you can reproduce from scratch).

 # 

Action

Commands / Notes

 1

Bootstrap project

mkdir tg-chatbot && cd tg-chatbot ⋯ npm init -y

 2

Install deps

npm i express body-parser axios dotenv openai

 3

Create folders & files

mkdir adapters``ni .env core.js index.js adapters\telegram.js

 4

**Fill **`` with OPENAI_API_KEY, TG_TOKEN, SYSTEM_PROMPT, PORT



 5

Write code (core, adapter, index)

See /core.js, /adapters/telegram.js, /index.js

 6

**Create **``

List all real Altimist offerings (editable any time).

 7

Local test

node index.js + ngrok http 3000 + setWebhook() helper

 8

**Add **``

Exclude .env, node_modules

 9

Commit & push to GitHub

git remote add origin … → git push -u origin main

 10

Deploy to Render

Dashboard → New Web Service → build cmd npm install, start cmd node index.js

 11

Set Telegram webhook to Render URL

node -e "require('./adapters/telegram').setWebhook('https://YOUR.onrender.com')"

 12

Bot live!

Send “hi” in Telegram → GPT answer

## Quick‑Start (Local)

# clone & install
git clone https://github.com/altimistDEV/tg-chatbot.git
cd tg-chatbot
npm install

# copy .env.example → .env and add your keys
node index.js            # bot on http://localhost:3000
ngrok http 3000          # expose
node -e "require('./adapters/telegram').setWebhook('https://xyz.ngrok.app')"

Update services.txt any time → changes take effect on the next message without restart.

## Deployment (Render)

Create a Web Service → connect repo → Node 18.

Build command npm install  •  Start command node index.js.

Set environment variables (OPENAI_API_KEY, TG_TOKEN, etc.).

Wait for first deploy → copy Render URL → run setWebhook() once.

Free tier stays awake as long as Telegram traffic hits it roughly every 15 min.

## Future Roadmap 🗺️

1 ▪ Multi‑Channel Expansion

Channel

Approach

Discord

Add adapters/discord.js using discord.js library + Bot token.

Signal

Run signal-cli-rest-api container; add webhook adapter.

WhatsApp

When Altimist’s WABA is ready, add 360dialog Cloud API adapter.

2 ▪ Persistent Memory / Context

Plug simple Redis (Upstash) to store last N turns per user.

Improves continuity across long sessions.

3 ▪ P2P Payments via Web3 Domains (Vision)

Goal: Users type natural language like “send 50 BCH to arthur.altimist” and the bot executes a peer‑to‑peer crypto payment.

Planned components

Wallet integration – Connect Altimist custodial wallet or user‑provided wallet via Wallet Connect.

Web3 domain lookup – Resolve arthur.altimist → wallet address.

Intent parsing – Extend core.js to detect a payment intent (/send, send, transfer).

Confirmation step – Bot confirms amount, currency, recipient.

Blockchain TX – Call BCH RPC or payment API and return TXID.

Security – Multi‑factor or Telegram /confirm 123456 to prevent spoofing.

Future tech choices: BCH SDK, ENS‑style resolver for .altimist, signed JWT proof.

## Contributing

Fork the repo.

git checkout -b feature/my-change

Commit & push ➜ open PR.

Feel free to open issues to discuss new service ideas or adapters!

## License

MIT © Altimist 2025

