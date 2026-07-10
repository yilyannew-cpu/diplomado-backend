# FFCore API

Backend REST para FFCore: auth JWT, panel admin restaurante, catálogo cliente, pedidos en tiempo real (WebSocket).

**Stack:** Node.js 20 · Express · TypeScript · PostgreSQL · Prisma · Zod · Socket.IO

**Producción:** `https://ffcore-api.onrender.com/api/v1`

---

## Inicio rápido

```bash
cp .env.example .env   # ajustar DATABASE_URL
npm install
npm run setup          # migraciones + seed
npm run dev            # http://localhost:3000
```

Seed actual: solo **superadmin** (`super@ffcore.co` / `demo`). El resto del flujo se crea vía API.

---

## Documentación

| Documento | Para quién |
|-----------|------------|
| [API Panel Admin](docs/API-PANEL-ADMIN-RESTAURANTE.md) | Frontend `/admin` — Kanban, menú, promos, analytics |
| [API Cliente](docs/API-CLIENTE-FLUJO-MINIMO.md) | Frontend cliente — catálogo, pedidos, tracking |
| [Deploy Render + Neon](docs/DEPLOY-RENDER.md) | Despliegue en producción |

---

## Scripts útiles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor desarrollo |
| `npm run build` | Compilar TypeScript |
| `npm start` | Producción (migraciones + servidor) |
| `npx prisma db seed` | Reset BD → solo superadmin |
| `npm run setup:docker` | Postgres en Docker + setup |

---

## Postman

Importar `postman/FFCore-API.postman_collection.json` — variable `baseUrl`: `http://localhost:3000/api/v1`

---

## Estructura

```
src/
  domain/          Entidades y reglas
  application/     Casos de uso y puertos
  infrastructure/  Prisma, repos, servicios
  adapters/http/   Express, rutas, controllers
prisma/            Schema, migraciones, seed
scripts/           Setup local y migrate-deploy (Render)
```
