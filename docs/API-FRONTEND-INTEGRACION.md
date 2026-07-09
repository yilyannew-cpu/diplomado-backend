# FFCore API — Documentación para Frontend (Producción + Local)

Guía completa para consumir **FFCore API** desde React/Vite (o cualquier SPA), incluyendo el despliegue en **Render** y desarrollo local.

---

## 1. URLs y entornos

| Entorno | Base URL | Cuándo usar |
|---------|----------|-------------|
| **Producción (Render)** | `https://ffcore-api.onrender.com/api/v1` | Frontend desplegado en Vercel |
| **Local** | `http://localhost:3000/api/v1` | Desarrollo en tu PC |

### Variable de entorno en el frontend

```env
# Producción (Vercel)
VITE_API_URL=https://ffcore-api.onrender.com/api/v1

# Local (.env.local)
# VITE_API_URL=http://localhost:3000/api/v1
```

> **Importante:** Vite embebe `VITE_API_URL` en el build. Si cambias la URL, debes **redeploy** el frontend en Vercel.

### Verificar que la API responde

```bash
GET https://ffcore-api.onrender.com/api/v1/health
```

Respuesta esperada (200):

```json
{
  "status": "ok",
  "service": "ffcore-api",
  "version": "1.0.0",
  "timestamp": "2026-07-08T23:52:01.494Z"
}
```

---

## 2. Arquitectura de comunicación

```
┌─────────────────────┐     HTTPS + JSON      ┌──────────────────────────┐
│  Frontend (Vercel)  │ ────────────────────► │  Backend (Render)        │
│  React + Vite       │ ◄──────────────────── │  ffcore-api.onrender.com │
│  localStorage: JWT  │   Authorization:      │  Express + Prisma        │
└─────────────────────┘   Bearer {token}      └────────────┬─────────────┘
                                                            │
                                                            ▼
                                                 ┌─────────────────────┐
                                                 │  PostgreSQL (Neon)  │
                                                 └─────────────────────┘
```

**Reglas:**
- El frontend **nunca** accede directo a la base de datos.
- Todas las peticiones van a `{VITE_API_URL}/...`.
- Rutas autenticadas requieren header `Authorization: Bearer {token}`.
- Content-Type siempre `application/json` en POST/PATCH.

---

## 3. CORS (crítico para producción)

El backend permite orígenes configurados en `CORS_ORIGIN` **y** cualquier subdominio `*.vercel.app`.

| Origen | Comportamiento |
|--------|----------------|
| URL exacta en `CORS_ORIGIN` | Permitido |
| `https://tu-app.vercel.app` | Permitido automáticamente |
| `https://tu-app-git-rama.vercel.app` (preview) | Permitido automáticamente |
| Otro dominio no listado | **Bloqueado** (error CORS en navegador) |

**Headers permitidos:** `Authorization`, `Content-Type`  
**Métodos:** `GET`, `POST`, `PATCH`, `DELETE`, `OPTIONS`

Si ves `blocked by CORS policy`:
1. Confirma que `VITE_API_URL` apunta a Render (no a localhost).
2. En Render → Environment → agrega tu URL de Vercel a `CORS_ORIGIN` (sin `/` final):
   ```env
   CORS_ORIGIN=https://burgercore.vercel.app,http://localhost:8081
   ```
3. Redeploy del backend si cambiaste variables.

---

## 4. Autenticación JWT

### Flujo recomendado

```
1. POST /auth/login  →  recibe { token, user }
2. Guardar token en localStorage (clave sugerida: ffcore_token)
3. En cada request autenticado: Authorization: Bearer {token}
4. Al iniciar app: GET /auth/me  →  hidratar usuario
5. Si /auth/me → 401: borrar token y redirect /login
6. Logout: POST /auth/logout (opcional) + borrar localStorage
```

### Payload del token (referencia, no decodificar en producción)

El JWT incluye: `sub` (user id), `email`, `role`. Expira según `JWT_EXPIRES_IN` (default **8h** en Render).

### Errores de token

| HTTP | error | Acción frontend |
|------|-------|-----------------|
| 401 | `UNAUTHORIZED` | Sin header Bearer |
| 401 | `INVALID_TOKEN` | Token expirado o corrupto → logout |
| 403 | `FORBIDDEN` | Rol insuficiente (ej. cliente en ruta superadmin) |

---

## 5. Formato estándar de respuestas y errores

### Éxito

- Login/registro cliente: `{ token, user }`
- Me: `{ user }`
- Listados: `{ data: [...] }`
- Detalle: `{ data: { ... } }`
- Acciones: `{ message, data? }`

### Error (siempre parsear el body)

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Datos inválidos",
  "details": [
    { "field": "email", "message": "El email ya está registrado" }
  ]
}
```

| HTTP | error | Uso |
|------|-------|-----|
| 400 | `VALIDATION_ERROR` | Body inválido (Zod) |
| 401 | `INVALID_CREDENTIALS` | Login fallido |
| 401 | `UNAUTHORIZED` / `INVALID_TOKEN` | Sin auth o token inválido |
| 403 | `PENDING_APPROVAL` | Cuenta pendiente de aprobación |
| 403 | `ACCOUNT_SUSPENDED` | Cuenta suspendida |
| 403 | `REGISTRATION_REJECTED` | Solicitud rechazada |
| 403 | `FORBIDDEN` | Sin permiso (rol incorrecto) |
| 404 | `NOT_FOUND` | Usuario/recurso no existe |
| 409 | `CONFLICT` | Email duplicado u operación inválida |
| 500 | `INTERNAL_ERROR` | Error del servidor |

---

## 6. Tipos TypeScript (frontend)

```typescript
export type Role = 'cliente' | 'admin' | 'domiciliario' | 'superadmin';
export type UserStatus = 'Activo' | 'Pendiente' | 'Suspendido' | 'Rechazado';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  status: UserStatus;
  restaurant_id?: string;
  vehicle?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface PendingUser extends User {
  created_at: string;
  restaurant?: {
    id: string;
    name: string;
    city: string;
    address: string;
    status: string;
  };
}
```

---

## 7. Cliente HTTP recomendado

```typescript
const API_URL = import.meta.env.VITE_API_URL;

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('ffcore_token');

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(
      res.status,
      data.error ?? 'UNKNOWN_ERROR',
      data.message ?? 'Error en la solicitud',
      data.details
    );
  }

  return data as T;
}
```

### Cold start en Render (plan free)

Tras ~15 min sin tráfico, la API "duerme". El primer request puede tardar **30–60 segundos**.

**UX recomendada:**
- Mostrar spinner con mensaje "Conectando con el servidor…"
- Timeout generoso en login (60s) o reintentar 1 vez
- Opcional: ping a `/health` al cargar la app para despertar el servicio

---

## 8. Endpoints — Referencia completa

Prefijo: `{VITE_API_URL}`

### 8.1 Health — `GET /health`

| | |
|---|---|
| Auth | No |
| Uso | Verificar API viva, despertar Render |

---

### 8.2 Login — `POST /auth/login`

| | |
|---|---|
| Auth | No |

**Request:**
```json
{
  "email": "cliente@ffcore.co",
  "password": "demo"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "name": "Laura Martínez",
    "email": "cliente@ffcore.co",
    "role": "cliente",
    "phone": "+57 310 555 0102",
    "status": "Activo"
  }
}
```

**Redirect post-login por rol:**

| role | ruta sugerida |
|------|---------------|
| `cliente` | `/cliente` |
| `admin` | `/admin` |
| `domiciliario` | `/domiciliario` |
| `superadmin` | `/superadmin` |

**Errores login:**

| HTTP | error | UX |
|------|-------|-----|
| 401 | `INVALID_CREDENTIALS` | "Email o contraseña incorrectos" |
| 403 | `PENDING_APPROVAL` | Pantalla "Cuenta pendiente de aprobación" |
| 403 | `ACCOUNT_SUSPENDED` | Pantalla "Cuenta suspendida" |
| 403 | `REGISTRATION_REJECTED` | Pantalla "Solicitud rechazada" |

---

### 8.3 Usuario actual — `GET /auth/me`

| | |
|---|---|
| Auth | JWT |

**Response 200:**
```json
{
  "user": {
    "id": "uuid",
    "name": "Carlos Restrepo",
    "email": "admin@ffcore.co",
    "role": "admin",
    "phone": "+57 311 555 0211",
    "restaurant_id": "rest-ffcore",
    "status": "Activo"
  }
}
```

---

### 8.4 Logout — `POST /auth/logout`

| | |
|---|---|
| Auth | JWT |

**Response 200:**
```json
{ "message": "Sesión cerrada exitosamente" }
```

> JWT es stateless. Logout real = borrar `localStorage` aunque falle la API.

---

### 8.5 Registro cliente — `POST /auth/register/client`

| | |
|---|---|
| Auth | No |
| Resultado | Auto-login (devuelve token) |

**Request:**
```json
{
  "name": "Laura Martínez",
  "email": "nuevo@example.com",
  "password": "demo1234",
  "password_confirmation": "demo1234",
  "phone": "+57 310 555 0102"
}
```

**Validaciones:**
- `name`: min 2, max 100
- `password`: min 8, al menos 1 letra y 1 número
- `password_confirmation`: debe coincidir
- `phone`: min 10 dígitos, formato `+57...` o 10+ dígitos
- `email`: único (409 si existe)

**Response 201:** igual que login `{ token, user }` con `role: "cliente"`, `status: "Activo"`.

---

### 8.6 Registro restaurante — `POST /auth/register/restaurant`

| | |
|---|---|
| Auth | No |
| Resultado | **Sin token** — queda Pendiente |

**Request:**
```json
{
  "owner_name": "María Restrepo",
  "email": "maria@example.com",
  "password": "demo1234",
  "password_confirmation": "demo1234",
  "phone": "+57 300 000 0000",
  "restaurant_name": "Mi Restaurante",
  "tagline": "Comida casera",
  "city": "Medellín · El Poblado",
  "address": "Calle 10 #43-28",
  "delivery_minutes": 30
}
```

| Campo | Requerido | Notas |
|-------|-----------|-------|
| `owner_name` | Sí | |
| `restaurant_name` | Sí | |
| `city`, `address` | Sí | |
| `tagline` | No | max 200 |
| `delivery_minutes` | No | 10–120, default 30 |

**Response 201:**
```json
{
  "message": "Solicitud de registro enviada. Un administrador revisará tu cuenta.",
  "data": {
    "user_id": "uuid",
    "restaurant_id": "uuid",
    "status": "Pendiente"
  }
}
```

**UX:** Pantalla de confirmación. **No** guardar token. **No** redirect a dashboard.

---

### 8.7 Registro domiciliario — `POST /auth/register/courier`

| | |
|---|---|
| Auth | No |
| Resultado | **Sin token** — queda Pendiente |

**Request:**
```json
{
  "name": "Pedro Domínguez",
  "email": "pedro@example.com",
  "password": "demo1234",
  "password_confirmation": "demo1234",
  "phone": "+57 320 555 9999",
  "document_id": "1098765432",
  "vehicle_type": "Moto",
  "vehicle_plate": "ABC-123",
  "vehicle_description": "Moto AKT"
}
```

**`vehicle_type` enum:** `Moto` | `Bici` | `Automóvil` | `Otro`

**Response 201:**
```json
{
  "message": "Solicitud enviada. Recibirás acceso cuando un administrador apruebe tu cuenta.",
  "data": {
    "user_id": "uuid",
    "status": "Pendiente"
  }
}
```

---

### 8.8 Pendientes — `GET /users/pending`

| | |
|---|---|
| Auth | JWT + rol `superadmin` |

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "María Restrepo",
      "email": "maria@example.com",
      "role": "admin",
      "phone": "+57 300 000 0000",
      "status": "Pendiente",
      "created_at": "2026-06-29T12:00:00.000Z",
      "restaurant": {
        "id": "uuid",
        "name": "Mi Restaurante",
        "city": "Medellín",
        "address": "Calle 10",
        "status": "Pendiente"
      }
    }
  ]
}
```

---

### 8.9 Aprobar — `PATCH /users/:id/approve`

| | |
|---|---|
| Auth | JWT + `superadmin` |
| Params | `id` = UUID del usuario |

**Response 200:**
```json
{
  "message": "Usuario aprobado exitosamente",
  "data": { "id": "uuid", "status": "Activo" }
}
```

Si es admin de restaurante, también activa el restaurante asociado.

---

### 8.10 Rechazar — `PATCH /users/:id/reject`

| | |
|---|---|
| Auth | JWT + `superadmin` |

**Request (opcional):**
```json
{ "reason": "Documentación incompleta" }
```

**Response 200:**
```json
{
  "message": "Solicitud rechazada",
  "data": { "id": "uuid", "status": "Rechazado" }
}
```

---

### 8.11 Listar usuarios — `GET /users`

| | |
|---|---|
| Auth | JWT + `superadmin` |

**Query params (todos opcionales):**

| Param | Valores |
|-------|---------|
| `role` | `cliente`, `admin`, `domiciliario`, `superadmin` |
| `status` | `Activo`, `Pendiente`, `Suspendido`, `Rechazado` |
| `q` | Búsqueda por nombre/email |

Ejemplo: `GET /users?role=admin&status=Activo&q=maria`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "...",
      "email": "...",
      "role": "admin",
      "phone": "...",
      "vehicle": null,
      "document_id": null,
      "avatar": null,
      "restaurant_id": "rest-ffcore",
      "status": "Activo",
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

---

### 8.12 Detalle usuario — `GET /users/:id`

| | |
|---|---|
| Auth | JWT + `superadmin` |

**Response 200:** `{ "data": { ...usuario completo } }`

---

### 8.13 Crear usuario — `POST /users`

| | |
|---|---|
| Auth | JWT + `superadmin` |

**Request:**
```json
{
  "name": "Nuevo Admin",
  "email": "nuevo@example.com",
  "password": "demo1234",
  "role": "admin",
  "restaurant_id": "rest-ffcore",
  "phone": "+57 300 111 2222",
  "status": "Activo"
}
```

| Campo | Notas |
|-------|-------|
| `role` | Requerido |
| `restaurant_id` | Recomendado si `role` = `admin` |
| `vehicle` | Opcional, para domiciliario |
| `status` | Opcional, default según lógica de negocio |

**Response 201:** `{ "data": { ...user sin password } }`

---

### 8.14 Editar usuario — `PATCH /users/:id`

| | |
|---|---|
| Auth | JWT + `superadmin` |

**Request (todos opcionales):**
```json
{
  "name": "Nombre actualizado",
  "email": "nuevo@example.com",
  "phone": "+57 300 111 2222",
  "vehicle": "Moto — ABC-123",
  "role": "domiciliario",
  "status": "Suspendido",
  "restaurant_id": "rest-ffcore"
}
```

**Response 200:** `{ "data": { ...usuario actualizado } }`

---

## 9. Usuarios demo (password: `demo`)

Disponibles en producción (Neon) si se ejecutó el seed:

| Email | Rol | Status | Uso en pruebas |
|-------|-----|--------|----------------|
| `cliente@ffcore.co` | cliente | Activo | Flujo cliente |
| `admin@ffcore.co` | admin | Activo | Dashboard restaurante |
| `domi@ffcore.co` | domiciliario | Activo | App domiciliario |
| `super@ffcore.co` | superadmin | Activo | Aprobaciones / usuarios |
| `vale@ffcore.co` | cliente | Suspendido | Probar 403 ACCOUNT_SUSPENDED |

---

## 10. Configuración Vercel (checklist producción)

### Frontend (Vercel → Settings → Environment Variables)

| Variable | Valor producción |
|----------|------------------|
| `VITE_API_URL` | `https://ffcore-api.onrender.com/api/v1` |

Aplicar a: **Production** (y Preview si quieres probar contra Render).

### Backend (Render → Environment)

| Variable | Ejemplo |
|----------|---------|
| `DATABASE_URL` | Connection string Neon con `?sslmode=require` |
| `JWT_SECRET` | 32+ caracteres aleatorios |
| `JWT_EXPIRES_IN` | `8h` |
| `CORS_ORIGIN` | `https://tu-front.vercel.app,http://localhost:8081` |
| `NODE_ENV` | `production` |

---

## 11. Protección de rutas en el frontend

```typescript
const ROLE_ROUTES: Record<Role, string> = {
  cliente: '/cliente',
  admin: '/admin',
  domiciliario: '/domiciliario',
  superadmin: '/superadmin',
};

// Sin token → /login
// Token + rol incorrecto → dashboard de su rol o /403
// superadmin exclusivo para /superadmin/*
```

---

## 12. Módulo de endpoints sugerido

```typescript
// lib/api/endpoints/auth.ts
import { api } from '../client';
import type { LoginResponse, MeResponse, User } from '../types';

export const authApi = {
  login: (email: string, password: string) =>
    api<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => api<{ user: User }>('/auth/me'),

  logout: () =>
    api<{ message: string }>('/auth/logout', { method: 'POST' }),

  registerClient: (body: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone: string;
  }) =>
    api<LoginResponse>('/auth/register/client', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  registerRestaurant: (body: Record<string, unknown>) =>
    api<{ message: string; data: object }>('/auth/register/restaurant', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  registerCourier: (body: Record<string, unknown>) =>
    api<{ message: string; data: object }>('/auth/register/courier', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
```

```typescript
// lib/api/endpoints/users.ts (superadmin)
export const usersApi = {
  pending: () => api<{ data: PendingUser[] }>('/users/pending'),

  approve: (id: string) =>
    api<{ message: string; data: { id: string; status: string } }>(
      `/users/${id}/approve`,
      { method: 'PATCH' }
    ),

  reject: (id: string, reason?: string) =>
    api<{ message: string; data: { id: string; status: string } }>(
      `/users/${id}/reject`,
      { method: 'PATCH', body: JSON.stringify({ reason }) }
    ),

  list: (params?: { role?: string; status?: string; q?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return api<{ data: User[] }>(`/users${qs ? `?${qs}` : ''}`);
  },
};
```

---

## 13. Problemas frecuentes (producción)

| Síntoma | Causa | Solución |
|---------|-------|----------|
| CORS error | Front en dominio no permitido | Agregar URL en `CORS_ORIGIN` en Render |
| Login pending eterno | Render dormido (cold start) | Esperar 60s o ping `/health` antes |
| 401 en todas las rutas | Token expirado (8h) | Redirect login, borrar localStorage |
| Network error | `VITE_API_URL` mal configurada | Verificar en Vercel + redeploy |
| Funciona local, falla prod | Front apunta a localhost | `VITE_API_URL` = URL Render en prod |
| 403 PENDING_APPROVAL | Usuario restaurante/courier nuevo | Mostrar pantalla de espera |

---

## 14. Local vs producción (no mezclar)

| | Local | Producción |
|---|--------|------------|
| API | `http://localhost:3000/api/v1` | `https://ffcore-api.onrender.com/api/v1` |
| Front env | `.env.local` | Vercel env vars |
| BD | Postgres local | Neon (solo backend) |
| CORS | `localhost:8081`, `5173` | URL Vercel + previews |

Usa **archivos `.env` separados** o variables distintas por entorno en Vercel. No hardcodear URLs en el código.

---

## 15. Fuera de alcance (Fase 1)

No existen aún en la API:
- Menú, pedidos, carrito, promociones
- Refresh token
- OAuth / Google login
- Subida de avatares
- Paginación en listados

---

## 16. Recursos adicionales

- Colección Postman: `postman/FFCore-API.postman_collection.json` (cambiar `baseUrl` a Render)
- Guía despliegue: `docs/DEPLOY-RENDER.md`
- Desarrollo local: `docs/GUIA-DESARROLLO-LOCAL.md`
- Prompt integración Fase 1: `docs/PROMPT-FRONTEND-FASE1.md`
