# Frontend Dockerfile - Production Ready (Multi-stage build)
FROM node:24-alpine as builder

WORKDIR /app

ENV NODE_ENV=production

# Copy root dan frontend package.json
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install root dependencies
RUN npm install 2>&1

# Install frontend dependencies separately
WORKDIR /app/frontend
RUN npm install 2>&1

# Build frontend
RUN npm run build

# Production stage - serve optimized build
FROM node:24-alpine

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built dist folder dari builder
COPY --from=builder /app/frontend/dist ./dist

# Expose port
EXPOSE 5175

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5175/ || exit 1

# Serve the app
CMD ["serve", "-s", "dist", "-l", "5175"]
