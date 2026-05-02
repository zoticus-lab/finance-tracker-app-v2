FROM node:24-alpine

WORKDIR /app/frontend

ENV NODE_ENV=development

# Copy ONLY frontend package files (bypass root workspace config)
COPY frontend/package.json ./
COPY frontend/package-lock.json ./

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

# EXPLICIT: Force install recharts to ensure it's available
RUN npm install recharts --no-save --verbose 2>&1 | tee -a /tmp/npm-install.log

# Show installation summary
RUN echo "=== NPM Install Summary ===" && \
    tail -100 /tmp/npm-install.log

# VERIFY recharts exists - CRITICAL
RUN if [ ! -d "node_modules/recharts" ]; then \
    echo "ERROR: recharts still missing!"; \
    echo "=== Full npm install log ==="; \
    cat /tmp/npm-install.log; \
    echo "=== node_modules contents ==="; \
    ls -la node_modules/ | head -50; \
    exit 1; \
  fi && \
  echo "✓ recharts verified at $(date)"

# Verify other critical packages
RUN test -f node_modules/react/package.json && echo "✓ react ok" || exit 1
RUN test -f node_modules/vite/package.json && echo "✓ vite ok" || exit 1
RUN test -f node_modules/lucide-react/package.json && echo "✓ lucide-react ok" || exit 1

# Show final package list
RUN echo "=== Final packages ===" && npm list --depth=0

# Copy frontend source code
COPY frontend/src ./src
COPY frontend/index.html ./
COPY frontend/vite.config.js ./
COPY frontend/tailwind.config.js ./
COPY frontend/postcss.config.js ./

EXPOSE 5175

# Run Vite dev server on all interfaces
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
