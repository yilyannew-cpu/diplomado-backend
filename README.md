# FFCore API

Backend REST para FFCore: auth JWT, panel admin restaurante, catálogo cliente, pedidos en tiempo real (WebSocket).

**Stack:** Node.js 20 · Express · TypeScript · PostgreSQL · Prisma · Zod · Socket.IO

**Producción:** `https://ffcore-api.onrender.com/api/v1`

---

## Local vs producción

| Entorno | Base de datos |
|---------|----------------|
| **Local** | Postgres en **Docker** (`ffcore-db`) |
| **Producción (Render)** | **Neon** (solo en el dashboard) |

Guía completa (errores, Windows, WSL, sin Docker): **[docs/DEPLOY-LOCAL.md](docs/DEPLOY-LOCAL.md)**  
Producción: **[docs/DEPLOY-RENDER.md](docs/DEPLOY-RENDER.md)**

### Arranque local (1 comando + API)

```bash
npm run local      # Docker Postgres + .env + migraciones + seed
npm run dev        # http://localhost:3000
```

O todo junto:

```bash
npm run local:dev
```

Login demo: `super@ffcore.co` / `demo`

Frontend (otro repo, con Bun):

```bash
cd diplomado-frontend
bun run dev
```

> Requiere Docker (Desktop en Windows **o** Docker en Ubuntu/WSL).  
> Si Docker solo está en Ubuntu: corre los comandos del backend **dentro de WSL**.

---

## Documentación

| Documento | Para quién |
|-----------|------------|
| [Despliegue LOCAL](docs/DEPLOY-LOCAL.md) | Profesor / equipo — correr el backend en PC |
| [API Panel Admin](docs/API-PANEL-ADMIN-RESTAURANTE.md) | Frontend `/admin` |
| [API Cliente](docs/API-CLIENTE-FLUJO-MINIMO.md) | Frontend cliente |
| [Deploy Render + Neon](docs/DEPLOY-RENDER.md) | Producción |

---

## Scripts útiles

| Comando | Descripción |
|---------|-------------|
| `npm run local` | **BD Docker + setup** (recomendado) |
| `npm run local:dev` | local + arranca la API |
| `npm run dev` | Solo API (BD ya levantada) |
| `npm run db:up` / `db:down` | Solo Postgres |
| `npm run setup` | install + migrate + seed |
| `make fire` | Opcional: API+BD todo en Docker |

---

## Postman

Importar `postman/FFCore-API.postman_collection.json` — `baseUrl`: `http://localhost:3000/api/v1`

---

## Estructura

```
src/
  domain/          Entidades y reglas
  application/     Casos de uso y puertos
  infrastructure/  Prisma, repos, servicios
  adapters/http/   Express, rutas, controllers
prisma/            Schema, migraciones, seed
scripts/           local.cjs, setup, migrate-deploy (Render)
docs/              Guías local y producción
```
