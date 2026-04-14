FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++ openssl

# Copy root workspace files
COPY package.json package-lock.json ./
COPY tsconfig.json ./

# Patch workspaces: remove apps/* glob, keep only apps/api explicitly
RUN node -e " \
  const p = JSON.parse(require('fs').readFileSync('package.json','utf8')); \
  p.workspaces = ['apps/api','packages/*','workers']; \
  require('fs').writeFileSync('package.json', JSON.stringify(p, null, 2));"

# Copy only what workers need
COPY apps/api/package.json apps/api/
COPY apps/api/prisma apps/api/prisma/
COPY apps/api/src apps/api/src/
COPY apps/api/tsconfig.json apps/api/

COPY packages/db/ packages/db/
COPY packages/shared/ packages/shared/
COPY packages/agents/ packages/agents/
COPY packages/ai/ packages/ai/

COPY workers/ workers/

# Install deps
RUN npm install --ignore-scripts

# Generate Prisma client for linux-musl (Alpine)
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

# Build shared packages in dependency order
RUN npm run build --workspace=packages/db || true
RUN npm run build --workspace=packages/shared || true
RUN npm run build --workspace=packages/ai || true
RUN npm run build --workspace=packages/agents || true

# Build API
RUN npm run build --workspace=@madecreative/api || true

# Build workers (TypeScript → JavaScript)
RUN npx tsc --project workers/tsconfig.json

# --- Runtime stage ---
FROM node:20-bullseye-slim
WORKDIR /app

# Install Playwright system dependencies + Chromium
RUN apt-get update && apt-get install -y \
  chromium \
  chromium-driver \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libgdk-pixbuf2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils \
  --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Copy built app from builder
COPY --from=builder /app /app

# Install Playwright browsers after node_modules are available
RUN PLAYWRIGHT_BROWSERS_PATH=/ms-playwright npx playwright install chromium && \
    echo "Playwright chromium installed at /ms-playwright"

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV WORKER_SCRIPT="agent-runner"

CMD node workers/dist/${WORKER_SCRIPT}.js
