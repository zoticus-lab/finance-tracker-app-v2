# Backend Dockerfile - Development Ready
FROM node:24-alpine

WORKDIR /app/backend

ENV NODE_ENV=development

# Copy backend files
COPY backend/package*.json ./

# Install backend dependencies - show full output
RUN npm install --verbose 2>&1 | tail -100

# CRITICAL: Verify all key dependencies are installed
RUN test -d node_modules/express || (echo "ERROR: express not installed!" && exit 1)
RUN test -d node_modules/mysql2 || (echo "ERROR: mysql2 not installed!" && exit 1)
RUN test -d node_modules/cors || (echo "ERROR: cors not installed!" && exit 1)

# Show what's installed
RUN echo "=== Backend package installation verified ===" && \
    npm list --depth=0

# Copy backend source code
COPY backend/ ./

EXPOSE 5001

# Start server directly
CMD ["node", "server.js"]
