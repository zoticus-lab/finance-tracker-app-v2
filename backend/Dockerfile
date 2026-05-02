# Backend Dockerfile - Development Ready
FROM node:24-alpine

WORKDIR /app/backend

ENV NODE_ENV=development

# Copy backend files
COPY backend/package*.json ./

# Clear npm cache and set longer timeouts
RUN npm cache clean --force && \
    npm config set fetch-timeout 120000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

# Install backend dependencies with explicit flags
RUN npm install \
    --no-audit \
    --no-fund \
    --production=false \
    --prefer-offline \
    --verbose 2>&1 | tee /tmp/npm-install.log

# Show installation summary
RUN echo "=== NPM Install Complete ===" && \
    tail -50 /tmp/npm-install.log

# VERIFY critical packages exist
RUN echo "=== Checking express ===" && \
    ls -lh node_modules/express/package.json 2>&1 || (echo "FAIL: express missing" && cat /tmp/npm-install.log && exit 1)

RUN echo "=== Checking mysql2 ===" && \
    ls -lh node_modules/mysql2/package.json 2>&1 || (echo "FAIL: mysql2 missing" && exit 1)

RUN echo "=== Checking cors ===" && \
    ls -lh node_modules/cors/package.json 2>&1 || (echo "FAIL: cors missing" && exit 1)

# List all packages
RUN echo "=== Installed packages ===" && npm list --depth=0

# Copy backend source code
COPY backend/ ./

EXPOSE 5001

# Start server directly
CMD ["node", "server.js"]
