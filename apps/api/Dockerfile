FROM node:20-alpine AS base
WORKDIR /app

RUN apk add --no-cache openssl

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

# Copy API source
COPY apps/api/src apps/api/src/
COPY apps/api/tsconfig.json apps/api/

# Install all deps (ignore postinstall — we run prisma generate manually)
RUN npm install --ignore-scripts

# Generate Prisma client for linux-musl (Alpine)
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

# Build shared packages
RUN npm run build --workspace=packages/db || true
RUN npm run build --workspace=packages/shared || true
RUN npm run build --workspace=packages/ai || true

# Build API
RUN npm run build --workspace=@madecreative/api

EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]
