# Guía de estudio — Despliegue FFCore Backend

Documento para entender **cómo se desplegó** la API, **cómo fluyen los datos** y **por qué falló** en varios puntos antes de funcionar.

---

## 1. Vista general: ¿qué hay en producción?

```
┌─────────────────┐     HTTPS      ┌──────────────────────┐     SQL       ┌─────────────┐
│  Frontend       │ ──────────────► │  Backend (Render)    │ ────────────► │ PostgreSQL  │
│  Vercel         │   JSON + JWT    │  Node + Express      │   Prisma ORM  │  Neon       │
│  React / Vite   │ ◄────────────── │  ffcore-api          │ ◄──────────── │  (nube)     │
└─────────────────┘                 └──────────────────────┘               └─────────────┘
   Puerto 443                           Puerto 443                              Puerto 5432
   burgercore.vercel.app                ffcore-api.onrender.com                 ep-xxx.neon.tech
```

| Pieza | Dónde corre | Rol |
|-------|-------------|-----|
| **Frontend** | Vercel | UI, formularios, guarda JWT en `localStorage` |
| **Backend (API)** | Render | Lógica, auth, validaciones, reglas de negocio |
| **Base de datos** | Neon | Almacena usuarios, restaurantes, contraseñas hasheadas |

**Regla de oro:** el frontend **nunca** habla directo con la BD. Siempre pasa por la API.

---

## 2. Desarrollo local vs producción

### Local (tu PC)

```
Frontend (localhost:8081)
    → API (localhost:3000)
        → PostgreSQL (127.0.0.1:5433 en Windows)
```

- Todo en tu máquina o WSL
- `.env` con `DATABASE_URL=...@127.0.0.1:5433/ffcore`
- CORS permite `localhost:8081`

### Producción

```
Frontend (https://xxx.vercel.app)
    → API (https://ffcore-api.onrender.com)
        → PostgreSQL (https://ep-xxx.neon.tech)
```

- Tres servicios distintos en internet
- Variables de entorno en cada plataforma
- HTTPS en todo
- CORS debe permitir el dominio exacto de Vercel

---

## 3. Cómo se desplegó el backend (paso a paso)

### Fase A — Preparar el código

1. **Arquitectura hexagonal** en `src/`:
   - `domain/` → reglas puras (sin Express ni Prisma)
   - `application/` → casos de uso
   - `infrastructure/` → Prisma, bcrypt, JWT
   - `adapters/http/` → rutas Express, controllers

2. **Scripts en `package.json`**:
   ```json
   "build": "prisma generate && tsc",
   "build:render": "prisma generate && prisma migrate deploy && tsc",
   "start": "node dist/server.js"
   ```

3. **`render.yaml`** — blueprint opcional para Render

### Fase B — Base de datos en la nube (Neon)

1. Crear proyecto en [neon.tech](https://neon.tech)
2. Obtener `DATABASE_URL` (connection string con SSL)
3. Desde tu PC:
   ```bash
   npm exec prisma -- migrate deploy
   npm exec prisma -- db seed
   ```
4. Eso creó tablas `users`, `restaurants` y cargó 8 usuarios demo

**¿Por qué Neon y no PostgreSQL en Render?**
- Neon free es generoso para diplomados
- Render free para Postgres es más limitado
- Separar BD y API es buena práctica (escalabilidad)

### Fase C — Subir código a GitHub

```
GitHub (rama main)
    → Render detecta push
    → Ejecuta build
    → Ejecuta start
    → Servicio live en ffcore-api.onrender.com
```

### Fase D — Configurar Render (Web Service)

| Configuración | Valor |
|---------------|--------|
| Runtime | Node 20 |
| Branch | `main` |
| Build | `npm install --include=dev && npm run build:render` |
| Start | `npm start` |
| Health check | `/api/v1/health` |

**Variables de entorno en Render:**

| Variable | Para qué |
|----------|----------|
| `DATABASE_URL` | Conectar Prisma a Neon |
| `JWT_SECRET` | Firmar tokens de login |
| `JWT_EXPIRES_IN` | Duración del token (`8h`) |
| `CORS_ORIGIN` | Qué frontends pueden llamar la API |
| `NODE_ENV` | `production` |

Render inyecta `PORT` automáticamente (ej. `10000`). Tu código lee `process.env.PORT`.

### Fase E — Conectar el frontend (Vercel)

```env
VITE_API_URL=https://ffcore-api.onrender.com/api/v1
```

Vite **embebe** esta variable al hacer build → hay que **redeploy** el front cada vez que cambie.

---

## 4. Qué pasa en el BUILD de Render

```
1. git clone (rama main)
2. npm install --include=dev     ← instala TypeScript, @types/*, prisma...
3. npm run build:render
   ├── prisma generate          ← genera cliente Prisma (código para hablar con BD)
   ├── prisma migrate deploy    ← aplica migraciones SQL en Neon
   └── tsc                      ← compila TypeScript → carpeta dist/
4. Artefacto listo: dist/server.js + node_modules
```

**Error que tuviste:** `npm install` sin `--include=dev` no instalaba TypeScript → build fallaba.

---

## 5. Qué pasa en el START de Render

```
1. npm start  →  node dist/server.js
2. server.ts carga dotenv (variables de Render)
3. createApp() monta Express:
   - CORS
   - JSON parser
   - Rutas /api/v1/auth, /api/v1/users
4. app.listen(PORT, '0.0.0.0')  ← escucha en todas las interfaces
5. Health check: GET /api/v1/health → 200 OK
```

**Error que tuviste:** poner `prisma migrate deploy` en **start** hacía que la app tardara mucho en escuchar → health check fallaba → "Service waking up" eterno.

---

## 6. Flujo de datos: ejemplo LOGIN

```
Usuario escribe email + password en Vercel
         │
         ▼
┌────────────────────────────────────────────────────────────┐
│ 1. FRONTEND (Vercel)                                       │
│    POST https://ffcore-api.onrender.com/api/v1/auth/login  │
│    Body: { "email": "...", "password": "..." }             │
│    Headers: Content-Type: application/json                   │
└────────────────────────────────────────────────────────────┘
         │
         │  Navegador verifica CORS (preflight OPTIONS si aplica)
         ▼
┌────────────────────────────────────────────────────────────┐
│ 2. RENDER → Express (adapters/http)                        │
│    authRoutes → validate(loginSchema) → loginController     │
└────────────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────┐
│ 3. APPLICATION (LoginUseCase)                              │
│    - Busca usuario por email                               │
│    - bcrypt.compare(password, hash)                        │
│    - Verifica status (Activo, Pendiente, etc.)             │
│    - JwtTokenService.sign({ sub, email, role })            │
└────────────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────┐
│ 4. INFRASTRUCTURE (PrismaUserRepository)                   │
│    prisma.user.findUnique({ where: { email } })            │
│         │                                                  │
│         ▼                                                  │
│    NEON PostgreSQL — tabla users                           │
└────────────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────┐
│ 5. RESPUESTA JSON (sin password)                           │
│    { "token": "eyJ...", "user": { id, email, role, ... } } │
└────────────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────┐
│ 6. FRONTEND guarda token en localStorage                   │
│    Redirige según role: /cliente, /admin, etc.             │
└────────────────────────────────────────────────────────────┘
```

---

## 7. Flujo de datos: registro restaurante (con aprobación)

```
POST /auth/register/restaurant (público)
    → Crea Restaurant (status: Pendiente)
    → Crea User admin (status: Pendiente)
    → Transacción Prisma (todo o nada)
    → Response 201 SIN token

Superadmin:
    GET /users/pending  → lista pendientes
    PATCH /users/:id/approve
        → User → Activo
        → Restaurant → Activo (si role = admin)
```

---

## 8. Capas de seguridad en el despliegue

| Capa | Qué protege |
|------|-------------|
| **HTTPS** | Cifra tráfico navegador ↔ API |
| **CORS** | Solo dominios permitidos llaman la API desde el browser |
| **JWT** | Rutas privadas requieren `Authorization: Bearer ...` |
| **authorize(roles)** | Solo superadmin en `/users/*` |
| **bcrypt** | Password nunca se guarda en texto plano |
| **Zod** | Valida body antes de llegar al caso de uso |
| **Variables de entorno** | Secretos fuera del código (no en GitHub) |

---

## 9. Errores que tuviste y qué aprendiste

| Problema | Causa | Solución |
|----------|--------|----------|
| `P1000` auth PostgreSQL | `127.0.0.1` en local ≠ Neon | `DATABASE_URL` de Neon en Render |
| `npx` bloqueado PowerShell | Execution Policy | `npx.cmd` o Git Bash |
| `EPERM` prisma generate | OneDrive + proceso node abierto | Cerrar `npm run dev`, borrar `.prisma` |
| WSL vs Windows `node_modules` | Binarios distintos (esbuild, prisma) | `npm install` en el mismo OS donde corres |
| CORS error front | Front en `:8081`, CORS solo `:5173` | Agregar origen en `CORS_ORIGIN` |
| Login `pending` | Render dormido (plan free) | Esperar 60s o ping `/health` antes |
| Build failed TypeScript | `NODE_ENV=production` sin devDeps | `npm install --include=dev` en build |
| Health nunca responde | `migrate` en start bloqueaba | Migrar en build, start solo `node` |
| `tsx` no reconoce Windows | `node_modules` de Linux (WSL) | Reinstalar en PowerShell |

---

## 10. Conceptos clave para estudiar

### Despliegue (DevOps básico)

- **Build** = preparar artefacto (compilar TS, generar Prisma)
- **Start** = ejecutar el servidor en producción
- **Health check** = URL que la plataforma usa para saber si vives
- **Cold start** = primer request lento tras inactividad (plan free)
- **Environment variables** = configuración por entorno sin cambiar código

### Backend

- **API REST** = recursos + verbos HTTP (GET, POST, PATCH)
- **Stateless JWT** = servidor no guarda sesión; el token lleva la identidad
- **ORM (Prisma)** = código TypeScript ↔ SQL
- **Migraciones** = versionado del esquema de BD
- **Seed** = datos iniciales de prueba

### Red

- **CORS** = política del navegador (no aplica a Postman/curl)
- **localhost** = solo tu máquina; en nube usas dominios públicos
- **SSL/TLS** = `https://` y `?sslmode=require` en Neon

---

## 11. Comandos útiles para repasar

```bash
# Local
npm run dev
npm run build
npx prisma studio

# Producción (desde tu PC contra Neon)
$env:DATABASE_URL="postgresql://...@neon.tech/neondb?sslmode=require"
npm exec prisma -- migrate deploy
npm exec prisma -- db seed

# Probar API en producción
curl https://ffcore-api.onrender.com/api/v1/health
```

---

## 12. Checklist mental antes de cualquier deploy

1. ¿El código está en GitHub?
2. ¿La BD en la nube tiene migraciones aplicadas?
3. ¿Las variables de entorno están en la plataforma (no solo en `.env` local)?
4. ¿El build compila sin errores?
5. ¿El start escucha en `0.0.0.0` y `process.env.PORT`?
6. ¿CORS incluye la URL del frontend?
7. ¿El frontend apunta a la URL correcta de la API?
8. ¿Probaste `/health` y un login?

---

## 13. Tu stack final (resumen para exponer en clase)

> **FFCore API** es un backend REST en **Node.js + Express + TypeScript** con arquitectura hexagonal. Usa **Prisma** como ORM sobre **PostgreSQL (Neon)**. La autenticación es **JWT + bcrypt**. Se despliega en **Render** (plan free) y se consume desde un frontend en **Vercel**. Las variables de entorno separan configuración local y producción. El build compila TypeScript y aplica migraciones; el runtime solo ejecuta `node dist/server.js`.

---

## 14. Recursos para profundizar

- [Render Docs — Node](https://render.com/docs/deploy-node-express-app)
- [Neon — Prisma guide](https://neon.tech/docs/guides/prisma)
- [Prisma — Deploy](https://www.prisma.io/docs/orm/prisma-client/deployment)
- [MDN — CORS](https://developer.mozilla.org/es/docs/Web/HTTP/CORS)
- [JWT.io](https://jwt.io) — decodificar tokens (debug)
