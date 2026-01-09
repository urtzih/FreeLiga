# Multi-stage build for FreeSquash Backend
# Build targets: production (default) or development

# Stage 1: Base with dependencies (Debian-based for OpenSSL 1.1 compatibility)
FROM node:20-bullseye-slim AS base

WORKDIR /app

# Ensure OpenSSL 1.1 is available for Prisma and build tools for native modules
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       openssl \
       ca-certificates \
       python3 \
       make \
       g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/database/package*.json ./packages/database/
COPY tsconfig*.json ./

# Clean up any pre-existing node_modules (important for Windows Docker)
RUN rm -rf node_modules apps/api/node_modules packages/database/node_modules

# Install dependencies (both production and dev for flexibility)
RUN npm install

# Copy source code
COPY apps/api ./apps/api
COPY packages/database ./packages/database

# Generate Prisma Client for Linux
RUN cd packages/database && npx prisma generate

# Stage 2: Development (with hot reload support)
FROM base AS development

WORKDIR /app

EXPOSE 3001

CMD ["npm", "run", "dev", "--workspace=apps/api"]

# Stage 3: Build for production
FROM base AS builder

WORKDIR /app

# Build database package
RUN npm run build --workspace=packages/database

# Build backend TypeScript to JavaScript
RUN npm run build --workspace=apps/api

# Stage 4: Production Runtime (Debian-based to match Prisma engine)
FROM node:20-bullseye-slim AS production

WORKDIR /app

# Ensure OpenSSL 1.1 is available at runtime
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy package files for production install
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/database/package*.json ./packages/database/

# Install only production dependencies
RUN npm install --omit=dev && npm cache clean --force

# Copy built artifacts and Prisma from builder
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/packages/database/dist ./packages/database/dist

# Create non-root user for security
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -s /bin/sh -m nodejs
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Run database migrations and start the application
CMD ["sh", "-c", "npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma && node apps/api/dist/server.js"]
