# Despliegue LOCAL — FFCore API (backend)

Guía paso a paso para correr este repositorio **en tu máquina**, con Postgres local.
**No usa Neon.** Neon solo se configura en Render (producción).

---

## Separación de entornos (importante)

| Entorno | Dónde corre la API | Base de datos |
|---------|-------------------|---------------|
| **Local** | Tu PC (`npm run dev`) | Postgres en **Docker** (`127.0.0.1:5432`) |
| **Producción** | Render | **Neon** (variables del dashboard) |

- El archivo `.env` es **solo local** y está en `.gitignore` (no se sube a Git).
- **Nunca** copies la connection string de Neon a tu `.env`.
- Si el setup detecta Neon en `.env`, lo reemplaza por `.env.example` (local).

---

## Requisitos

1. **Node.js 20+** → [nodejs.org](https://nodejs.org)
2. **Docker** (una de estas opciones):
   - [Docker Desktop](https://www.docker.com/products/docker-desktop/) en Windows, **o**
   - Docker dentro de **Ubuntu / WSL**
3. Git y este repositorio clonado

Comprueba:

```bash
node -v          # v20.x o superior
docker info      # debe responder sin error
```

> Si `docker info` falla en PowerShell pero Docker está en Ubuntu: abre una terminal WSL (`wsl`) y trabaja **desde ahí**.

---

## Arranque en 1 comando (recomendado)

En la carpeta del backend:

```bash
npm run local
```

Ese comando hace automáticamente:

1. Verifica Docker  
2. Crea/corrige `.env` hacia Postgres local (`ffcore` / `ffcore` / puerto `5432`)  
3. Levanta el contenedor `ffcore-db` (`docker-compose.yml`)  
4. Espera a que Postgres esté listo  
5. `npm install` + migraciones Prisma + seed  

Luego arranca la API:

```bash
npm run dev
```

O todo junto (BD + API):

```bash
npm run local:dev
```

### Credenciales demo (seed)

| Email | Password | Rol |
|-------|----------|-----|
| `super@ffcore.co` | `demo` | superadmin |

Health check: [http://localhost:3000/api/v1/health](http://localhost:3000/api/v1/health)

---

## Según tu sistema

### A) Docker Desktop en Windows (PowerShell)

```powershell
cd ruta\a\diplomado-backend
npm run local
npm run dev
```

### B) Docker en Ubuntu / WSL

```bash
cd /mnt/c/Users/<TU_USUARIO>/OneDrive/Desktop/diplomado-backend
# o la ruta donde clonaste el repo

npm run local
npm run dev
```

### C) Sin Docker (Postgres instalado a mano)

1. Instala PostgreSQL.  
2. Crea usuario y base `ffcore` (o ajusta credenciales).  
3. Copia `.env.example` → `.env` y edita `DATABASE_URL` / `DIRECT_URL`.  
4. Ejecuta:

```bash
npm run setup
npm run dev
```

---

## Comandos útiles

| Comando | Qué hace |
|---------|----------|
| `npm run local` | BD Docker + setup completo |
| `npm run local:dev` | Igual + arranca la API |
| `npm run db:up` | Solo levantar Postgres |
| `npm run db:down` | Parar Postgres (conserva datos) |
| `npm run setup` | install + migrate + seed (BD ya debe estar up) |
| `npm run dev` | API en modo desarrollo |
| `npx prisma db seed` | Reset de datos demo (borra y deja solo superadmin) |
| `npx prisma studio` | Ver tablas en el navegador |

### Stack opcional: API también en Docker

```bash
make fire
# o en PowerShell:
.\scripts\fire.ps1
```

Usa `docker-compose.local.yml` + `Dockerfile`. **No** lo mezcles con `npm run dev` (ambos pelean por el puerto 3000).

---

## Datos de la BD local (Docker)

Definidos en `docker-compose.yml`:

| Campo | Valor |
|-------|--------|
| Host | `127.0.0.1` |
| Puerto | `5432` |
| Usuario | `ffcore` |
| Password | `ffcore` |
| Database | `ffcore` |
| Contenedor | `ffcore-db` |

`.env` esperado:

```env
DATABASE_URL=postgresql://ffcore:ffcore@127.0.0.1:5432/ffcore?sslmode=disable
DIRECT_URL=postgresql://ffcore:ffcore@127.0.0.1:5432/ffcore?sslmode=disable
```

---

## Errores frecuentes y solución

### `EADDRINUSE: port 3000`

Otro proceso (otra API o contenedor `ffcore-local-api`) ya usa el 3000.

```bash
docker stop ffcore-local-api
# o
docker compose -f docker-compose.local.yml down
```

Luego `npm run dev` de nuevo.

### `Docker no está disponible`

- Enciende Docker Desktop, o  
- Entra a WSL/Ubuntu donde sí tienes Docker y corre `npm run local` ahí.

### Migraciones fallan / no conecta a la BD

```bash
docker ps                    # debe verse ffcore-db
docker logs ffcore-db
npm run db:up
npm run local
```

### El frontend muestra usuarios de Neon / producción

El backend local solo tiene el seed (p. ej. `super@ffcore.co`).  
Si ves muchos usuarios “reales”, el **frontend** sigue apuntando a Render.

En el repo del **frontend** (`diplomado-frontend`):

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_API_PROXY_TARGET=http://localhost:3000
```

Reinicia el front (`Ctrl+C` → `bun run dev`), cierra sesión y borra `ffcore_token` del localStorage.

### `.env` con Neon

`npm run local` lo detecta y lo reemplaza por `.env.example`.  
Neon **solo** debe estar en el dashboard de Render.

### Puerto 5432 ocupado

Otro Postgres ya usa 5432. Para el contenedor:

```bash
docker ps -a
docker stop <otro-postgres>
npm run db:up
```

O cambia el mapeo en `docker-compose.yml` (ej. `"5433:5432"`) y actualiza el `.env`.

---

## Frontend en local (acompañar al backend)

El front de este proyecto se levanta con **Bun** (no `npm run dev` del front):

```bash
cd diplomado-frontend
cp .env.example .env   # VITE_API_URL=http://localhost:3000/api/v1
bun install
bun run dev
```

Requisitos: [Bun](https://bun.sh) instalado. La API del backend debe estar en `:3000` (`npm run local` + `npm run dev` en este repo).

---

## Checklist para el profesor / compañero

- [ ] Node 20+ instalado  
- [ ] Docker funcionando (`docker info`)  
- [ ] `npm run local` OK  
- [ ] `npm run dev` → health en `:3000`  
- [ ] Login `super@ffcore.co` / `demo`  
- [ ] Frontend: `VITE_API_URL=http://localhost:3000/api/v1` y `bun run dev`  

---

## Producción (referencia)

No se despliega con este flujo. Ver [DEPLOY-RENDER.md](./DEPLOY-RENDER.md)  
(`build:render`, Neon, variables en Render).
