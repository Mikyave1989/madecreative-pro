# MadeCreative Editor — built from bolt.diy
FROM node:22-bookworm-slim AS build
WORKDIR /app

ENV HUSKY=0
ENV CI=true

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
RUN apt-get update && apt-get install -y --no-install-recommends git curl && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile

COPY . .
RUN NODE_OPTIONS=--max-old-space-size=4096 pnpm run build
RUN npm pkg delete scripts.prepare && pnpm prune --prod --ignore-scripts

# Production
FROM node:22-bookworm-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/bindings.sh ./
RUN chmod +x bindings.sh

RUN mkdir -p /root/.config/.wrangler && echo '{"enabled":false}' > /root/.config/.wrangler/metrics.json

ENV PORT=5173
ENV NODE_ENV=production
ENV RUNNING_IN_DOCKER=true
ENV WRANGLER_SEND_METRICS=false
EXPOSE 5173

CMD ["pnpm", "run", "dockerstart"]
