# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env vars (NEXT_PUBLIC_* are baked into the JS bundle and
# into next.config.ts rewrite destinations)
ARG NEXT_PUBLIC_S3_BASE_URL
ARG NEXT_PUBLIC_S3_BUCKET_NAME
ARG NEXT_PUBLIC_REPORT_VIEWER_URL
ARG NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_S3_BASE_URL=$NEXT_PUBLIC_S3_BASE_URL
ENV NEXT_PUBLIC_S3_BUCKET_NAME=$NEXT_PUBLIC_S3_BUCKET_NAME
ENV NEXT_PUBLIC_REPORT_VIEWER_URL=$NEXT_PUBLIC_REPORT_VIEWER_URL
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL

RUN npm run build

# Stage 3: Production runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3004
ENV PORT=3004

CMD ["node", "server.js"]
