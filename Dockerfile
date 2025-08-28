# Multi-stage Docker build for Telegram Trading Bot
# Stage 1: Build stage - Install dependencies and compile TypeScript
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for building)
RUN npm ci --include=dev

# Copy source code
COPY . .

# Build the TypeScript application
RUN npm run build

# Remove dev dependencies and install only production dependencies
RUN npm prune --omit=dev

# Stage 2: Runtime stage - Minimal production image
FROM node:20-alpine AS runtime

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S botuser -u 1001

# Set working directory
WORKDIR /app

# Copy production node_modules from builder stage
COPY --from=builder --chown=botuser:nodejs /app/node_modules ./node_modules

# Copy built application from builder stage
COPY --from=builder --chown=botuser:nodejs /app/dist ./dist

# Copy package.json for metadata
COPY --from=builder --chown=botuser:nodejs /app/package.json ./

# Create logs directory
RUN mkdir -p /app/logs && chown botuser:nodejs /app/logs

# Switch to non-root user
USER botuser

# Expose port (for health checks)
EXPOSE 3000

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]