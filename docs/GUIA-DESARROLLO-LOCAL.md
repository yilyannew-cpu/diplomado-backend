# Guía — Desarrollo local (Backend + Frontend en el mismo PC)

Cómo correr **FFCore API** y el **frontend** en tu máquina para probar todo sin depender de Render/Vercel.

---

## Regla de oro

> **Backend y frontend en el mismo PC → usa `localhost` en ambos.**  
> **No mezcles WSL y Windows para `npm install` / `npm run dev`.**

| Correcto | Incorrecto |
|----------|------------|
| API en PowerShell + Front en PowerShell o navegador | API en WSL + `node_modules` instalado en Windows |
| `VITE_API_URL=http://localhost:3000/api/v1` | `VITE_API_URL=https://ffcore-api.onrender.com` (eso es producción) |
| PostgreSQL en `127.0.0.1:5433` | `DATABASE_URL` de Neon mientras pruebas local |

---

## Arquitectura local

```
┌──────────────────────┐     http://localhost:3000/api/v1     ┌─────────────────────┐
│  Frontend            │ ─────────────────────────────────────► │  Backend (Express)  │
│  localhost:8081      │ ◄───────────────────────────────────── │  localhost:3000     │
│  (Vite / React)      │              JSON + JWT                │  npm run dev        │
└──────────────────────┘                                        └──────────┬──────────┘
                                                                             │
                                                                             ▼
                                                                  ┌─────────────────────┐
                                                                  │  PostgreSQL         │
                                                                  │  127.0.0.1:5433     │
                                                                  │  base: ffcore       │
                                                                  └─────────────────────┘
```

---

## Requisitos

- **Node.js 20+** — `node -v`
- **PostgreSQL** corriendo en Windows (puerto **5433** en tu PC)
- **Git Bash** o **PowerShell**
- Repo backend: `diplomado-backend`
- Repo frontend: (tu proyecto React/Vite)

---

## Parte 1 — Backend

### 1.0 Instalación automática (recomendado)

Desde la raíz del proyecto, en **PowerShell**:

```powershell
cd C:\Users\yilgr\OneDrive\Desktop\diplomado-backend
npm run setup
```

Ese comando hace todo en orden:

1. Crea `.env` desde `.env.example` (si no existe)
2. `npm install`
3. `prisma generate`
4. `prisma migrate deploy`
5. `prisma db seed` (usuarios demo)

**Si mezclaste WSL y Windows** (errores de esbuild/Prisma):

```powershell
npm run setup:clean
```

**Si prefieres PostgreSQL con Docker** (puerto 5432, usuario `ffcore`):

```powershell
npm run setup:docker
```

Luego ajusta `.env` para Docker:

```env
DATABASE_URL=postgresql://ffcore:ffcore@127.0.0.1:5432/ffcore?sslmode=disable
```

Y vuelve a ejecutar `npm run setup` (solo migraciones/seed si ya instalaste deps).

| Script | Qué hace |
|--------|----------|
| `npm run setup` | Instalación estándar |
| `npm run setup:clean` | Borra `node_modules` y reinstala todo |
| `npm run setup:docker` | Levanta Postgres en Docker + setup |
| `npm run setup:win` | Igual que setup + avisos de Postgres en Windows |

---

### 1.1 Clonar / abrir el proyecto

```powershell
cd C:\Users\yilgr\OneDrive\Desktop\diplomado-backend
```

### 1.2 Archivo `.env`

Copia si no existe:

```powershell
copy .env.example .env
```

Contenido recomendado para **Windows + Postgres local**:

```env
DATABASE_URL=postgresql://postgres:TU_PASSWORD@127.0.0.1:5433/ffcore?sslmode=disable
JWT_SECRET=cambiar-en-produccion-min-32-chars-seguro
JWT_EXPIRES_IN=8h
CORS_ORIGIN=http://localhost:5173,http://localhost:8081
PORT=3000
NODE_ENV=development
```

| Variable | Valor local | Notas |
|----------|-------------|--------|
| `DATABASE_URL` | `127.0.0.1:5433` | Tu Postgres en Windows (no Neon) |
| `CORS_ORIGIN` | Puertos del front | Agrega el puerto que use Vite (`8081`, `5173`, etc.) |
| `PORT` | `3000` | API en `http://localhost:3000` |

### 1.3 Verificar que PostgreSQL está activo

```powershell
Get-Service postgresql-x64-17
```

Debe decir **Running**. Si no:

```powershell
Start-Service postgresql-x64-17
```

### 1.4 Crear la base de datos (solo la primera vez)

```powershell
$env:PGPASSWORD='TU_PASSWORD'
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h 127.0.0.1 -p 5433 -c "CREATE DATABASE ffcore;"
```

Si ya existe, ignora el error "already exists".

### 1.5 Instalar dependencias (manual, si no usaste `npm run setup`)

```powershell
npm run setup
```

Equivalente manual:

```powershell
npm install
npm exec prisma -- migrate deploy
npm exec prisma -- db seed
```

### 1.6 Arrancar la API

```powershell
npm run dev
```

Debes ver:

```
FFCore API escuchando en 0.0.0.0:3000
Health: /api/v1/health
```

### 1.7 Probar que funciona

Nueva ventana de PowerShell:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/health"
```

Login:

```powershell
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/v1/auth/login" `
  -ContentType "application/json" `
  -Body '{"email":"cliente@ffcore.co","password":"demo"}'
```

O en el navegador: `http://localhost:3000/api/v1/health`

---

## Parte 2 — Frontend

### 2.1 Variable de entorno

En el repo del **frontend**, archivo `.env` o `.env.local`:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

**Importante:** debe ser `localhost:3000`, **no** la URL de Render.

### 2.2 Instalar y arrancar

```powershell
cd RUTA_A_TU_FRONTEND
npm install
npm run dev
```

Vite suele usar `http://localhost:5173` o `http://localhost:8081`.

### 2.3 CORS en el backend

Si el front corre en un puerto nuevo (ej. `5174`), agrégalo en el `.env` del **backend**:

```env
CORS_ORIGIN=http://localhost:5173,http://localhost:8081,http://localhost:5174
```

Reinicia `npm run dev` del backend después de cambiar `.env`.

### 2.4 Probar login en la app

| Campo | Valor |
|-------|--------|
| Email | `cliente@ffcore.co` |
| Password | `demo` |

Otros usuarios demo: ver `README.md` o `docs/GUIA-ESTUDIO-DESPLIEGUE.md`.

---

## Parte 3 — Orden de arranque diario

Cada vez que vayas a desarrollar:

```
1. PostgreSQL corriendo (servicio Windows)
2. Terminal 1 → backend:  cd diplomado-backend  →  npm run dev
3. Terminal 2 → frontend: cd tu-frontend         →  npm run dev
4. Navegador → http://localhost:8081 (o el puerto que diga Vite)
```

---

## Parte 4 — Usuarios demo (password: `demo`)

| Email | Rol | Redirect |
|-------|-----|----------|
| `cliente@ffcore.co` | cliente | `/cliente` |
| `admin@ffcore.co` | admin | `/admin` |
| `domi@ffcore.co` | domiciliario | `/domiciliario` |
| `super@ffcore.co` | superadmin | `/superadmin` |
| `vale@ffcore.co` | cliente suspendido | error 403 |

---

## Parte 5 — Herramientas útiles

### Prisma Studio (ver BD en el navegador)

```powershell
cd diplomado-backend
npm exec prisma -- studio
```

Abre `http://localhost:5555`.

### Postman

Importa `postman/FFCore-API.postman_collection.json`

Variable:

```
baseUrl = http://localhost:3000/api/v1
```

---

## Parte 6 — Problemas frecuentes

### Error CORS en el navegador

**Síntoma:** `blocked by CORS policy` en consola.

**Solución:** Agrega el puerto exacto del front en `CORS_ORIGIN` y reinicia el backend.

---

### Login queda en "pending" o falla

| Causa | Solución |
|-------|----------|
| Backend no corriendo | `npm run dev` en PowerShell |
| `VITE_API_URL` apunta a Render | Cambiar a `http://localhost:3000/api/v1` |
| Puerto API ocupado | Cambiar `PORT=3001` en `.env` y actualizar `VITE_API_URL` |

---

### `tsx` o `npx` no reconocido

**PowerShell:**

```powershell
npm exec prisma -- migrate deploy
```

O habilitar scripts (una vez):

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

---

### Error esbuild / Prisma `EPERM` o plataforma incorrecta

Mezclaste `node_modules` de WSL y Windows.

```powershell
Remove-Item -Recurse -Force node_modules
npm install
npm exec prisma -- generate
```

---

### `Can't reach database server at 127.0.0.1:5433`

1. `Get-Service postgresql-x64-17` → Running  
2. Password correcta en `DATABASE_URL`  
3. Base `ffcore` existe  

---

### Frontend en WSL y backend en Windows (o viceversa)

`localhost` puede funcionar, pero **instala `node_modules` en cada repo en el mismo entorno donde corres `npm run dev`**.

Recomendación: **todo en PowerShell (Windows)** para evitar dolores de cabeza.

---

## Parte 7 — Local vs producción (no mezclar)

| | Local | Producción |
|---|--------|------------|
| API | `http://localhost:3000/api/v1` | `https://ffcore-api.onrender.com/api/v1` |
| BD | `127.0.0.1:5433/ffcore` | Neon connection string |
| Front env | `.env.local` con localhost | Vercel env con Render URL |
| CORS | `localhost:8081`, `5173` | URL de Vercel |

Cuando termines de probar local y quieras producción otra vez, cambia solo las variables del front en Vercel — no toques el `.env` local del backend si sigues desarrollando.

---

## Checklist rápido

- [ ] PostgreSQL servicio **Running**
- [ ] `.env` backend con `127.0.0.1:5433`
- [ ] `npm install` en **PowerShell** (backend)
- [ ] `npm run dev` → health OK
- [ ] Front `.env` → `VITE_API_URL=http://localhost:3000/api/v1`
- [ ] `CORS_ORIGIN` incluye puerto del front
- [ ] Login con `cliente@ffcore.co` / `demo`

---

## Comandos de referencia (copiar/pegar)

```powershell
# === BACKEND ===
cd C:\Users\yilgr\OneDrive\Desktop\diplomado-backend
npm run setup
npm run dev

# === PROBAR ===
Invoke-RestMethod http://localhost:3000/api/v1/health

# === FRONTEND (en su carpeta) ===
# .env → VITE_API_URL=http://localhost:3000/api/v1
npm run dev
```
