FROM node:20-bullseye-slim
WORKDIR /app

# System deps for Playwright
RUN apt-get update && apt-get install -y \
  python3 make g++ openssl \
  wget gnupg git \
  --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Install Claude Code CLI + Playwright MCP + Vercel CLI
RUN npm install -g @anthropic-ai/claude-code @anthropic-ai/claude-code-playwright vercel

# Configure Claude CLI with Playwright MCP server
RUN mkdir -p /root/.claude && echo '{ \
  "mcpServers": { \
    "playwright": { \
      "type": "stdio", \
      "command": "npx", \
      "args": ["@anthropic-ai/claude-code-playwright"] \
    } \
  } \
}' > /root/.claude.json

# Clone JCodesMore ai-website-cloner-template (disable SSL verify for Railway build env)
RUN git config --global http.sslVerify false && \
  git clone https://github.com/JCodesMore/ai-website-cloner-template.git /app/cloner && \
  cd /app/cloner && npm install --ignore-scripts

# Inject MadeCreative rules into the cloner (prepended to SKILL.md and CLAUDE.md)
COPY workers/madecreative-cloner-rules.md /tmp/mc-rules.md
RUN RULES=$(cat /tmp/mc-rules.md) && \
  SKILL=/app/cloner/.claude/skills/clone-website/SKILL.md && \
  head -6 "$SKILL" > /tmp/skill-header.md && \
  tail -n +7 "$SKILL" > /tmp/skill-body.md && \
  cat /tmp/skill-header.md /tmp/mc-rules.md /tmp/skill-body.md > "$SKILL" && \
  cat /tmp/mc-rules.md >> /app/cloner/CLAUDE.md

# Copy root workspace files
COPY package.json package-lock.json ./
COPY tsconfig.json ./

# Patch workspaces — only what the worker needs
RUN node -e " \
  const p = JSON.parse(require('fs').readFileSync('package.json','utf8')); \
  p.workspaces = ['apps/api','packages/*','workers']; \
  require('fs').writeFileSync('package.json', JSON.stringify(p, null, 2));"

COPY apps/api/package.json apps/api/
COPY apps/api/prisma apps/api/prisma/
COPY apps/api/src apps/api/src/
COPY apps/api/tsconfig.json apps/api/

COPY packages/db/ packages/db/
COPY packages/shared/ packages/shared/
COPY packages/ai/ packages/ai/
COPY packages/agents/ packages/agents/

COPY workers/ workers/

# Install deps (no postinstall scripts — Playwright installed separately)
RUN npm install --ignore-scripts

# Install Playwright Chromium browser
RUN npx playwright install --with-deps chromium

# Generate Prisma client
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

# Build only what the worker needs
RUN npm run build --workspace=packages/db || true
RUN npm run build --workspace=packages/shared || true
RUN npm run build --workspace=packages/ai || true
RUN npm run build --workspace=packages/agents || true
RUN npx tsc --project workers/tsconfig.json

CMD node workers/dist/agent-runner.js
