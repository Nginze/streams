# # WebRTC Server Dockerfile
# FROM node:18-alpine AS base

# # Install dependencies only when needed
# FROM base AS deps
# RUN apk add --no-cache libc6-compat python3 make g++ py3-pip meson ninja
# WORKDIR /app

# # Install dependencies
# COPY package.json pnpm-lock.yaml* ./
# # Enable pnpm and install dependencies
# RUN corepack enable pnpm && \
#     pnpm i --frozen-lockfile && \
#     cd node_modules/.pnpm/mediasoup@*/node_modules/mediasoup && \
#     node npm-scripts.mjs postinstall

# # Build the application
# FROM base AS builder
# WORKDIR /app
# COPY --from=deps /app/node_modules ./node_modules
# COPY . .

# RUN npm run tsc

# # Production image
# FROM base AS runner
# WORKDIR /app

# ENV NODE_ENV=production

# # Install python and build tools needed for mediasoup
# RUN apk add --no-cache python3 make g++

# RUN addgroup --system --gid 1001 nodejs
# RUN adduser --system --uid 1001 streams

# COPY --from=builder /app/dist ./dist
# COPY --from=builder /app/node_modules ./node_modules
# COPY --from=builder /app/package.json ./package.json

# USER streams

# EXPOSE 4000
# EXPOSE 10000-10100/udp
# EXPOSE 10000-10100/tcp

# ENV PORT=4000

# CMD ["node", "dist/index.js"]

# WebRTC Server Dockerfile
FROM node:18-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++ py3-pip meson ninja
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run tsc

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache python3 make g++

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 streams

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER streams

EXPOSE 4000
EXPOSE 10000-10100/udp
EXPOSE 10000-10100/tcp

CMD ["node", "dist/index.js"]

