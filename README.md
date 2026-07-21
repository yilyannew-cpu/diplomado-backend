# FFCore API

Backend REST para FFCore: autenticación JWT, panel admin de restaurante, catálogo cliente y pedidos en tiempo real (WebSocket).

**Stack:** Node.js 20 · Express · TypeScript · PostgreSQL · Prisma · Zod · Socket.IO

| Entorno | Base de datos | Cómo se corre |
|---------|---------------|---------------|
| **Local (este README)** | Postgres en **Docker** | `make fire` |
| **Producción** | Neon + Render | Ya desplegado — **no se toca desde local** |

Producción en vivo: `https://ffcore-api.onrender.com/api/v1`

---

## Importante — no mezclar entornos

- En **local** la API usa **solo** la base del contenedor Docker.
- **Neon es solo producción** (Render). No copies su `DATABASE_URL` al `.env` local.
- No hace falta configurar Neon para desarrollar en tu PC.

---

## Instalación en otro dispositivo (desde cero)

Sigue estos pasos **una sola vez** en el PC nuevo (profesor, compañero, otra máquina).

### 1) Instalar herramientas

| Herramienta | Para qué | Dónde |
|-------------|----------|--------|
| **Git** | Clonar el repo | [git-scm.com](https://git-scm.com) |
| **Docker Desktop** (Windows/Mac) **o** Docker en Ubuntu/WSL | Contenedores de BD + API | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **Make** | Comando `make fire` | Incluido en Ubuntu/WSL/Git Bash. En PowerShell puro usa `.\scripts\fire.ps1` |

Comprueba:

```bash
git --version
docker info          # Docker debe estar ENCENDIDO
```

### 2) Clonar el repositorio

```bash
git clone https://github.com/yilyannew-cpu/diplomado-backend.git
cd diplomado-backend
```

(Si usas SSH, cambia la URL por la de tu remoto.)

**Windows + Docker solo en Ubuntu/WSL:**

```bash
wsl
cd ~
git clone https://github.com/yilyannew-cpu/diplomado-backend.git
cd diplomado-backend
```

O, si el repo ya está en OneDrive/Desktop de Windows:

```bash
wsl
cd /mnt/c/Users/<TU_USUARIO>/OneDrive/Desktop/diplomado-backend
```

### 3) Levantar el proyecto local

```bash
make fire      # build + Postgres + API (primera vez tarda más)
make seed      # usuario demo
```

PowerShell (sin Make):

```powershell
cd ruta\a\diplomado-backend
.\scripts\fire.ps1
.\scripts\fire.ps1 seed
```

### 4) Comprobar

- Health: http://localhost:3000/api/v1/health
- Login: `super@ffcore.co` / `demo`

No necesitas `npm install` en el host: con `make fire` todo corre **dentro de Docker**.

### 5) Frontend en otro dispositivo (opcional)

```bash
git clone https://github.com/yilyannew-cpu/diplomado-frontend.git
cd diplomado-frontend
```

Crea/edita `.env`:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_API_PROXY_TARGET=http://localhost:3000
```

```bash
# Instalar Bun: https://bun.sh
bun install
bun run dev
```

La API del backend debe estar corriendo antes (`make fire`).

---

## Requisitos (local)

1. **Docker** funcionando (`docker info` sin error)
   - Docker Desktop en Windows, **o**
   - Docker dentro de Ubuntu / WSL
2. **Make** (en Ubuntu/WSL/Git Bash). En PowerShell sin Make usa el script de abajo.
3. Puerto **3000** (API) y **5432** (Postgres) libres

Si Docker solo está en Ubuntu, abre una terminal WSL y trabaja **ahí** (ver sección de instalación arriba).

---

## Arranque local con un solo comando (`make fire`)

Esto levanta **Postgres + API** juntos (`docker-compose.local.yml` + `Dockerfile`).

### Ubuntu / WSL / Git Bash

```bash
make fire
```

### Windows PowerShell (sin Make)

```powershell
.\scripts\fire.ps1
```

Espera a que termine el build la primera vez (puede tardar unos minutos).

### Verificar

| Qué | URL / comando |
|-----|----------------|
| Health | http://localhost:3000/api/v1/health |
| Logs API | `make logs`  ·  o  `.\scripts\fire.ps1 logs` |
| Contenedores | `make ps` |

Debes ver:

- `ffcore-local-db` → Postgres
- `ffcore-local-api` → backend

### Datos demo (primera vez)

```bash
make seed
# PowerShell: .\scripts\fire.ps1 seed
```

| Email | Password | Rol |
|-------|----------|-----|
| `super@ffcore.co` | `demo` | superadmin |

### Credenciales de la BD local (DBeaver, etc.)

| Campo | Valor |
|--------|--------|
| Host | `localhost` / `127.0.0.1` |
| Port | `5432` |
| Database | `ffcore` |
| User | `ffcore` |
| Password | `ffcore` |
| Contenedor | `ffcore-local-db` |

---

## Comandos del Makefile (día a día)

| Comando | Qué hace |
|---------|----------|
| `make fire` | Build + levantar API y Postgres |
| `make logs` | Ver logs de la API en vivo |
| `make seed` | Cargar superadmin demo |
| `make down` | Parar contenedores (conserva datos) |
| `make clean` | Parar y **borrar** el volumen de la BD local |
| `make restart` | Reiniciar solo la API |
| `make rebuild` | Rebuild de la imagen sin caché |
| `make shell` | Entrar al contenedor de la API |
| `make help` | Lista de atajos |

Equivalente PowerShell: `.\scripts\fire.ps1`, `.\scripts\fire.ps1 logs`, `.\scripts\fire.ps1 down`, etc.

---

## Frontend (otro repositorio)

Con la API ya arriba (`make fire`):

```bash
cd diplomado-frontend
# .env del front:
#   VITE_API_URL=http://localhost:3000/api/v1
#   VITE_API_PROXY_TARGET=http://localhost:3000
bun install
bun run dev
```

---

## Checklist profesor / compañero (otro PC)

- [ ] Git + Docker instalados y Docker encendido
- [ ] `git clone` del backend
- [ ] `make fire` (o `.\scripts\fire.ps1`)
- [ ] `make seed`
- [ ] Health en http://localhost:3000/api/v1/health
- [ ] Login `super@ffcore.co` / `demo`
- [ ] (Opcional) Front clonado, `.env` a localhost, `bun run dev`

---

## Problemas frecuentes (local)

### Puerto 3000 u 5432 ocupado

```bash
docker ps
docker stop ffcore-db ffcore-local-api ffcore-local-db   # los que existan
make fire
```

No corras a la vez `make fire` y `npm run dev`: pelean por el puerto 3000.

### `Docker no está disponible`

Enciende Docker Desktop, o entra a WSL/Ubuntu donde esté instalado Docker y vuelve a ejecutar `make fire`.

### Quieres empezar la BD de cero

```bash
make clean
make fire
make seed
```

---

## Postman

Importar `postman/FFCore-API.postman_collection.json` — variable `baseUrl`: `http://localhost:3000/api/v1`

---

## Estructura del repo

```
src/                 Dominio, casos de uso, HTTP
prisma/              Schema, migraciones, seed
Dockerfile           Imagen local de la API (no Render)
docker-compose.local.yml   Postgres + API locales
Makefile             make fire / logs / seed / down
scripts/fire.ps1     Equivalente en PowerShell
postman/             Colección de pruebas API
README.md            Única guía del proyecto (local)
```

> Render **no** usa este Dockerfile ni el Makefile. Producción sigue con Node + Neon en el dashboard de Render.
