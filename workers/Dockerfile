FROM node:20-alpine AS base
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy root workspace files
COPY package.json package-lock.json ./
COPY tsconfig.json ./

# Copy workspace packages
COPY packages/db/ packages/db/
COPY packages/shared/ packages/shared/
COPY packages/agents/ packages/agents/
COPY packages/ai/ packages/ai/

# Copy workers
COPY workers/ workers/

# Install all dependencies (including dev for TypeScript)
RUN npm install --include=dev

# Generate Prisma client for linux-musl
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

# Build packages
RUN npm run build --workspace=packages/db || true
RUN npm run build --workspace=packages/shared || true
RUN npm run build --workspace=packages/agents || true
RUN npm run build --workspace=packages/ai || true

# Build workers
RUN npm run build --workspace=workers

# ─── Production stage ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

COPY package.json package-lock.json ./
COPY tsconfig.json ./
COPY packages/db/ packages/db/
COPY packages/shared/ packages/shared/
COPY packages/agents/ packages/agents/
COPY packages/ai/ packages/ai/
COPY workers/ workers/

RUN npm install --omit=dev

# Copy compiled output from build stage
COPY --from=base /app/packages/db/dist packages/db/dist
COPY --from=base /app/packages/shared/dist packages/shared/dist
COPY --from=base /app/packages/agents/dist packages/agents/dist
COPY --from=base /app/packages/ai/dist packages/ai/dist
COPY --from=base /app/workers/dist workers/dist

# Default: agent-runner (override via Railway start command)
CMD ["node", "workers/dist/agent-runner.js"]
