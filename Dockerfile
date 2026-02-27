# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

# NEXT_PUBLIC_ vars are inlined at build time — override via --build-arg
# For production, set this to your server's public address, e.g.:
#   docker build --build-arg NEXT_PUBLIC_POCKETBASE_URL=http://my-server:8090 .
ARG NEXT_PUBLIC_POCKETBASE_URL=http://localhost:8090
ENV NEXT_PUBLIC_POCKETBASE_URL=$NEXT_PUBLIC_POCKETBASE_URL

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM node:22-alpine

WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3030

ENV NODE_ENV=production PORT=3030 HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
