# MadeCreative Editor — built from bolt.diy
FROM node:22-bookworm-slim AS build
WORKDIR /app

ENV HUSKY=0
ENV CI=true

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile

COPY . .
RUN NODE_OPTIONS=--max-old-space-size=4096 pnpm run build

# Prune dev deps (disable husky prepare script)
RUN npm pkg delete scripts.prepare && pnpm prune --prod --ignore-scripts

# Production
FROM node:22-bookworm-slim
WORKDIR /app

COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY server.mjs ./

ENV PORT=5173
ENV NODE_ENV=production
EXPOSE 5173

CMD ["node", "server.mjs"]
