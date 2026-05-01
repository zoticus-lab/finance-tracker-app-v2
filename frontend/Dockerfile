# Frontend Dockerfile - Production Ready (Multi-stage build)
FROM node:24-alpine as builder

WORKDIR /app/frontend

ENV NODE_ENV=production

# Copy ONLY frontend files (skip root package.json complexity)
COPY frontend/package*.json ./

# Install frontend dependencies ONLY
RUN npm install --prefer-offline --no-audit

# Copy frontend source code
COPY frontend/src ./src
COPY frontend/index.html ./
COPY frontend/vite.config.js ./
COPY frontend/tailwind.config.js ./
COPY frontend/postcss.config.js ./

# Build React app
RUN npm run build

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
