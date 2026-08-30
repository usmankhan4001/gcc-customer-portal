# syntax=docker/dockerfile:1

# ─── deps: install dependencies only (cached separately from source changes) ──
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* .npmrc* ./
RUN npm ci

# ─── builder: build the Next.js app ────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env vars Next.js needs to inline into the client bundle
# (NEXT_PUBLIC_*). Actual runtime secrets are injected by Dokploy at
# container start via the standard env vars below, not at build time.
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_POSTHOG_KEY
ARG NEXT_PUBLIC_POSTHOG_HOST
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY
ENV NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY

# A syntactically valid but unusable DATABASE_URL, so any top-level module
# code that constructs a DB client at import time doesn't crash the build's
# static analysis pass — no route actually connects during `next build`.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ─── runner: minimal production image ──────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# The standalone output's node_modules is pruned to only what the app
# itself imports at runtime, which excludes drizzle-kit (a CLI tool, never
# imported by app code). Layer the full deps install on top so the
# migration step below has it — Docker COPY merges into an existing
# directory rather than replacing it, so this only adds what's missing.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY docker-entrypoint.sh ./docker-entrypoint.sh

USER nextjs
EXPOSE 3005
ENV PORT=3005
ENV HOSTNAME=0.0.0.0

CMD ["sh", "docker-entrypoint.sh"]
