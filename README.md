# FFCore API — Fase 1

Backend REST para **FFCore**: autenticación JWT, registros públicos (cliente, restaurante, domiciliario) y gestión de usuarios por superadmin.

Stack: **Node.js 20+ · Express · TypeScript · PostgreSQL · Prisma · Zod · bcrypt · JWT**

Arquitectura **hexagonal pragmática** (Ports & Adapters): `domain/` y `application/` no dependen de Express ni Prisma.

---

## Requisitos

- Node.js 20 o superior
- PostgreSQL 14+ **o** Docker (elige una opción de base de datos)
- npm

---

## PostgreSQL en Windows (sin Docker) — recomendado si ya lo tienes instalado

No necesitas Docker para la base de datos. Usa tu PostgreSQL local en el puerto **5432**.

### 1. Crear la base de datos

Abre **pgAdmin** o **SQL Shell (psql)** con tu usuario `postgres` y ejecuta:

```sql
-- Opción simple: usar tu usuario postgres existente
CREATE DATABASE ffcore;
```

O, si prefieres un usuario dedicado al proyecto:

```sql
CREATE USER ffcore WITH PASSWORD 'ffcore';
CREATE DATABASE ffcore OWNER ffcore;
GRANT ALL PRIVILEGES ON DATABASE ffcore TO ffcore;
```

En PostgreSQL 15+, si usas usuario dedicado, conéctate a la BD `ffcore` y ejecuta también:

```sql
GRANT ALL ON SCHEMA public TO ffcore;
```

### 2. Configurar `.env`

Copia `.env.example` a `.env` y ajusta `DATABASE_URL` con **tu usuario y contraseña reales**:

```env
# Con usuario postgres (el que instalaste en Windows)
DATABASE_URL=postgresql://postgres:TU_PASSWORD_AQUI@localhost:5432/ffcore

# O con usuario dedicado
# DATABASE_URL=postgresql://ffcore:ffcore@localhost:5432/ffcore
```

Formato de la URL:

```
postgresql://USUARIO:CONTRASEÑA@localhost:5432/ffcore
```

### 3. Instalar todo y arrancar (recomendado)

```bash
npm run setup
npm run dev
```

`npm run setup` instala dependencias, genera Prisma, aplica migraciones y carga datos demo.  
Si hubo problemas con WSL/Windows: `npm run setup:clean`.  
Con Docker para Postgres: `npm run setup:docker`.

Instalación manual:

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### 4. Verificar conexión (opcional)

```bash
npx prisma db pull
```

Si no da error P1000, la conexión está bien.

> **Nota:** Si la contraseña tiene caracteres especiales (`@`, `#`, `%`, etc.), codifícala en la URL  
> (`@` → `%40`, `#` → `%23`).

---

## Docker en Ubuntu / WSL (alternativa)

Si **Docker corre en Ubuntu** (WSL2 o VM) y el error `P1000` aparece al migrar desde **Git Bash o PowerShell de Windows**, el problema es que `localhost` apunta al PostgreSQL de Windows, no al contenedor en Ubuntu.

**Solución recomendada:** ejecuta Docker, Prisma y el servidor **desde la misma terminal Ubuntu** donde corre Docker:

```bash
# En Ubuntu / WSL — ruta al proyecto en disco Windows:
cd /mnt/c/Users/yilgr/OneDrive/Desktop/diplomado-backend

docker compose up -d
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Verifica el contenedor:

```bash
docker compose ps
# ffcore-db → running
```

Si Ubuntu es una **máquina remota** (no WSL), usa su IP en `.env`:

```env
DATABASE_URL=postgresql://ffcore:ffcore@192.168.x.x:5432/ffcore
```

Y abre el puerto 5432 en el firewall de Ubuntu si aplica.

---

## Instalación

### 1. Clonar e instalar dependencias

```bash
npm install
```

### 2. Variables de entorno

```bash
cp .env.example .env
```

Edita `.env` si necesitas cambiar puertos u orígenes CORS.

### 3. Base de datos

**Opción A — PostgreSQL en Windows:** sigue la sección [PostgreSQL en Windows](#postgresql-en-windows-sin-docker--recomendado-si-ya-lo-tienes-instalado) (no uses `docker compose`).

**Opción B — Docker:**

```bash
docker compose up -d
```

### 4. Migraciones y seed

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 5. Iniciar servidor en desarrollo

```bash
npm run dev
```

La API queda en `http://localhost:3000/api/v1`.

---

## Endpoints Fase 1

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/v1/health` | No | Health check |
| POST | `/api/v1/auth/login` | No | Login email + password |
| POST | `/api/v1/auth/register/client` | No | Registro cliente (auto-login) |
| POST | `/api/v1/auth/register/restaurant` | No | Solicitud restaurante |
| POST | `/api/v1/auth/register/courier` | No | Solicitud domiciliario |
| GET | `/api/v1/auth/me` | JWT | Usuario autenticado |
| POST | `/api/v1/auth/logout` | JWT | Cerrar sesión (stateless) |
| GET | `/api/v1/users/pending` | superadmin | Cola de aprobación |
| GET | `/api/v1/users` | superadmin | Listar usuarios (`?role=&status=&q=`) |
| GET | `/api/v1/users/:id` | superadmin | Detalle usuario |
| POST | `/api/v1/users` | superadmin | Crear cualquier rol |
| PATCH | `/api/v1/users/:id/approve` | superadmin | Aprobar solicitud |
| PATCH | `/api/v1/users/:id/reject` | superadmin | Rechazar solicitud |
| PATCH | `/api/v1/users/:id` | superadmin | Editar perfil / status / role |

---

## Usuarios demo (password: `demo`)

| Email | Rol | Status | Notas |
|-------|-----|--------|-------|
| cliente@ffcore.co | cliente | Activo | |
| jp@ffcore.co | cliente | Activo | |
| vale@ffcore.co | cliente | Suspendido | Login → 403 ACCOUNT_SUSPENDED |
| admin@ffcore.co | admin | Activo | restaurant_id: rest-ffcore |
| poblado@ffcore.co | admin | Activo | |
| super@ffcore.co | superadmin | Activo | |
| domi@ffcore.co | domiciliario | Activo | |
| seba@ffcore.co | domiciliario | Activo | |

---

## Colección Postman

1. Abre Postman → **Import**
2. Selecciona `postman/FFCore-API.postman_collection.json`
3. Variables de colección:
   - `baseUrl`: `http://localhost:3000/api/v1`
   - `token`: se guarda automáticamente al hacer login

Casos incluidos: login exitoso, cliente suspendido, registro cliente/restaurante/courier, pending, approve/reject, crear superadmin, 401 sin JWT.

---

## Formato de errores

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Datos inválidos",
  "details": [{ "field": "email", "message": "El email ya está registrado" }]
}
```

| Código | Uso |
|--------|-----|
| 400 | Validación |
| 401 | No autenticado / credenciales inválidas |
| 403 | Sin permiso / cuenta pendiente o suspendida |
| 404 | Recurso no encontrado |
| 409 | Conflicto (email duplicado) |
| 500 | Error interno |

---

## Historias de usuario (Fase 1)

- **HU-01** Login admin → JWT con role `admin`
- **HU-02** Registro cliente → `Activo` + JWT inmediato
- **HU-03** Registro restaurante → `Pendiente` → superadmin aprueba
- **HU-04** Registro domiciliario → `Pendiente` → superadmin aprueba
- **HU-05** Solo superadmin crea otro superadmin vía `POST /users`

---

## Scripts npm

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor con hot-reload (tsx) |
| `npm run build` | Compilar TypeScript |
| `npm start` | Ejecutar build de producción |
| `npx prisma migrate dev` | Crear/aplicar migraciones |
| `npx prisma db seed` | Cargar datos demo |

---

## Frontend (referencia)

El frontend consume la API en:

```
VITE_API_URL=http://localhost:3000/api/v1
```

CORS permite `http://localhost:5173` por defecto (configurable en `CORS_ORIGIN`).

---

## Fuera de alcance (Fase 2+)

Menú, pedidos, promociones, refresh token, OAuth, avatares, emails de confirmación.
