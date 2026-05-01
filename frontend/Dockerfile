FROM node:24-alpine

WORKDIR /app/frontend

ENV NODE_ENV=development

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies with error output
RUN npm install

# Verify critical packages are installed
RUN npm list react react-dom recharts vite lucide-react 2>&1 | head -20 || echo "Checking npm list..."

# Copy frontend source code
COPY frontend/src ./src
COPY frontend/index.html ./
COPY frontend/vite.config.js ./
COPY frontend/tailwind.config.js ./
COPY frontend/postcss.config.js ./

EXPOSE 5175

# Run Vite dev server on all interfaces
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
