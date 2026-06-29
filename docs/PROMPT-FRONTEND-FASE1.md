# FFCore — Prompt Fase 1: Conectar Frontend a la API

Copia y pega esto tal cual en el repositorio del **frontend** (React 19 + TanStack Start + Vite).

---

## FFCore — Fase 1 Frontend: Integración Auth + Registros

### Contexto

El backend **FFCore API** ya está implementado y funcionando en un repo separado (`diplomado-backend`).

- Base URL local: `http://localhost:3000/api/v1`
- Health verificado: `GET /health` → 200
- Login verificado: `POST /auth/login` con `super@ffcore.co` / `demo` → JWT

El frontend hoy usa **mocks** en `AuthContext` y `usersMock`. Tu trabajo es **reemplazar esos mocks** por llamadas reales a la API, **solo en auth y registro** (Fase 1).

**No modifiques el backend.** Solo consume la API REST documentada abajo.

---

### Variables de entorno (frontend)

Crear/actualizar `.env` en el repo frontend:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

Si abres el front por IP en la misma red (móvil/LAN), usa la IP de tu PC:

```env
VITE_API_URL=http://192.168.1.15:3000/api/v1
```

El backend tiene CORS habilitado para `http://localhost:5173`. Si usas otro origen, el backend debe agregarlo en `CORS_ORIGIN` (separado por comas).

---

### Arquitectura recomendada en el frontend

```
src/
├── lib/
│   └── api/
│       ├── client.ts          # fetch wrapper + token + errores
│       ├── types.ts           # User, ApiError, Role, etc.
│       └── endpoints/
│           ├── auth.ts        # login, register, me, logout
│           └── users.ts       # pending, approve, reject (superadmin)
├── contexts/
│   └── AuthContext.tsx        # reemplazar mocks por api/auth
└── pages/ o routes/
    ├── login
    ├── registro/cliente
    ├── registro/restaurante
    ├── registro/domiciliario
    └── superadmin/aprobaciones   # panel pendientes
```

---

### Cliente HTTP base (`lib/api/client.ts`)

Implementar un wrapper sobre `fetch`:

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

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('ffcore_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

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

**Reglas del cliente:**
- Guardar JWT en `localStorage` con clave `ffcore_token`
- Enviar `Authorization: Bearer {token}` en rutas autenticadas
- Parsear siempre el cuerpo de error `{ error, message, details? }`
- No exponer ni loguear passwords

---

### Tipos TypeScript (`lib/api/types.ts`)

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

export interface MeResponse {
  user: User;
}

export interface ApiErrorBody {
  error: string;
  message: string;
  details?: Array<{ field: string; message: string }>;
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

## Endpoints — Contratos completos

Prefijo: `{VITE_API_URL}` = `http://localhost:3000/api/v1`

---

### `GET /health` — Público

**Response 200:**
```json
{
  "status": "ok",
  "service": "ffcore-api",
  "version": "1.0.0",
  "timestamp": "2026-06-29T..."
}
```

---

### `POST /auth/login` — Público

**Request:**
```json
{
  "email": "super@ffcore.co",
  "password": "demo"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "name": "Super Admin",
    "email": "super@ffcore.co",
    "role": "superadmin",
    "phone": "+57 300 555 0001",
    "status": "Activo"
  }
}
```

**Errores login:**

| HTTP | error | Cuándo | UX en frontend |
|------|-------|--------|----------------|
| 401 | `INVALID_CREDENTIALS` | Email/password incorrectos | "Email o contraseña incorrectos" |
| 403 | `PENDING_APPROVAL` | Cuenta pendiente | Pantalla: "Tu cuenta está pendiente de aprobación" |
| 403 | `ACCOUNT_SUSPENDED` | Cuenta suspendida | Pantalla: "Tu cuenta fue suspendida" |
| 403 | `REGISTRATION_REJECTED` | Registro rechazado | Pantalla: "Tu solicitud fue rechazada" |
| 400 | `VALIDATION_ERROR` | Body inválido | Mostrar `details[]` por campo |

**Post-login redirect por rol:**

| role | ruta |
|------|------|
| `cliente` | `/cliente` |
| `admin` | `/admin` |
| `domiciliario` | `/domiciliario` |
| `superadmin` | `/superadmin` |

**AuthContext — cambios obligatorios:**
1. `login(email, password)` → `POST /auth/login`
2. Guardar `token` en `localStorage` (`ffcore_token`)
3. Guardar `user` en estado React
4. `logout()` → `POST /auth/logout` (opcional) + limpiar `localStorage` + redirect `/login`
5. Al montar app: si hay token → `GET /auth/me` para hidratar usuario
6. Si `/auth/me` devuelve 401 → limpiar sesión

---

### `GET /auth/me` — Autenticado

**Headers:** `Authorization: Bearer {token}`

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

### `POST /auth/logout` — Autenticado

**Headers:** `Authorization: Bearer {token}`

**Response 200:**
```json
{
  "message": "Sesión cerrada exitosamente"
}
```

> JWT es stateless. Logout en frontend = borrar token local aunque la API falle.

---

### `POST /auth/register/client` — Público

**Request:**
```json
{
  "name": "Laura Martínez",
  "email": "nuevo@ffcore.co",
  "password": "demo1234",
  "password_confirmation": "demo1234",
  "phone": "+57 310 555 0102"
}
```

**Validaciones:** name min 2, email único, password min 8 + letra + número, phone +57...

**Response 201:**
```json
{
  "token": "eyJhbG...",
  "user": {
    "id": "uuid",
    "name": "Laura Martínez",
    "email": "nuevo@ffcore.co",
    "role": "cliente",
    "phone": "+57 310 555 0102",
    "status": "Activo"
  }
}
```

**UX:** Auto-login → guardar token → redirect `/cliente`

---

### `POST /auth/register/restaurant` — Público

**Request:**
```json
{
  "owner_name": "María Restrepo",
  "email": "maria@ffcore.co",
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

**Response 201 (sin token):**
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

### `POST /auth/register/courier` — Público

**Request:**
```json
{
  "name": "Pedro Domínguez",
  "email": "pedro@ffcore.co",
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

**Response 201 (sin token):**
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

### `GET /users/pending` — Solo superadmin

**Headers:** `Authorization: Bearer {token}`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "María Restrepo",
      "email": "maria@ffcore.co",
      "role": "admin",
      "phone": "+57 300 000 0000",
      "status": "Pendiente",
      "created_at": "2026-06-29T...",
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

### `PATCH /users/:id/approve` — Solo superadmin

**Response 200:**
```json
{
  "message": "Usuario aprobado exitosamente",
  "data": { "id": "uuid", "status": "Activo" }
}
```

---

### `PATCH /users/:id/reject` — Solo superadmin

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

### `GET /users` — Solo superadmin

**Query:** `?role=admin&status=Activo&q=maria`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "...",
      "email": "...",
      "role": "admin",
      "status": "Activo",
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

---

### `POST /users` — Solo superadmin (crear usuario)

**Request:**
```json
{
  "name": "Nuevo Admin",
  "email": "nuevo@ffcore.co",
  "password": "demo1234",
  "role": "admin",
  "restaurant_id": "rest-ffcore",
  "phone": "+57 300 111 2222"
}
```

**Response 201:** `{ "data": { ...user sin password } }`

---

## Formato estándar de errores

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Datos inválidos",
  "details": [
    { "field": "email", "message": "El email ya está registrado" }
  ]
}
```

| HTTP | Uso |
|------|-----|
| 400 | Validación (`VALIDATION_ERROR`) |
| 401 | No autenticado / credenciales inválidas |
| 403 | Sin permiso / cuenta pendiente/suspendida |
| 404 | Recurso no encontrado |
| 409 | Conflicto (`CONFLICT`, ej. email duplicado) |
| 500 | Error interno |

**Helper para mostrar errores en formularios:**

```typescript
export function mapApiErrorToForm(error: unknown): Record<string, string> {
  if (error instanceof ApiError && error.details?.length) {
    return Object.fromEntries(error.details.map((d) => [d.field, d.message]));
  }
  if (error instanceof ApiError) {
    return { _form: error.message };
  }
  return { _form: 'Error inesperado. Intenta de nuevo.' };
}
```

---

## Rutas frontend a crear/actualizar

| Ruta | Descripción |
|------|-------------|
| `/login` | Formulario email + password → API login |
| `/registro/cliente` | Registro público → auto-login |
| `/registro/restaurante` | Solicitud → mensaje pendiente |
| `/registro/domiciliario` | Solicitud → mensaje pendiente |
| `/superadmin/aprobaciones` | Lista `GET /users/pending` + approve/reject |

**Protección de rutas:**
- Sin token → redirect `/login`
- Rol incorrecto → redirect al dashboard de su rol o página 403
- `superadmin` exclusivo para `/superadmin/*`

---

## Usuarios demo (password: `demo`)

| Email | Rol | Status | Uso |
|-------|-----|--------|-----|
| `super@ffcore.co` | superadmin | Activo | Panel aprobaciones |
| `admin@ffcore.co` | admin | Activo | Dashboard admin |
| `cliente@ffcore.co` | cliente | Activo | App cliente |
| `domi@ffcore.co` | domiciliario | Activo | App domiciliario |
| `vale@ffcore.co` | cliente | Suspendido | Probar error 403 |

---

## Ejemplo `lib/api/endpoints/auth.ts`

```typescript
import { api } from '../client';
import type { LoginResponse, MeResponse, User } from '../types';

export const authApi = {
  login: (email: string, password: string) =>
    api<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => api<MeResponse>('/auth/me'),

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

---

## Ejemplo `AuthContext` (pseudocódigo)

```typescript
const login = async (email: string, password: string) => {
  try {
    const { token, user } = await authApi.login(email, password);
    localStorage.setItem('ffcore_token', token);
    setUser(user);
    navigate(roleToPath(user.role));
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.code === 'PENDING_APPROVAL') throw new PendingApprovalError();
      if (err.code === 'ACCOUNT_SUSPENDED') throw new SuspendedError();
      if (err.code === 'REGISTRATION_REJECTED') throw new RejectedError();
    }
    throw err;
  }
};

useEffect(() => {
  const token = localStorage.getItem('ffcore_token');
  if (!token) return setLoading(false);
  authApi.me()
    .then(({ user }) => setUser(user))
    .catch(() => localStorage.removeItem('ffcore_token'))
    .finally(() => setLoading(false));
}, []);
```

---

## Checklist Definition of Done (frontend Fase 1)

- [ ] `AuthContext` sin mocks — usa API real
- [ ] Login con redirect por rol
- [ ] Errores `PENDING_APPROVAL`, `ACCOUNT_SUSPENDED`, `REGISTRATION_REJECTED` con UX clara
- [ ] Registro cliente → auto-login + redirect
- [ ] Registro restaurante/domiciliario → mensaje pendiente, sin token
- [ ] Panel superadmin: listar pendientes, aprobar, rechazar
- [ ] Token en `localStorage`, hidratación con `/auth/me`
- [ ] Validaciones de formulario alineadas con backend (password, phone, etc.)
- [ ] `VITE_API_URL` configurado
- [ ] Eliminar o desactivar `usersMock` en flujos de auth

---

## Orden de implementación sugerido

1. `lib/api/client.ts` + `types.ts`
2. `authApi.login` + refactor `AuthContext`
3. `GET /auth/me` al iniciar app
4. Rutas protegidas por rol
5. `/registro/cliente`
6. `/registro/restaurante` y `/registro/domiciliario`
7. Panel `/superadmin/aprobaciones`
8. Manejo de errores en todos los formularios
9. Pruebas manuales con usuarios demo

---

## NO implementar en esta fase (frontend)

- Menú, pedidos, promociones, carrito
- Refresh token
- OAuth
- Subida de avatares

---

## Verificación rápida antes de empezar

Con el backend corriendo (`npm run dev` en PowerShell):

```bash
curl http://localhost:3000/api/v1/health
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"super@ffcore.co","password":"demo"}'
```

Ambos deben responder 200.
