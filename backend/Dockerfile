# Backend Dockerfile - Production Ready
FROM node:24-alpine

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Pastikan file package.json dari root dan folder backend terbawa
COPY package*.json ./
COPY backend/package*.json ./

# Install dependencies (lebih fleksibel terhadap perbedaan versi)
RUN npm install

# Copy backend code
COPY backend/ ./

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5001/api/dashboard', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Start server
CMD ["node", "server.js"]
