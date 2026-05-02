FROM node:24-alpine

WORKDIR /app/frontend

ENV NODE_ENV=development

# Copy frontend package files
COPY frontend/package*.json ./

# Clear npm cache and increase timeouts
RUN npm cache clean --force && \
    npm config set fetch-timeout 120000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

# Install frontend dependencies with explicit flags
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
RUN echo "=== Checking recharts ===" && \
    ls -lh node_modules/recharts/package.json 2>&1 || (echo "FAIL: recharts missing" && cat /tmp/npm-install.log && exit 1)

RUN echo "=== Checking react ===" && \
    ls -lh node_modules/react/package.json 2>&1 || (echo "FAIL: react missing" && exit 1)

RUN echo "=== Checking vite ===" && \
    ls -lh node_modules/vite/package.json 2>&1 || (echo "FAIL: vite missing" && exit 1)

# List key packages
RUN echo "=== Installed packages ===" && npm list --depth=0

# Copy frontend source code
COPY frontend/src ./src
COPY frontend/index.html ./
COPY frontend/vite.config.js ./
COPY frontend/tailwind.config.js ./
COPY frontend/postcss.config.js ./

EXPOSE 5175

# Run Vite dev server on all interfaces
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
