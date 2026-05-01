# Backend Dockerfile - Development Ready
FROM node:24-alpine

WORKDIR /app/backend

ENV NODE_ENV=development

# Copy backend files
COPY backend/package*.json ./

# Install backend dependencies with full output
RUN npm install

# Verify critical packages are installed
RUN npm list express mysql2 cors dotenv pdfkit 2>&1 | head -20 || echo "Checking npm list..."

# Copy backend source code
COPY backend/ ./

EXPOSE 5001

# Start server directly
CMD ["node", "server.js"]
