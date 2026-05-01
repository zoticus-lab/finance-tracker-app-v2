# Frontend Dockerfile - Production Ready (Multi-stage build)
FROM node:24-alpine as builder

WORKDIR /app

ENV NODE_ENV=production

# Pastikan file package.json dari root dan folder frontend terbawa
COPY package*.json ./
COPY frontend/package*.json ./

# Install dependencies (lebih fleksibel terhadap perbedaan versi)
RUN npm install

# Copy frontend code
COPY frontend/ ./

# Build React app
RUN npm run build

# Production stage - serve optimized build
FROM node:24-alpine

WORKDIR /app

# Install serve globally (lightweight static server)
RUN npm install -g serve

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 5175

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5175/ || exit 1

# Serve the app
CMD ["serve", "-s", "dist", "-l", "5175"]
