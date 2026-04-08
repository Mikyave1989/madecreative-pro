FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache python3 make g++ openssl

# Copy root workspace files
COPY package.json package-lock.json ./
COPY tsconfig.json ./

# Copy app package.json stubs so npm workspaces resolves all workspace members
COPY apps/api/package.json apps/api/
COPY apps/portal/package.json apps/portal/
COPY apps/marketing/package.json apps/marketing/
COPY apps/admin/package.json apps/admin/

# Copy Prisma schema
COPY apps/api/prisma apps/api/prisma/

# Copy workspace packages source
COPY packages/db/ packages/db/
COPY packages/shared/ packages/shared/
COPY packages/agents/ packages/agents/
COPY packages/ai/ packages/ai/

# Copy workers source
COPY workers/ workers/

# Install ALL deps including dev (tsx, typescript needed at runtime)
RUN npm install --ignore-scripts

# Generate Prisma client
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

# Default: agent-runner via tsx (no compile step — eliminates all TS build errors)
CMD ["npx", "tsx", "workers/agent-runner.ts"]
