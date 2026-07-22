# =============================================================================
# FFCore API — solo desarrollo local (Docker)
# No se usa en Render. Producción sigue con build:render / start en Node nativo.
# =============================================================================
FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

EXPOSE 3000

# generate en cada arranque: el volumen api_node_modules puede quedar
# desfasado del schema montado (p. ej. CourierApplication → findMany undefined).
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm run dev"]
