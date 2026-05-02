# Backend Dockerfile - Development Ready
FROM node:24-alpine

WORKDIR /app/backend

ENV NODE_ENV=development

# Copy ONLY backend package files (bypass root workspace config)
COPY backend/package.json ./
COPY backend/package-lock.json ./

# Clear npm cache and set longer timeouts
RUN npm cache clean --force && \
    npm config set fetch-timeout 120000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

# Install dependencies WITHOUT workspace (force local install only)
RUN npm install \
    --no-audit \
    --no-fund \
    --no-optional \
    --production=false \
    --prefer-offline \
    --verbose 2>&1 | tee /tmp/npm-install.log

# Show installation summary
RUN echo "=== NPM Install Summary ===" && \
    tail -100 /tmp/npm-install.log

# VERIFY critical packages exist
RUN if [ ! -f "node_modules/express/package.json" ]; then \
    echo "ERROR: express missing!"; \
    cat /tmp/npm-install.log; \
    exit 1; \
  fi && echo "✓ express verified"

RUN test -f node_modules/mysql2/package.json && echo "✓ mysql2 ok" || exit 1
RUN test -f node_modules/cors/package.json && echo "✓ cors ok" || exit 1

# Show final package list
RUN echo "=== Final packages ===" && npm list --depth=0

# Copy backend source code
COPY backend/ ./

EXPOSE 5001

# Start server directly
CMD ["node", "server.js"]
