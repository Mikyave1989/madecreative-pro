FROM node:20-alpine AS base
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ openssl

# Copy root workspace files
COPY package.json package-lock.json ./
COPY tsconfig.json ./

# Copy app package.json stubs so npm workspaces resolves all members
COPY apps/api/package.json apps/api/
COPY apps/portal/package.json apps/portal/
COPY apps/marketing/package.json apps/marketing/
COPY apps/admin/package.json apps/admin/

# Copy Prisma schema (needed for prisma generate)
COPY apps/api/prisma apps/api/prisma/

# Copy workspace packages
COPY packages/db/ packages/db/
COPY packages/shared/ packages/shared/
COPY packages/agents/ packages/agents/
COPY packages/ai/ packages/ai/

# Copy workers
COPY workers/ workers/

# Install all dependencies (--ignore-scripts skips postinstall which needs
# prisma CLI before it's fully hoisted — we run prisma generate explicitly below)
RUN npm install --include=dev --ignore-scripts

# Generate Prisma client for linux-musl (Alpine)
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

RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
COPY tsconfig.json ./

COPY apps/api/package.json apps/api/
COPY apps/portal/package.json apps/portal/
COPY apps/marketing/package.json apps/marketing/
COPY apps/admin/package.json apps/admin/

COPY apps/api/prisma apps/api/prisma/
COPY packages/db/ packages/db/
COPY packages/shared/ packages/shared/
COPY packages/agents/ packages/agents/
COPY packages/ai/ packages/ai/
COPY workers/ workers/

# --ignore-scripts: skip postinstall (prisma generate) since prisma CLI
# is a devDependency and won't be available with --omit=dev
RUN npm install --omit=dev --ignore-scripts

# Copy the generated Prisma client binary from build stage (same Alpine image,
# binary is compatible — no need to regenerate)
COPY --from=base /app/node_modules/.prisma node_modules/.prisma

# Copy compiled TypeScript output from build stage
COPY --from=base /app/packages/db/dist packages/db/dist
COPY --from=base /app/packages/shared/dist packages/shared/dist
COPY --from=base /app/packages/agents/dist packages/agents/dist
COPY --from=base /app/packages/ai/dist packages/ai/dist
COPY --from=base /app/workers/dist workers/dist

# Default: agent-runner (override via Railway start command per service)
CMD ["node", "workers/dist/agent-runner.js"]
