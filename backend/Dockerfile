# Backend Dockerfile - Production Ready
FROM node:24-alpine

WORKDIR /app/backend

ENV NODE_ENV=production

# Copy ONLY backend files (skip root package.json complexity)
COPY backend/package*.json ./

# Verify what we copied
RUN echo "=== Backend package.json ===" && cat package.json && echo ""

# Install backend dependencies using npm ci
RUN echo "=== Installing npm packages ===" && npm ci --verbose 2>&1 | tail -50 && \
    echo "=== Verify installation ===" && npm list --depth=0

# Copy backend source code
COPY backend/ ./

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5001/api/dashboard', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Start server
CMD ["node", "server.js"]
