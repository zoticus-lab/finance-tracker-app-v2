# Backend Dockerfile - Development Ready
FROM node:24-alpine

WORKDIR /app/backend

ENV NODE_ENV=development

# Copy backend files
COPY backend/package*.json ./

# Install backend dependencies
RUN npm install --legacy-peer-deps

# Copy backend source code
COPY backend/ ./

EXPOSE 5001

# Start server directly
CMD ["node", "server.js"]
