FROM node:20-alpine AS base
WORKDIR /app

RUN apk add --no-cache libc6-compat

# ── Root workspace files ──────────────────────────────────────────────────────
COPY package.json package-lock.json ./
COPY tsconfig.json ./

# Copy all app package.json stubs so npm workspaces can resolve deps
COPY apps/api/package.json apps/api/
COPY apps/portal/package.json apps/portal/
COPY apps/marketing/package.json apps/marketing/
COPY apps/admin/package.json apps/admin/

# Copy workspace packages needed at build time
COPY packages/shared/ packages/shared/

# ── Install ───────────────────────────────────────────────────────────────────
RUN npm install --ignore-scripts

# ── Build shared ──────────────────────────────────────────────────────────────
RUN npm run build --workspace=packages/shared || true

# ── Copy portal source and build ─────────────────────────────────────────────
COPY apps/portal/ apps/portal/

RUN npm run build --workspace=@madecreative/portal

# ── Runtime ───────────────────────────────────────────────────────────────────
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "run", "start", "--workspace=@madecreative/portal"]
