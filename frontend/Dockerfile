# Frontend Dockerfile - Production Ready (Multi-stage build)
FROM node:24-alpine as builder

WORKDIR /app

ENV NODE_ENV=production

# Copy root workspace package.json (PENTING untuk npm workspace)
COPY package*.json ./

# Copy frontend folder lengkap (includes package.json & src)
COPY frontend/ ./frontend/

# Install dependencies (akan resolve semua workspaces)
RUN npm install

# Build frontend menggunakan npm workspace command
RUN npm run build --workspace=frontend

# Production stage - serve optimized build
FROM node:24-alpine

WORKDIR /app

# Install serve globally (lightweight static server)
RUN npm install -g serve

# Copy built files dari builder (dari frontend/dist)
COPY --from=builder /app/frontend/dist ./dist

# Expose port
EXPOSE 5175

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5175/ || exit 1

# Serve the app
CMD ["serve", "-s", "dist", "-l", "5175"]
