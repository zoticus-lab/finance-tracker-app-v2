FROM node:24-alpine

WORKDIR /app/frontend

ENV NODE_ENV=development

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies - show full output
RUN npm install --verbose 2>&1 | tail -100

# CRITICAL: Verify recharts and other key dependencies are installed
RUN test -d node_modules/recharts || (echo "ERROR: recharts not installed!" && exit 1)
RUN test -d node_modules/react || (echo "ERROR: react not installed!" && exit 1)
RUN test -d node_modules/vite || (echo "ERROR: vite not installed!" && exit 1)

# Show what's installed
RUN echo "=== Package installation verified ===" && \
    ls -la node_modules/ | head -30 && \
    echo "=== recharts installed ===" && \
    ls -la node_modules/recharts 2>&1 | head -5

# Copy frontend source code
COPY frontend/src ./src
COPY frontend/index.html ./
COPY frontend/vite.config.js ./
COPY frontend/tailwind.config.js ./
COPY frontend/postcss.config.js ./

EXPOSE 5175

# Run Vite dev server on all interfaces
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
