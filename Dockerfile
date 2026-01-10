FROM node:22-alpine

# Install wget for health checks
RUN apk add --no-cache wget

WORKDIR /app

# Copy package files and install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Copy source code
COPY . .

# Environment variables
ENV NODE_ENV=development
ENV PORT=8080

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Use entrypoint script to handle migrations
ENTRYPOINT ["./docker-entrypoint.sh"]

# Start development server with hot reload
CMD ["yarn", "dev"]