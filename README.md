# FFCore API

Backend REST (Node.js 20 · Express · TypeScript · PostgreSQL · Prisma).

## Despliegue en servidor (universidad / infraestructura)

Usar el `Dockerfile` raíz (producción). No usar `Dockerfile.dev` ni `make fire`.

### Arranque (recomendado)

**Usar siempre** el compose de ejemplo. No usar `docker run`.

```bash
docker compose -f docker-compose.prod.example.yml up -d --build
```

Ese archivo (`docker-compose.prod.example.yml`) ya incluye:

- Build con el `Dockerfile` de producción
- Variables de entorno
- Puerto
- Healthcheck
- Volumen persistente `ffcore_uploads:/app/uploads` (imágenes subidas)

**Por qué no usar `docker run`:** hay que recordar a mano el volumen, el healthcheck, el reinicio y las variables; es fácil omitir `/app/uploads` y perder imágenes en cada redeploy. El compose deja todo definido en un solo archivo.

### Variables de entorno

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `DATABASE_URL` | Sí | Conexión PostgreSQL |
| `DIRECT_URL` | Sí | Igual a `DATABASE_URL` si no hay pooler |
| `JWT_SECRET` | Sí | Secreto para firmar tokens |
| `CORS_ORIGIN` | Sí | URL(s) del frontend, separadas por coma |
| `NODE_ENV` | Sí | `production` |
| `PORT` | No | Por defecto `3000` |
| `JWT_EXPIRES_IN` | No | Por defecto `15m` |

### Al iniciar el contenedor

1. Aplica migraciones Prisma
2. Siembra catálogos (comunas, vehículos, categorías de menú)
3. Arranca la API en `0.0.0.0:3000`

### Verificación

- Health: `GET /api/v1/health`
