FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache openssl

# Root workspace files
COPY package.json package-lock.json tsconfig.json ./

# All workspace package.json stubs (needed for npm workspace resolution)
COPY apps/api/package.json apps/api/
COPY apps/portal/package.json apps/portal/
COPY apps/marketing/package.json apps/marketing/
COPY apps/admin/package.json apps/admin/

# Prisma schema (needed by root postinstall)
COPY apps/api/prisma apps/api/prisma/

# Install all workspace deps
RUN npm install

# Copy portal source
COPY apps/portal/ apps/portal/

# Build portal
RUN npm run build --workspace=@madecreative/portal

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "run", "start", "--workspace=@madecreative/portal"]
