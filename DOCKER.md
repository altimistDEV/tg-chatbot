# 🐳 Docker Guide

Complete guide for running the Telegram Trading Bot with Docker.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Copy `.env.docker` to `.env` and fill in your API keys

### Production Deployment
```bash
# Build and run in production mode
npm run docker:up

# View logs
npm run docker:logs

# Stop the bot
npm run docker:down
```

### Development with Hot Reload
```bash
# Build and run in development mode
npm run docker:up:dev

# View development logs
npm run docker:logs:dev

# Stop development container
npm run docker:down
```

## 📝 Available Docker Scripts

| Command | Description |
|---------|-------------|
| `npm run docker:build` | Build production image |
| `npm run docker:build:dev` | Build development image |
| `npm run docker:run` | Run production container |
| `npm run docker:run:dev` | Run development container |
| `npm run docker:up` | Start with docker-compose (production) |
| `npm run docker:up:dev` | Start with docker-compose (development) |
| `npm run docker:down` | Stop all containers |
| `npm run docker:logs` | View production logs |
| `npm run docker:logs:dev` | View development logs |
| `npm run docker:clean` | Clean up Docker system |

## 🏗️ Docker Architecture

### Multi-stage Build
The Dockerfile uses a multi-stage build approach:

1. **Builder stage**: Compiles TypeScript and installs dependencies
2. **Runtime stage**: Creates minimal production image

### Security Features
- ✅ Non-root user (`botuser`)
- ✅ Minimal Alpine Linux base image
- ✅ Only production dependencies in final image
- ✅ Health checks included

## 📊 Monitoring

### Health Checks
The bot includes built-in health checks:
```bash
# Check container health
docker ps

# View health check logs
docker inspect telegram-trading-bot
```

### Resource Usage
```bash
# Monitor resource usage
docker stats telegram-trading-bot

# View detailed container info
docker inspect telegram-trading-bot
```

## 🔧 Configuration

### Environment Variables
Set these in your `.env` file:

**Required:**
- `TG_TOKEN` - Telegram bot token
- `ANTHROPIC_API_KEY` - Claude API key

**Optional:**
- `SERPAPI_KEY` - For web search functionality
- `SYSTEM_PROMPT` - Custom bot personality
- `HYPERLIQUID_API_URL` - Mainnet or testnet URL

### Volume Mounts
- `./logs:/app/logs` - Persistent log storage

### Networking
- Port 3000 exposed for health checks
- Bridge network for service communication

## 🚀 Deployment Options

### 1. Local Docker
```bash
# Quick start
docker run --env-file .env -p 3000:3000 telegram-trading-bot
```

### 2. Docker Compose
```bash
# Production
docker-compose up -d

# Development with hot reload
docker-compose --profile dev up -d tg-bot-dev
```

### 3. Cloud Platforms

#### Google Cloud Run
```bash
# Build and push
docker build -t gcr.io/PROJECT-ID/tg-bot .
docker push gcr.io/PROJECT-ID/tg-bot

# Deploy
gcloud run deploy tg-bot \
  --image gcr.io/PROJECT-ID/tg-bot \
  --platform managed \
  --allow-unauthenticated
```

#### AWS ECS
```bash
# Build and push to ECR
aws ecr create-repository --repository-name tg-bot
docker build -t ACCOUNT.dkr.ecr.REGION.amazonaws.com/tg-bot .
docker push ACCOUNT.dkr.ecr.REGION.amazonaws.com/tg-bot
```

#### DigitalOcean App Platform
```yaml
# app.yaml
name: telegram-trading-bot
services:
- name: bot
  source_dir: /
  github:
    repo: your-username/tg-chatbot
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: TG_TOKEN
    value: your_token_here
```

## 🛠️ Development

### Hot Reload Development
```bash
# Start development container
npm run docker:up:dev

# Code changes are automatically reflected
# No need to rebuild the container
```

### Debugging
```bash
# Enter running container
docker exec -it telegram-trading-bot sh

# View application logs
npm run docker:logs

# Check health endpoint
curl http://localhost:3000/health
```

### Building Custom Images
```bash
# Build with custom tag
docker build -t my-tg-bot:v1.0.0 .

# Build development image
docker build -f Dockerfile.dev -t my-tg-bot:dev .

# Build for specific platform
docker build --platform linux/amd64 -t my-tg-bot .
```

## 📈 Performance Optimization

### Image Size Optimization
- ✅ Multi-stage build removes dev dependencies
- ✅ Alpine Linux base image (minimal size)
- ✅ .dockerignore excludes unnecessary files

### Runtime Optimization
- ✅ Non-root user for security
- ✅ dumb-init for proper signal handling
- ✅ Health checks for monitoring
- ✅ Resource limits can be set via docker-compose

## 🔍 Troubleshooting

### Common Issues

#### Bot not starting
```bash
# Check logs
npm run docker:logs

# Check if all environment variables are set
docker exec telegram-trading-bot env | grep -E "(TG_TOKEN|ANTHROPIC)"
```

#### Health check failing
```bash
# Test health endpoint manually
curl http://localhost:3000/health

# Check if port 3000 is accessible
netstat -tulpn | grep 3000
```

#### Container crashes
```bash
# View container logs
docker logs telegram-trading-bot --tail 50

# Check container resource usage
docker stats telegram-trading-bot
```

### Useful Commands
```bash
# Rebuild containers
npm run docker:down && npm run docker:up

# Clean up everything
npm run docker:clean

# View container details
docker inspect telegram-trading-bot

# Export container logs
docker logs telegram-trading-bot > bot-logs.txt
```

## 📚 Additional Resources

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Node.js Docker Guide](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)