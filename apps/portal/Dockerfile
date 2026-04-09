FROM node:20-alpine AS base
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

RUN cp -r public .next/standalone/apps/portal/public 2>/dev/null || true && \
    cp -r .next/static .next/standalone/apps/portal/.next/static 2>/dev/null || true

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

CMD ["node", ".next/standalone/apps/portal/server.js"]
