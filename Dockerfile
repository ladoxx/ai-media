FROM node:20-slim AS base
WORKDIR /app

# Build tools for native modules (better-sqlite3, sharp)
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# ── Dependencies ────────────────────────────────────────────────
FROM base AS deps
COPY package*.json ./
RUN npm ci

# ── Builder ─────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set DB path so static page generation doesn't fail
ENV DATABASE_URL="file:./prisma/dev.db"

# Generate Prisma client
RUN npx prisma generate

# Create empty DB schema — needed for static prerendering at build time
# (volume mount overrides this at runtime with the real DB)
RUN npx prisma migrate deploy

# Build Next.js
RUN NODE_OPTIONS=--max-old-space-size=4096 npm run build

# ── Runner ──────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production

# Copy everything needed at runtime
COPY --from=builder /app/.next           ./.next
COPY --from=builder /app/public          ./public
COPY --from=builder /app/node_modules    ./node_modules
COPY --from=builder /app/package.json    ./package.json
COPY --from=builder /app/prisma          ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/automation      ./automation
COPY --from=builder /app/lib             ./lib
COPY --from=builder /app/types           ./types
COPY --from=builder /app/scripts         ./scripts
COPY --from=builder /app/tsconfig.json   ./tsconfig.json
COPY --from=builder /app/app/generated   ./app/generated

# Writable directories (volumes will mount here)
RUN mkdir -p public/uploads backups

EXPOSE 4000

# Migrate DB on startup, then start app
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
