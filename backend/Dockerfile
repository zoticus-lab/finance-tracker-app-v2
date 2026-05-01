# Backend Dockerfile - Production Ready
FROM node:24-alpine

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy root workspace package.json (PENTING untuk npm workspace)
COPY package*.json ./

# Copy backend folder lengkap (includes package.json)
COPY backend/ ./backend/

# Install root dependencies
RUN npm install 2>&1

# Install backend dependencies separately
WORKDIR /app/backend
RUN npm install 2>&1

# Back to app root
WORKDIR /app

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5001/api/dashboard', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Start server dari backend folder
CMD ["node", "backend/server.js"]
