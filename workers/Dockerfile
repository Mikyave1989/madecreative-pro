FROM node:20-bullseye-slim
WORKDIR /app

# System deps for Playwright
RUN apt-get update && apt-get install -y \
  python3 make g++ openssl \
  wget gnupg \
  --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Copy root workspace files
COPY package.json package-lock.json ./
COPY tsconfig.json ./

# Patch workspaces — only what the worker needs
RUN node -e " \
  const p = JSON.parse(require('fs').readFileSync('package.json','utf8')); \
  p.workspaces = ['apps/api','packages/*','workers']; \
  require('fs').writeFileSync('package.json', JSON.stringify(p, null, 2));"

COPY apps/api/package.json apps/api/
COPY apps/api/prisma apps/api/prisma/
COPY apps/api/src apps/api/src/
COPY apps/api/tsconfig.json apps/api/

COPY packages/db/ packages/db/
COPY packages/shared/ packages/shared/
COPY packages/agents/ packages/agents/

COPY workers/ workers/

# Install deps (no postinstall scripts — Playwright installed separately)
RUN npm install --ignore-scripts

# Install Playwright Chromium browser
RUN npx playwright install --with-deps chromium

# Generate Prisma client
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

# Build only what the worker needs
RUN npm run build --workspace=packages/db || true
RUN npm run build --workspace=packages/shared || true
RUN npm run build --workspace=packages/agents || true
RUN npx tsc --project workers/tsconfig.json

CMD node workers/dist/agent-runner.js
