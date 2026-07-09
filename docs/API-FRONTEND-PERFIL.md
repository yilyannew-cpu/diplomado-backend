# FFCore API — Módulo de Perfil (Frontend)

Documentación para consumir **Mi cuenta** y **Configuración** desde React/Vite.

Complementa: [`API-FRONTEND-INTEGRACION.md`](./API-FRONTEND-INTEGRACION.md) (Fase 1) y [`API-FRONTEND-FASE2.md`](./API-FRONTEND-FASE2.md) (Dashboard).

---

## 1. Configuración base

| Entorno | `VITE_API_URL` |
|---------|----------------|
| Local | `http://localhost:3000/api/v1` |
| Producción | `https://ffcore-api.onrender.com/api/v1` |

**Autenticación:** todos los endpoints requieren:

```
Authorization: Bearer {token}
Content-Type: application/json   (solo PATCH)
```

El token se obtiene con `POST /auth/login` y se guarda en `localStorage` (ej. clave `ffcore_token`).

---

## 2. Resumen por rol

| Rol | `GET /auth/me` | `PATCH /auth/me` (email/teléfono) | `PATCH /auth/me/password` |
|-----|----------------|-----------------------------------|---------------------------|
| `cliente` | Sí | Sí | Sí |
| `domiciliario` | Sí | Sí | Sí |
| `superadmin` | Sí | Sí | Sí |
| `admin` | Sí | **403** — no permitido | Sí (única opción en Configuración) |

---

## 3. Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/auth/me` | Leer perfil del usuario autenticado |
| `PATCH` | `/auth/me` | Actualizar email y/o teléfono |
| `PATCH` | `/auth/me/password` | Cambiar contraseña |

---

## 4. Tipos TypeScript

```typescript
// lib/api/types/profile.ts
export type Role = 'cliente' | 'admin' | 'domiciliario' | 'superadmin';
export type UserStatus = 'Activo' | 'Pendiente' | 'Suspendido' | 'Rechazado';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  status: UserStatus;
  restaurant_id?: string;
  vehicle?: string;
}

export interface UpdateProfileBody {
  email?: string;
  phone?: string;
}

export interface ChangePasswordBody {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export interface MeResponse {
  user: UserProfile;
}

export interface UpdateProfileResponse {
  user: UserProfile;
}

export interface ChangePasswordResponse {
  user: UserProfile;
  message: string;
}
```

---

## 5. Cliente HTTP

```typescript
// lib/api/endpoints/profile.ts
import { api } from '../client';
import type {
  MeResponse,
  UpdateProfileBody,
  UpdateProfileResponse,
  ChangePasswordBody,
  ChangePasswordResponse,
} from '../types/profile';

export const profileApi = {
  getMe: () => api<MeResponse>('/auth/me'),

  updateProfile: (body: UpdateProfileBody) =>
    api<UpdateProfileResponse>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  changePassword: (body: ChangePasswordBody) =>
    api<ChangePasswordResponse>('/auth/me/password', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
};
```

---

## 6. `GET /auth/me` — Obtener perfil

Ya usado en **Mi cuenta**. Devuelve el usuario autenticado según el JWT.

**Headers:**
```
Authorization: Bearer {token}
Accept: application/json
```

**Response 200:**

```json
{
  "user": {
    "id": "30879a79-3d7d-4784-bc8c-1710f019a8fe",
    "name": "Laura Martínez",
    "email": "cliente@ffcore.co",
    "role": "cliente",
    "phone": "+57 310 555 0102",
    "status": "Activo"
  }
}
```

Con rol `admin` (incluye `restaurant_id`):

```json
{
  "user": {
    "id": "uuid",
    "name": "Carlos Restrepo",
    "email": "admin@ffcore.co",
    "role": "admin",
    "phone": "+57 311 555 0211",
    "status": "Activo",
    "restaurant_id": "rest-ffcore"
  }
}
```

Con rol `domiciliario` (incluye `vehicle`):

```json
{
  "user": {
    "id": "uuid",
    "name": "Sebastián Domínguez",
    "email": "domi@ffcore.co",
    "role": "domiciliario",
    "phone": "+57 320 555 0301",
    "status": "Activo",
    "vehicle": "Moto AKT — PLA-23H"
  }
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string (UUID) | ID del usuario |
| `name` | string | Nombre completo (solo lectura en esta fase) |
| `email` | string | Correo electrónico |
| `role` | enum | `cliente` \| `admin` \| `domiciliario` \| `superadmin` |
| `phone` | string \| null | Teléfono |
| `status` | enum | `Activo` \| `Pendiente` \| `Suspendido` \| `Rechazado` |
| `restaurant_id` | string | Solo admin restaurante |
| `vehicle` | string | Solo domiciliario |

**Errores:**

| HTTP | error | Descripción |
|------|-------|-------------|
| 401 | `UNAUTHORIZED` | Sin token |
| 401 | `INVALID_TOKEN` | Token expirado o inválido |

**Hidratación al iniciar app:**

```typescript
useEffect(() => {
  const token = localStorage.getItem('ffcore_token');
  if (!token) return setLoading(false);

  profileApi
    .getMe()
    .then(({ user }) => setUser(user))
    .catch(() => {
      localStorage.removeItem('ffcore_token');
      setUser(null);
    })
    .finally(() => setLoading(false));
}, []);
```

---

## 7. `PATCH /auth/me` — Actualizar email y/o teléfono

**No disponible para rol `admin`** → 403 `PROFILE_UPDATE_FORBIDDEN`.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**

```json
{
  "email": "nuevo@correo.com",
  "phone": "+573001234567"
}
```

| Campo | Tipo | Requerido | Reglas |
|-------|------|-----------|--------|
| `email` | string | Condicional* | Email válido, único, se guarda en minúsculas |
| `phone` | string | Condicional* | Mín. 10 dígitos, formato `+57...` recomendado |

\* Al menos **uno** de `email` o `phone` por petición.

Puedes enviar solo uno:

```json
{ "phone": "+573001234567" }
```

```json
{ "email": "nuevo@correo.com" }
```

**Response 200:**

```json
{
  "user": {
    "id": "uuid",
    "name": "Laura Martínez",
    "email": "nuevo@correo.com",
    "role": "cliente",
    "phone": "+573001234567",
    "status": "Activo"
  }
}
```

**Errores:**

| HTTP | error | Cuándo |
|------|-------|--------|
| 400 | `VALIDATION_ERROR` | Body inválido, teléfono corto, ningún campo enviado |
| 401 | `UNAUTHORIZED` | Sin token |
| 403 | `PROFILE_UPDATE_FORBIDDEN` | Rol `admin` |
| 404 | `NOT_FOUND` | Usuario no encontrado |
| 409 | `CONFLICT` | Email ya usado por otro usuario |

**Ejemplo validación (400):**

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Datos inválidos",
  "details": [
    { "field": "phone", "message": "Formato de teléfono inválido. Use +57..." }
  ]
}
```

**Ejemplo email duplicado (409):**

```json
{
  "error": "CONFLICT",
  "message": "El email ya está registrado",
  "details": [
    { "field": "email", "message": "El email ya está registrado" }
  ]
}
```

**UX — actualizar estado local tras éxito:**

```typescript
const { user } = await profileApi.updateProfile({ phone: newPhone });
setUser(user); // AuthContext
```

---

## 8. `PATCH /auth/me/password` — Cambiar contraseña

Disponible para **todos los roles**, incluido `admin`.

**Body:**

```json
{
  "current_password": "demo1234",
  "password": "NuevaClave1",
  "password_confirmation": "NuevaClave1"
}
```

| Campo | Tipo | Requerido | Reglas |
|-------|------|-----------|--------|
| `current_password` | string | Sí | Contraseña actual |
| `password` | string | Sí | Mín. 8 caracteres, 1 letra y 1 número |
| `password_confirmation` | string | Sí | Debe coincidir con `password` |

**Response 200:**

```json
{
  "user": {
    "id": "uuid",
    "name": "Super Admin",
    "email": "super@ffcore.co",
    "role": "superadmin",
    "phone": "+573001234567",
    "status": "Activo"
  },
  "message": "Contraseña actualizada correctamente"
}
```

**Errores:**

| HTTP | error | Cuándo |
|------|-------|--------|
| 400 | `VALIDATION_ERROR` | Contraseña débil, confirmación no coincide |
| 400 | `INVALID_PASSWORD` | Contraseña actual incorrecta |
| 401 | `UNAUTHORIZED` | Sin token |
| 404 | `NOT_FOUND` | Usuario no encontrado |

**Ejemplo contraseña actual incorrecta (400):**

```json
{
  "error": "INVALID_PASSWORD",
  "message": "La contraseña actual es incorrecta",
  "details": [
    { "field": "current_password", "message": "La contraseña actual es incorrecta" }
  ]
}
```

> **Nota:** Los usuarios demo usan password `demo` (4 caracteres). Para **cambiar** contraseña la nueva debe cumplir mín. 8 caracteres. Ejemplo válido: `demo1234`.

---

## 9. Flujo por pantalla del frontend

### Mi cuenta

```
GET /auth/me  →  mostrar nombre, email, teléfono, rol
```

### Configuración — Admin restaurante

```
Solo PATCH /auth/me/password
Ocultar o deshabilitar campos email/teléfono
Si intenta PATCH /auth/me → mostrar mensaje del 403
```

### Configuración — Cliente / Domiciliario / Superadmin

```
Al guardar:
  1. Si cambió email o teléfono → PATCH /auth/me
  2. Si cambió contraseña      → PATCH /auth/me/password
```

Pueden ejecutarse en la misma acción “Guardar” si el usuario modificó ambos:

```typescript
async function handleSaveSettings(form: SettingsForm) {
  const errors: Record<string, string> = {};

  if (user.role !== 'admin' && (form.email !== user.email || form.phone !== user.phone)) {
    try {
      const res = await profileApi.updateProfile({
        ...(form.email !== user.email && { email: form.email }),
        ...(form.phone !== user.phone && { phone: form.phone }),
      });
      setUser(res.user);
    } catch (err) {
      Object.assign(errors, mapApiErrorToForm(err));
    }
  }

  if (form.password) {
    try {
      await profileApi.changePassword({
        current_password: form.current_password,
        password: form.password,
        password_confirmation: form.password_confirmation,
      });
    } catch (err) {
      Object.assign(errors, mapApiErrorToForm(err));
    }
  }

  if (Object.keys(errors).length) throw errors;
}
```

---

## 10. Helper errores en formularios

```typescript
import { ApiError } from '@/lib/api/client';

export function mapApiErrorToForm(error: unknown): Record<string, string> {
  if (error instanceof ApiError) {
    if (error.code === 'PROFILE_UPDATE_FORBIDDEN') {
      return { _form: 'Los administradores solo pueden cambiar su contraseña.' };
    }
    if (error.details?.length) {
      return Object.fromEntries(error.details.map((d) => [d.field, d.message]));
    }
    return { _form: error.message };
  }
  return { _form: 'Error inesperado. Intenta de nuevo.' };
}
```

---

## 11. Validaciones frontend (alineadas con backend)

```typescript
const passwordRules = {
  minLength: 8,
  pattern: /^(?=.*[a-zA-Z])(?=.*\d).+$/,
  message: 'Mín. 8 caracteres, al menos una letra y un número',
};

const phoneRules = {
  minLength: 10,
  pattern: /^\+?57|\d{10,}/,
  message: 'Formato inválido. Use +57...',
};
```

---

## 12. Usuarios demo para probar

| Email | Rol | Password | PATCH /me | PATCH /password |
|-------|-----|----------|-----------|-----------------|
| `cliente@ffcore.co` | cliente | `demo` | Sí | Sí* |
| `domi@ffcore.co` | domiciliario | `demo` | Sí | Sí* |
| `super@ffcore.co` | superadmin | `demo` | Sí | Sí* |
| `admin@ffcore.co` | admin | `demo` | 403 | Sí* |

\* Nueva contraseña debe tener mín. 8 caracteres (ej. `demo1234`).

---

## 13. Pruebas cURL / PowerShell

### Leer perfil

```powershell
$h = @{ Authorization = "Bearer TU_TOKEN" }
Invoke-RestMethod "http://localhost:3000/api/v1/auth/me" -Headers $h
```

### Actualizar teléfono

```powershell
$h = @{
  Authorization = "Bearer TU_TOKEN"
  "Content-Type" = "application/json"
}
Invoke-RestMethod -Method PATCH -Uri "http://localhost:3000/api/v1/auth/me" `
  -Headers $h -Body '{"phone":"+573001234567"}'
```

### Cambiar contraseña

```powershell
Invoke-RestMethod -Method PATCH -Uri "http://localhost:3000/api/v1/auth/me/password" `
  -Headers $h -Body '{
    "current_password": "demo1234",
    "password": "OtraClave9",
    "password_confirmation": "OtraClave9"
  }'
```

### Admin intenta actualizar perfil (403 esperado)

```powershell
# Login admin → PATCH /auth/me
# Respuesta: PROFILE_UPDATE_FORBIDDEN
```

---

## 14. Producción (Render)

Los endpoints están en el código del backend. Para que funcionen en:

```
https://ffcore-api.onrender.com/api/v1
```

1. Commit y push a `main`
2. Render redeploy automático
3. Probar: `GET /auth/me` con token de producción

Si el front recibe **404** en `PATCH /auth/me`, el deploy en Render aún no incluye estos cambios.

---

## 15. Checklist integración frontend

- [ ] `profileApi` en `lib/api/endpoints/profile.ts`
- [ ] Mi cuenta usa `GET /auth/me`
- [ ] Configuración cliente/domi/superadmin: `PATCH /auth/me` + `PATCH /auth/me/password`
- [ ] Configuración admin: solo contraseña, sin campos email/teléfono editables
- [ ] Manejo `PROFILE_UPDATE_FORBIDDEN` (403)
- [ ] Manejo `INVALID_PASSWORD` en campo `current_password`
- [ ] Manejo `CONFLICT` en campo `email`
- [ ] Tras `updateProfile`, actualizar `user` en AuthContext
- [ ] Validación contraseña nueva: mín. 8 chars + letra + número

---

## 16. Mapa de archivos backend (referencia)

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/adapters/http/routes/authRoutes.ts` | Rutas `/me` y `/me/password` |
| `src/adapters/http/dto/schemas.ts` | `updateProfileSchema`, `changePasswordSchema` |
| `src/application/use-cases/auth/UpdateProfileUseCase.ts` | Lógica actualización perfil |
| `src/application/use-cases/auth/ChangePasswordUseCase.ts` | Lógica cambio contraseña |
| `src/adapters/http/controllers/authController.ts` | Controllers HTTP |
