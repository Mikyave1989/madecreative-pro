FROM node:22-slim
WORKDIR /app

# Only install the 3 runtime deps needed for the Express server
RUN npm install express@4 @remix-run/express@2 @remix-run/node@2 --no-optional --ignore-scripts

# Copy prebuilt Remix output + server
COPY build/ ./build/
COPY server.mjs ./

ENV PORT=5173
ENV NODE_ENV=production
EXPOSE 5173

CMD ["node", "server.mjs"]
