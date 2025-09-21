# Multi-stage Dockerfile for Next.js 14 App Router

# 1) Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
# If you later add a lockfile, prefer `npm ci`
RUN npm install --legacy-peer-deps

# 2) Build
FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 3) Run
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy the minimal runtime artifacts
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "run", "start"]
