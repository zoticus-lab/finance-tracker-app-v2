# Frontend Dockerfile - Production Ready (Multi-stage build)
FROM node:24-alpine as builder

WORKDIR /app/frontend

ENV NODE_ENV=production

# Verify Node and npm are installed
RUN node --version && npm --version

# Copy ONLY frontend files (skip root package.json complexity)
COPY frontend/package*.json ./

# Show what we copied
RUN echo "=== package.json ===" && cat package.json && echo ""

# Install using npm ci (uses package-lock.json for reproducible builds)
RUN echo "=== Installing npm packages with npm ci ===" && npm ci --verbose 2>&1 | tail -100

# Verify installation
RUN echo "=== Checking npm list ===" && npm list --depth=0 && \
    echo "=== Checking vite ===" && npx vite --version

# Copy frontend source code
COPY frontend/src ./src
COPY frontend/index.html ./
COPY frontend/vite.config.js ./
COPY frontend/tailwind.config.js ./
COPY frontend/postcss.config.js ./

# Show working directory structure
RUN echo "=== Current directory ===" && pwd && echo "=== Files ===" && ls -la

# Build React app with Vite - show all output
RUN echo "=== Running npm run build ===" && npm run build 2>&1

# Production stage
FROM node:24-alpine

WORKDIR /app

# Install serve
RUN npm install -g serve

# Copy built dist
COPY --from=builder /app/frontend/dist ./dist

EXPOSE 5175

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5175/ || exit 1

CMD ["serve", "-s", "dist", "-l", "5175"]
