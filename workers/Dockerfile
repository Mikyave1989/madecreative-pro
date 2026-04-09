FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache python3 make g++ openssl

# Copy root workspace files
COPY package.json package-lock.json ./
COPY tsconfig.json ./

# Copy app package.json stubs for npm workspaces resolution
COPY apps/api/package.json apps/api/
COPY apps/portal/package.json apps/portal/
COPY apps/marketing/package.json apps/marketing/
COPY apps/admin/package.json apps/admin/

# Copy Prisma schema
COPY apps/api/prisma apps/api/prisma/

# Copy workspace packages
COPY packages/db/ packages/db/
COPY packages/shared/ packages/shared/
COPY packages/agents/ packages/agents/
COPY packages/ai/ packages/ai/

# Copy API source (needed by @madecreative/api service on Railway)
COPY apps/api/src apps/api/src/
COPY apps/api/tsconfig.json apps/api/

# Copy workers source (for worker services)
COPY workers/ workers/

# Install all deps — ignore postinstall (prisma generate runs below)
RUN npm install --ignore-scripts

# Generate Prisma client for linux-musl (Alpine)
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

# Build shared packages in dependency order
RUN npm run build --workspace=packages/db || true
RUN npm run build --workspace=packages/shared || true
RUN npm run build --workspace=packages/ai || true
RUN npm run build --workspace=packages/agents || true

# Build API (for the @madecreative/api Railway service)
RUN npm run build --workspace=@madecreative/api

# Build workers (TypeScript → JavaScript)
RUN npx tsc --project workers/tsconfig.json

EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]
