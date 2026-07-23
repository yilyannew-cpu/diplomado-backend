# =============================================================================
# FFCore API — imagen de PRODUCCIÓN (servidor universidad / infraestructura)
# Build:  docker build -t ffcore-api .
# Run:    ver docker-compose.prod.example.yml
# =============================================================================
FROM node:20-bookworm-slim AS base

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Dependencias (incluye dev para compilar TypeScript) ──────────────────────
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ── Build ────────────────────────────────────────────────────────────────────
FROM deps AS build
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src
RUN npx tsc

# ── Runtime producción ───────────────────────────────────────────────────────
FROM base AS production

ENV NODE_ENV=production
ENV PORT=3000

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY prisma ./prisma
COPY scripts/ensure-catalogs.cjs ./scripts/ensure-catalogs.cjs
COPY scripts/ensure-superadmin.cjs ./scripts/ensure-superadmin.cjs
RUN npx prisma generate \
  && mkdir -p uploads \
  && chown -R node:node /app

COPY --from=build --chown=node:node /app/dist ./dist

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Migraciones + catálogos (idempotente) + API compilada
CMD ["sh", "-c", "npx prisma migrate deploy && node scripts/ensure-catalogs.cjs && node dist/server.js"]
