# FFCore API — Panel Admin Restaurante

Documentación para integrar el panel **Centro de cocina** (`/admin`). Todos los endpoints usan `snake_case` en request/response.

---

## Configuración base

| Concepto | Valor |
|----------|-------|
| **Base URL producción** | `https://ffcore-api.onrender.com/api/v1` |
| **Base URL local** | `http://localhost:3000/api/v1` |
| **Auth** | `Authorization: Bearer {token}` |
| **Content-Type** | `application/json` (excepto uploads: `multipart/form-data`) |

### Flujo de autenticación

```http
POST /auth/login
{ "email": "admin@ffcore.co", "password": "demo" }
```

```http
GET /auth/me
Authorization: Bearer {token}
```

Respuesta clave de `/auth/me`:

```json
{
  "id": "uuid",
  "name": "Carlos Restrepo",
  "email": "admin@ffcore.co",
  "role": "admin",
  "restaurant_id": "rest-ffcore"
}
```

> El `restaurant_id` viene de la BD (no del JWT). Guárdalo en el store del panel para construir todas las rutas.

### Control de acceso

- Rol `admin`: solo puede acceder a recursos de **su** `restaurant_id`.
- Rol `superadmin`: acceso a cualquier sede.
- Respuesta 403 si el admin intenta otra sede.

---

## WebSocket (tiempo real)

Conectar al mismo host que la API (sin `/api/v1`):

```
wss://ffcore-api.onrender.com   (producción)
ws://localhost:3000             (local)
```

### Unirse a la sala del restaurante

```javascript
import { io } from 'socket.io-client';

const socket = io(VITE_API_URL.replace('/api/v1', ''), { transports: ['websocket'] });

socket.emit('join_restaurant', restaurantId);
```

### Eventos

| Evento | Cuándo | Payload |
|--------|--------|---------|
| `new_order` | Se crea un pedido | Objeto orden (formato Kanban) |
| `order_status_changed` | Cambio de estado, asignación o despacho | Objeto orden o array de órdenes |

---

## Fase 0 — Contexto del restaurante

### GET `/restaurants/:restaurantId`

Perfil de la sede.

**Auth:** admin (de esa sede) o superadmin

```json
{
  "id": "rest-ffcore",
  "name": "FFCore",
  "tagline": "Hamburguesas de autor",
  "city": "Medellín · El Poblado",
  "address": "Calle 10 #43-28",
  "delivery_minutes": 25,
  "monthly_goal": 18000000,
  "accent": "#4f46e5",
  "initials": "FC",
  "rating": 4.8,
  "status": "Activo"
}
```

### PATCH `/restaurants/:restaurantId`

Actualizar datos de la sede.

```json
{
  "name": "FFCore",
  "tagline": "Nuevo eslogan",
  "city": "Medellín",
  "address": "Calle 10 #43-28",
  "delivery_minutes": 30,
  "monthly_goal": 20000000,
  "accent": "#4f46e5"
}
```

---

## 1. Dashboard

### GET `/restaurants/:restaurantId/dashboard`

```json
{
  "sales_today": 485000,
  "orders_today": 12,
  "monthly_sales": 12450000,
  "monthly_goal": 18000000,
  "goal_progress_percent": 69.2,
  "sales_by_category": [
    {
      "category_id": "uuid",
      "category_name": "Platos principales",
      "image": "https://...",
      "total": 8200000
    }
  ],
  "top_products": [
    {
      "product_id": "uuid",
      "name": "Monster Bacon",
      "quantity_sold": 48,
      "revenue": 1195200
    }
  ],
  "active_promotions_count": 2,
  "average_rating": 4.6,
  "review_count": 128
}
```

### GET `/restaurants/:restaurantId/reviews?limit=10&offset=0`

```json
{
  "data": [
    {
      "id": "uuid",
      "rating": 5,
      "comment": "Excelente",
      "customer_name": "Ana Gómez",
      "created_at": "2026-07-09T17:00:00.000Z"
    }
  ],
  "total": 3,
  "limit": 10,
  "offset": 0
}
```

---

## 2. Reportes de ventas

### GET `/restaurants/:restaurantId/reports/sales`

Query: `preset=today|week|month|year|custom` + `from`/`to` (ISO `YYYY-MM-DD`) si `preset=custom`

```json
{
  "period": { "from": "2026-07-01", "to": "2026-07-31" },
  "gross_sales": 18500000,
  "courier_payout": 2100000,
  "delivered_orders": 342,
  "net_profit": 16400000,
  "app_commissions": 925000,
  "real_net_profit": 15475000,
  "margin_percent": 83.6
}
```

> `app_commissions` = 5% del bruto. `real_net_profit` = neto − comisiones.

### GET `/restaurants/:restaurantId/reports/sales/monthly?year=2026`

```json
{
  "year": 2026,
  "data": [
    { "month": 1, "label": "Ene", "gross_sales": 0, "orders": 0 },
    { "month": 7, "label": "Jul", "gross_sales": 109700, "orders": 2 }
  ]
}
```

### GET `/restaurants/:restaurantId/reports/courier-payouts?from=2026-07-01&to=2026-07-31`

```json
{
  "data": [
    {
      "courier_id": "uuid",
      "courier_name": "Sebastián Domínguez",
      "orders_delivered": 15,
      "total_payout": 90000
    }
  ]
}
```

### GET `/restaurants/:restaurantId/reports/sales/export?from=2026-07-01&to=2026-07-31`

Devuelve archivo CSV (`Content-Type: text/csv`).

---

## 3. Monitor de comandas

### Estados válidos

`Recibido` → `EnPreparacion` → `Listo` → `EnCamino` → `Entregado`

> El frontend muestra "En Cocina" = backend `EnPreparacion`.

### GET `/orders/restaurant/:restaurantId?status=Recibido,EnPreparacion,Listo`

Filtro por estados separados por coma.

**Respuesta (ítem):**

```json
{
  "id": "PED-101",
  "order_id": "uuid-interno",
  "customer_name": "Juan Pablo Montoya",
  "address": "Calle 15 #11-45",
  "phone": "+573155550544",
  "notes": "Torre B",
  "zone": "El Poblado",
  "status": "EnPreparacion",
  "total": 52700,
  "delivery_fee": 5000,
  "courier_id": null,
  "items": [
    {
      "line_id": "uuid",
      "product_id": "uuid",
      "product_name": "La Paisa Smash",
      "quantity": 1,
      "unit_price": 32700,
      "customizations": {
        "removed_ingredients": ["Cebolla grillé"],
        "added_modifiers": { "Adiciones": ["Tocino crujiente"] },
        "extra_price": 4200
      }
    }
  ],
  "received_at": "2026-07-09T17:00:00.000Z",
  "status_entered_at": "2026-07-09T17:05:00.000Z"
}
```

### PATCH `/orders/:id/status`

```json
{ "status": "EnPreparacion" }
```

### PATCH `/orders/:id/assign`

Asigna domiciliario **sin cambiar estado** (permanece `Listo`).

```json
{ "courier_id": "uuid-domiciliario" }
```

### PATCH `/orders/batch/assign`

```json
{
  "order_ids": ["uuid1", "uuid2"],
  "courier_id": "uuid-domiciliario"
}
```

### PATCH `/orders/batch/dispatch`

Despacha pedidos en estado `Listo` con domiciliario asignado → `EnCamino`. Crea registro en historial de despachos.

```json
{
  "order_ids": ["uuid1", "uuid2"],
  "restaurant_id": "rest-ffcore"
}
```

### GET `/restaurants/:restaurantId/couriers/available?batch_size=3`

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Sebastián Domínguez",
      "vehicle": "Moto AKT — PLA-23H",
      "average_rating": 4.8,
      "active_orders": 1,
      "can_take_batch": true
    }
  ]
}
```

---

## 4. Gestor de menú

### 4.1 Categorías

#### GET `/restaurants/:restaurantId/categories`

```json
[
  {
    "id": "uuid",
    "name": "Platos principales",
    "position": 1,
    "image": "https://...",
    "restaurant_id": "rest-ffcore",
    "product_count": 2
  }
]
```

#### POST `/restaurants/:restaurantId/categories`

```json
{
  "name": "Entradas",
  "position": 0,
  "image": "https://cdn.ffcore.co/categories/entradas.jpg"
}
```

#### PATCH `/categories/:categoryId`

#### DELETE `/categories/:categoryId`

> 409 si la categoría tiene productos.

#### POST `/categories/:categoryId/image`

`multipart/form-data` → campo `file` (jpg/png/webp, máx 5 MB)

### 4.2 Productos

#### GET `/products?restaurantId={id}&categoryId={id}&available=true`

#### GET `/products/:id`

```json
{
  "id": "uuid",
  "name": "Monster Bacon",
  "price": 24900,
  "category_id": "uuid",
  "category_name": "Platos principales",
  "description": "...",
  "image": "https://...",
  "available": true,
  "restaurant_id": "rest-ffcore",
  "ingredients": [
    { "id": "uuid", "name": "Cebolla grillé", "available": true }
  ],
  "modifier_groups": [
    {
      "id": "uuid",
      "name": "Adiciones",
      "min_selections": 0,
      "max_selections": 3,
      "options": [
        { "id": "uuid", "name": "Tocino crujiente", "price_extra": 4200, "available": true }
      ]
    }
  ]
}
```

#### POST `/products`

```json
{
  "name": "Monster Bacon",
  "description": "Doble carne premium...",
  "price": 24900,
  "category_id": "uuid",
  "restaurant_id": "rest-ffcore",
  "image": "https://...",
  "available": true
}
```

#### PATCH `/products/:id`

#### PATCH `/products/:id/availability` — toggle

#### DELETE `/products/:id`

#### POST `/products/:id/image` — multipart, campo `file`

### 4.3 Receta / personalización

#### PUT `/products/:id/ingredients`

```json
{
  "ingredients": [
    { "name": "Pan Brioche", "available": true },
    { "name": "Cebolla grillé", "available": true }
  ]
}
```

#### PUT `/products/:id/modifier-groups`

```json
{
  "modifier_groups": [
    {
      "name": "Adiciones",
      "min_selections": 0,
      "max_selections": 3,
      "options": [
        { "name": "Tocino crujiente", "price_extra": 4200, "available": true }
      ]
    }
  ]
}
```

### 4.4 Adiciones

Son productos con `category_id` de la categoría **Adiciones**. Usar el mismo CRUD de productos.

---

## 5. Promociones

### GET `/restaurants/:restaurantId/promotions`

### POST `/restaurants/:restaurantId/promotions`

```json
{
  "name": "2x1 Monster Bacon",
  "discount_percent": 50,
  "product_ids": ["uuid1", "uuid2"],
  "start_date": "2026-07-01",
  "end_date": "2026-12-31",
  "active": true
}
```

| Campo | Reglas |
|-------|--------|
| `discount_percent` | 1–90 |
| `product_ids` | Mín. 1; no incluir categoría Adiciones |

### GET `/promotions/:promotionId`

### PATCH `/promotions/:promotionId`

### DELETE `/promotions/:promotionId`

---

## 6. Domicilios activos

### GET `/restaurants/:restaurantId/deliveries/active`

```json
{
  "data": [
    {
      "courier_id": "uuid",
      "courier_name": "Sebastián Domínguez",
      "vehicle": "Moto AKT — PLA-23H",
      "average_rating": 4.8,
      "orders": [
        {
          "order_id": "PED-104",
          "customer_name": "Andrés Quintero",
          "address": "Cra 7 #16-21",
          "zone": "San Luis",
          "status": "EnCamino",
          "delivery_fee": 6000
        }
      ],
      "total_delivery_pay": 11000,
      "zones": ["San Luis", "Caobos"]
    }
  ]
}
```

---

## 7. Historial de despachos

### GET `/restaurants/:restaurantId/dispatches?from=2026-07-01&to=2026-07-31`

O usar `period=today|month|year` sin fechas.

```json
{
  "data": [
    {
      "order_id": "PED-105",
      "customer_name": "Diana Restrepo",
      "total": 57000,
      "delivery_fee": 5000,
      "courier_id": "uuid",
      "courier_name": "Sebastián Domínguez",
      "dispatched_at": "2026-07-09T14:30:00.000Z"
    }
  ]
}
```

### GET `/restaurants/:restaurantId/dispatches/summary?period=month`

```json
{ "today": 0, "month": 5, "year": 42 }
```

---

## 8. Upload de imágenes

### POST `/uploads/images`

`multipart/form-data` → campo `file`

```json
{
  "url": "https://ffcore-api.onrender.com/uploads/abc123.jpg",
  "width": 800,
  "height": 600
}
```

Alternativa: subir directo en `POST /categories/:id/image` o `POST /products/:id/image`.

| Recurso | Formatos | Tamaño máx |
|---------|----------|------------|
| Categoría | jpg, png, webp | 5 MB |
| Producto | jpg, png, webp | 5 MB |

> En Render, los uploads locales se pierden al reiniciar. Para producción estable, migrar a S3/Cloudinary y setear `BASE_URL`.

---

## Errores estándar

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Datos inválidos",
  "details": [{ "field": "name", "message": "..." }]
}
```

| Código HTTP | error | Significado |
|-------------|-------|-------------|
| 401 | `UNAUTHORIZED` | Sin token o token inválido |
| 403 | `FORBIDDEN` | Sin permiso o sede incorrecta |
| 404 | `NOT_FOUND` | Recurso no encontrado |
| 409 | `CONFLICT` | Nombre duplicado, categoría con productos, etc. |
| 400 | `VALIDATION_ERROR` | Body/query inválido |

---

## Credenciales demo

| Rol | Email | Password | restaurant_id |
|-----|-------|----------|---------------|
| Admin FFCore | `admin@ffcore.co` | `demo` | `rest-ffcore` |
| Domiciliario | `domi@ffcore.co` | `demo` | `rest-ffcore` |
| Superadmin | `super@ffcore.co` | `demo` | — |

---

## Orden de integración recomendado

1. Login + `/auth/me` → guardar `restaurant_id`
2. WebSocket `join_restaurant`
3. Monitor comandas (`GET orders` + `PATCH status` + batch assign/dispatch)
4. Gestor menú (categorías → productos → receta)
5. Promociones
6. Dashboard + reportes + domicilios + despachos

---

## Migración / despliegue

```bash
npx prisma migrate deploy
npx prisma db seed   # solo desarrollo
```

Migración: `20260709180000_panel_admin_restaurante`
