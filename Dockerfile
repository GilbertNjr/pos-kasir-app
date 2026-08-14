# Multi-Stage Dockerfile untuk Sistem POS Usaha Campuran

# Stage 1: Build Server (Backend)
FROM node:20-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./
RUN npm run build

# Stage 2: Build Client (Frontend)
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 3: Runner Production Image
FROM node:20-alpine AS runner
WORKDIR /app

# Copy compiled backend
COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=server-builder /app/server/node_modules ./server/node_modules
COPY --from=server-builder /app/server/package.json ./server/package.json

# Copy compiled frontend static files to server static serving path
COPY --from=client-builder /app/client/dist ./client/dist

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "server/dist/app.js"]
