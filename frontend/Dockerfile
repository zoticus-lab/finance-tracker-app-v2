# Frontend Dockerfile with multi-stage build
FROM node:24-alpine as builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy frontend code
COPY frontend/ ./

# Build React app
RUN npm run build

# Production stage - serve with node static server
FROM node:24-alpine

WORKDIR /app

# Install serve to run the built app
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
