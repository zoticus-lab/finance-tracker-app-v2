FROM node:24-alpine

WORKDIR /app/frontend

ENV NODE_ENV=development

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm install --legacy-peer-deps

# Copy frontend source code
COPY frontend/src ./src
COPY frontend/index.html ./
COPY frontend/vite.config.js ./
COPY frontend/tailwind.config.js ./
COPY frontend/postcss.config.js ./

EXPOSE 5175

# Run Vite dev server on all interfaces
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
