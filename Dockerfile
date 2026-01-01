# ===================================
# Stage 1: Dependencies
# ===================================
FROM node:22-alpine AS dependencies

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install ALL dependencies (including dev for build stage)
RUN yarn install --frozen-lockfile

# ===================================
# Stage 2: Builder
# ===================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code and config files
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript to JavaScript
RUN yarn build

# ===================================
# Stage 3: Production
# ===================================
FROM node:22-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install ONLY production dependencies
RUN yarn install --production --frozen-lockfile && \
    yarn cache clean

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/build ./build

# Copy Prisma schema and migrations
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Copy node_modules with Prisma Client from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Copy ecosystem config for PM2
COPY --chown=nodejs:nodejs ecosystem.config.json ./

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["yarn", "start"]