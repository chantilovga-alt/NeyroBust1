# Multi-stage Docker build for 24/7 Railway & Cloud deployment
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies for compilation
RUN npm install

# Copy application sources
COPY . .

# Compile client (Vite) and server (esbuild)
RUN npm run build

# Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy manifests and install production-only dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy built bundles
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server

EXPOSE 3000

# Start server
CMD ["node", "dist-server/server.js"]
