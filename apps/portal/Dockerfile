FROM node:20-alpine AS base
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node_modules/.bin/next", "start", "-p", "3000"]
