# FFCore API — Fase 2: Documentación para Frontend (Superadmin)

Guía para consumir los endpoints de **Dashboard** y **Seguimiento logístico** desde React/Vite.

Complementa: [`API-FRONTEND-INTEGRACION.md`](./API-FRONTEND-INTEGRACION.md) (Fase 1: auth, usuarios, aprobaciones).

---

## 1. Configuración base

### URLs

| Entorno | `VITE_API_URL` |
|---------|----------------|
| Local | `http://localhost:3000/api/v1` |
| Producción (Render) | `https://ffcore-api.onrender.com/api/v1` |

### Autenticación obligatoria

**Todos** los endpoints de Fase 2 requieren:

```
Authorization: Bearer {token}
```

Solo el rol **`superadmin`** puede acceder. Usuario demo:

| Email | Password |
|-------|----------|
| `super@ffcore.co` | `demo` |

### Errores comunes

| HTTP | error | Cuándo |
|------|-------|--------|
| 401 | `UNAUTHORIZED` | Sin token |
| 401 | `INVALID_TOKEN` | Token expirado o inválido |
| 403 | `FORBIDDEN` | Rol distinto de `superadmin` |
| 400 | `VALIDATION_ERROR` | Query `status` inválido en `/orders` |

Formato de error (igual que Fase 1):

```json
{
  "error": "FORBIDDEN",
  "message": "No tienes permiso para realizar esta acción"
}
```

---

## 2. Resumen de endpoints

| Método | Ruta | Panel / módulo |
|--------|------|----------------|
| `GET` | `/metrics/dashboard` | Tarjeta “Ventas hoy” + comparación |
| `GET` | `/system/status` | Widget “Estado del sistema” |
| `GET` | `/orders` | Listado pedidos activos |
| `GET` | `/orders?status=En Camino` | Entregas en ruta |
| `GET` | `/couriers/active` | Domiciliarios disponibles / en ruta |
| `GET` | `/metrics/operations` | KPIs módulo Seguimiento |

Prefijo completo: `{VITE_API_URL}` → ej. `https://ffcore-api.onrender.com/api/v1`

---

## 3. Tipos TypeScript (frontend)

Copiar a `src/lib/api/types/operations.ts`:

```typescript
export type OrderStatus =
  | 'Pendiente'
  | 'Preparando'
  | 'En Camino'
  | 'Entregado'
  | 'Cancelado';

export type CourierAvailability = 'disponible' | 'en_ruta' | 'offline';

export type ServiceHealthStatus = 'operational' | 'degraded' | 'down';

export interface DashboardMetrics {
  sales_today_cop: number;
  sales_yesterday_cop: number;
  sales_delta_percent: number;
  orders_today: number;
  active_couriers: number;
  active_restaurants: number;
}

export interface SystemServiceStatus {
  name: string;
  status: ServiceHealthStatus;
  latency_ms: number;
}

export interface SystemStatus {
  overall: ServiceHealthStatus;
  services: SystemServiceStatus[];
}

export interface OrderSummary {
  id: string;
  order_number: string;
  status: OrderStatus;
  restaurant_name: string;
  customer_name: string;
  courier_name: string | null;
  total_cop: number;
  created_at: string;
  estimated_delivery_at: string | null;
}

export interface ActiveCourier {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  vehicle: string | null;
  availability: CourierAvailability;
  active_orders: number;
}

export interface OperationsMetrics {
  orders_in_progress: number;
  orders_en_camino: number;
  orders_pendientes_asignacion: number;
  avg_delivery_minutes: number;
  couriers_available: number;
  couriers_en_ruta: number;
}
```

---

## 4. Cliente HTTP — módulo `operationsApi`

Reutiliza el cliente de Fase 1 (`lib/api/client.ts` con `api<T>()` y `Authorization` automático).

```typescript
// lib/api/endpoints/operations.ts
import { api } from '../client';
import type {
  DashboardMetrics,
  SystemStatus,
  OrderSummary,
  ActiveCourier,
  OperationsMetrics,
  OrderStatus,
} from '../types/operations';

export const operationsApi = {
  getDashboardMetrics: () =>
    api<{ data: DashboardMetrics }>('/metrics/dashboard'),

  getSystemStatus: () =>
    api<{ data: SystemStatus }>('/system/status'),

  listOrders: (status?: OrderStatus) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return api<{ data: OrderSummary[] }>(`/orders${qs}`);
  },

  listActiveCouriers: () =>
    api<{ data: ActiveCourier[] }>('/couriers/active'),

  getOperationsMetrics: () =>
    api<{ data: OperationsMetrics }>('/metrics/operations'),
};
```

---

## 5. Endpoints — contratos completos

### 5.1 `GET /metrics/dashboard`

Tarjeta principal del dashboard superadmin: ventas del día, variación vs ayer, contadores operativos.

| | |
|---|---|
| Auth | JWT + `superadmin` |
| Query | Ninguno |

**Response 200:**

```json
{
  "data": {
    "sales_today_cop": 1250000,
    "sales_yesterday_cop": 1116000,
    "sales_delta_percent": 12,
    "orders_today": 47,
    "active_couriers": 1,
    "active_restaurants": 1
  }
}
```

| Campo | Tipo | Descripción | Origen |
|-------|------|-------------|--------|
| `sales_today_cop` | number | Ventas hoy en COP (sin decimales) | Demo Fase 2 |
| `sales_yesterday_cop` | number | Ventas ayer en COP | Demo Fase 2 |
| `sales_delta_percent` | number | Variación % vs ayer (ej. `12` = +12%) | Calculado |
| `orders_today` | number | Total pedidos del día | Demo Fase 2 |
| `active_couriers` | number | Domiciliarios con status `Activo` | BD real |
| `active_restaurants` | number | Restaurantes con status `Activo` | BD real |

**UX sugerida en el front:**

```typescript
const { data } = await operationsApi.getDashboardMetrics();

// Tarjeta ventas
const formatted = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
}).format(data.sales_today_cop);

// Badge variación
const sign = data.sales_delta_percent >= 0 ? '+' : '';
const badge = `${sign}${data.sales_delta_percent}% vs ayer`;
```

---

### 5.2 `GET /system/status`

Widget de salud de servicios externos (pedidos, pagos, push, mapas).

| | |
|---|---|
| Auth | JWT + `superadmin` |
| Query | Ninguno |

**Response 200:**

```json
{
  "data": {
    "overall": "degraded",
    "services": [
      { "name": "API Pedidos", "status": "operational", "latency_ms": 45 },
      { "name": "Pagos", "status": "operational", "latency_ms": 120 },
      { "name": "Push", "status": "degraded", "latency_ms": 200 },
      { "name": "Mapas", "status": "operational", "latency_ms": 80 }
    ]
  }
}
```

| Campo `status` / `overall` | Significado UI |
|------------------------------|----------------|
| `operational` | Verde — OK |
| `degraded` | Amarillo — lento o parcial |
| `down` | Rojo — caído |

**Mapeo de colores (ejemplo):**

```typescript
const STATUS_COLORS: Record<ServiceHealthStatus, string> = {
  operational: 'text-green-600',
  degraded: 'text-yellow-600',
  down: 'text-red-600',
};
```

---

### 5.3 `GET /orders`

Listado de pedidos. Sin query devuelve solo **activos** (excluye `Entregado` y `Cancelado`).

| | |
|---|---|
| Auth | JWT + `superadmin` |
| Query | `status` (opcional) |

**Query `status` — valores exactos (case-sensitive):**

| Valor | Uso |
|-------|-----|
| `Pendiente` | Sin asignar domiciliario |
| `Preparando` | En cocina |
| `En Camino` | En ruta (usar `encodeURIComponent`) |
| `Entregado` | Histórico |
| `Cancelado` | Cancelados |

Ejemplos:

```
GET /orders
GET /orders?status=En%20Camino
GET /orders?status=Preparando
```

**Response 200 (sin filtro — pedidos activos):**

```json
{
  "data": [
    {
      "id": "ord-004",
      "order_number": "FF-1039",
      "status": "Pendiente",
      "restaurant_name": "FFCore",
      "customer_name": "Carlos Díaz",
      "courier_name": null,
      "total_cop": 51000,
      "created_at": "2026-07-09T00:50:36.199Z",
      "estimated_delivery_at": null
    },
    {
      "id": "ord-001",
      "order_number": "FF-1042",
      "status": "En Camino",
      "restaurant_name": "FFCore",
      "customer_name": "Laura Martínez",
      "courier_name": "Sebastián Domínguez",
      "total_cop": 45000,
      "created_at": "2026-07-08T23:50:36.198Z",
      "estimated_delivery_at": "2026-07-09T01:20:36.199Z"
    }
  ]
}
```

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | string | ID interno del pedido |
| `order_number` | string | Número visible (ej. `FF-1042`) |
| `status` | OrderStatus | Estado actual |
| `restaurant_name` | string | Nombre del restaurante |
| `customer_name` | string | Cliente |
| `courier_name` | string \| null | `null` si no hay domiciliario asignado |
| `total_cop` | number | Total en pesos colombianos |
| `created_at` | string | ISO 8601 UTC |
| `estimated_delivery_at` | string \| null | ETA estimada; `null` si no aplica |

**Orden:** más recientes primero (`created_at` desc).

> **Fase 2 actual:** los pedidos son **datos demo** en backend. El contrato JSON no cambiará cuando exista BD real.

---

### 5.4 `GET /couriers/active`

Domiciliarios con status `Activo` en BD, enriquecidos con disponibilidad operativa.

| | |
|---|---|
| Auth | JWT + `superadmin` |
| Query | Ninguno |

**Response 200:**

```json
{
  "data": [
    {
      "id": "2e4a69fb-945b-4f4a-86d9-90b0500fc4d7",
      "name": "Sebastián Domínguez",
      "email": "domi@ffcore.co",
      "phone": "+57 320 555 0301",
      "vehicle": "Moto AKT — PLA-23H",
      "availability": "en_ruta",
      "active_orders": 2
    }
  ]
}
```

| Campo `availability` | UI sugerida |
|----------------------|-------------|
| `disponible` | Badge verde — puede recibir pedido |
| `en_ruta` | Badge azul — entregando |
| `offline` | Badge gris — no disponible |

| Campo | Descripción |
|-------|-------------|
| `active_orders` | Pedidos en estado `En Camino` asignados a ese domiciliario |

---

### 5.5 `GET /metrics/operations`

KPIs del módulo **Seguimiento logístico**.

| | |
|---|---|
| Auth | JWT + `superadmin` |
| Query | Ninguno |

**Response 200:**

```json
{
  "data": {
    "orders_in_progress": 5,
    "orders_en_camino": 2,
    "orders_pendientes_asignacion": 1,
    "avg_delivery_minutes": 28,
    "couriers_available": 0,
    "couriers_en_ruta": 1
  }
}
```

| Campo | Descripción |
|-------|-------------|
| `orders_in_progress` | Pedidos activos (Pendiente + Preparando + En Camino) |
| `orders_en_camino` | Solo en ruta |
| `orders_pendientes_asignacion` | Pendientes sin `courier_name` |
| `avg_delivery_minutes` | Promedio tiempo de entrega (demo) |
| `couriers_available` | Con `availability: disponible` |
| `couriers_en_ruta` | Con `availability: en_ruta` |

---

## 6. Integración por pantalla del front

### Dashboard superadmin (`/superadmin`)

Al montar la página, cargar en paralelo:

```typescript
const [dashboard, system] = await Promise.all([
  operationsApi.getDashboardMetrics(),
  operationsApi.getSystemStatus(),
]);

// Reemplazar mocks:
setSalesToday(dashboard.data);
setSystemHealth(system.data);
```

**Loading:** mostrar skeleton en tarjetas hasta que ambos respondan.

**Cold start Render:** si tarda >30s, mostrar “Conectando con el servidor…”.

---

### Módulo Seguimiento (`/superadmin/seguimiento` o similar)

```typescript
const [orders, couriers, metrics] = await Promise.all([
  operationsApi.listOrders(),                    // todos los activos
  operationsApi.listActiveCouriers(),
  operationsApi.getOperationsMetrics(),
]);

// Tab “En ruta”
const enRuta = await operationsApi.listOrders('En Camino');
```

**Filtros UI → API:**

| Filtro en UI | Llamada |
|--------------|---------|
| Todos activos | `listOrders()` |
| En camino | `listOrders('En Camino')` |
| Preparando | `listOrders('Preparando')` |
| Pendientes | `listOrders('Pendiente')` |

---

## 7. Hook React de ejemplo

```typescript
// hooks/useSuperadminDashboard.ts
import { useEffect, useState } from 'react';
import { operationsApi } from '@/lib/api/endpoints/operations';
import type { DashboardMetrics, SystemStatus } from '@/lib/api/types/operations';
import { ApiError } from '@/lib/api/client';

export function useSuperadminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [system, setSystem] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [dashboardRes, systemRes] = await Promise.all([
          operationsApi.getDashboardMetrics(),
          operationsApi.getSystemStatus(),
        ]);
        if (!cancelled) {
          setMetrics(dashboardRes.data);
          setSystem(systemRes.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Error al cargar dashboard');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return { metrics, system, loading, error };
}
```

---

## 8. Protección de rutas

Solo `superadmin` debe ver estas pantallas:

```typescript
// Si user.role !== 'superadmin' → redirect a /login o /403
if (user?.role !== 'superadmin') {
  navigate('/login');
  return;
}
```

Si un `cliente` o `admin` llama estos endpoints → **403 FORBIDDEN**.

---

## 9. Formateo de moneda y fechas

```typescript
// COP sin decimales
export function formatCop(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Fecha relativa para pedidos
export function formatOrderTime(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso));
}
```

---

## 10. Checklist integración frontend

- [ ] `operationsApi` creado en `lib/api/endpoints/operations.ts`
- [ ] Tipos en `lib/api/types/operations.ts`
- [ ] Dashboard: reemplazar mocks por `getDashboardMetrics` + `getSystemStatus`
- [ ] Seguimiento: reemplazar mocks por `listOrders`, `listActiveCouriers`, `getOperationsMetrics`
- [ ] Filtro “En Camino” usa `encodeURIComponent('En Camino')`
- [ ] Rutas `/superadmin/*` protegidas por rol
- [ ] Manejo 401 → logout; 403 → página sin permiso
- [ ] `VITE_API_URL` apunta a Render en producción
- [ ] Login con `super@ffcore.co` / `demo` para probar

---

## 11. Pruebas rápidas

### Local (PowerShell)

```powershell
$login = Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/v1/auth/login" `
  -ContentType "application/json" -Body '{"email":"super@ffcore.co","password":"demo"}'

$h = @{ Authorization = "Bearer $($login.token)" }

Invoke-RestMethod "http://localhost:3000/api/v1/metrics/dashboard" -Headers $h
Invoke-RestMethod "http://localhost:3000/api/v1/system/status" -Headers $h
Invoke-RestMethod "http://localhost:3000/api/v1/orders" -Headers $h
Invoke-RestMethod "http://localhost:3000/api/v1/orders?status=En%20Camino" -Headers $h
Invoke-RestMethod "http://localhost:3000/api/v1/couriers/active" -Headers $h
Invoke-RestMethod "http://localhost:3000/api/v1/metrics/operations" -Headers $h
```

### Producción

Cambiar base a `https://ffcore-api.onrender.com/api/v1`.

---

## 12. Qué es real vs demo (importante)

| Dato | Fuente actual |
|------|----------------|
| `active_couriers`, `active_restaurants` | PostgreSQL (real) |
| Lista domiciliarios (`id`, `email`, `phone`, `vehicle`) | PostgreSQL (real) |
| Ventas, `orders_today` | Demo backend |
| Listado `/orders` | Demo backend |
| KPIs `avg_delivery_minutes`, contadores de pedidos | Derivados del demo |
| `system/status` | Demo backend |

Cuando exista el módulo de pedidos en BD, el frontend **no debe cambiar** contratos JSON; solo mejorarán los datos.

---

## 13. Relación con Fase 1

| Fase 1 (ya integrado) | Fase 2 (este doc) |
|------------------------|-------------------|
| `POST /auth/login` | Mismo token para Fase 2 |
| `GET /users/pending` | Panel aprobaciones |
| `PATCH /users/:id/approve` | Aprobaciones |
| `GET /metrics/dashboard` | Dashboard ventas |
| `GET /orders` | Seguimiento logístico |

**Flujo completo superadmin:**

```
Login → /superadmin
  ├── Dashboard     → /metrics/dashboard + /system/status
  ├── Aprobaciones  → /users/pending (Fase 1)
  └── Seguimiento   → /orders + /couriers/active + /metrics/operations
```
