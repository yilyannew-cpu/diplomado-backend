# FFCore API — Flujo mínimo cliente + comandas en tiempo real

Documentación para integrar el **portal cliente** y probar el **monitor admin (Kanban)** con pedidos reales.

| Concepto | Valor |
|----------|-------|
| **Base URL producción** | `https://ffcore-api.onrender.com/api/v1` |
| **WebSocket** | `wss://ffcore-api.onrender.com` (sin `/api/v1`) |
| **Formato** | `snake_case` en request/response |

---

## Flujo crítico: pedido → Kanban admin

```
Cliente POST /orders
    → BD guarda pedido (estado Recibido)
    → WebSocket emite new_order a sala restaurant:{restaurantId}
    → Admin (con join_restaurant) ve el pedido en "Recibidos" sin refrescar
```

### Admin (monitor abierto)

```javascript
import { io } from 'socket.io-client';

const socket = io('https://ffcore-api.onrender.com', { transports: ['websocket'] });

socket.emit('join_restaurant', 'rest-ffcore');

socket.on('new_order', (order) => {
  console.log('Nuevo pedido:', order.id, order.customer_name);
});

socket.on('order_status_changed', (order) => {
  console.log('Estado actualizado:', order.id, order.status);
});
```

Login admin: `admin@ffcore.co` / `demo` → `restaurant_id: rest-ffcore`

---

## Endpoints imprescindibles (públicos)

### 1. Listar restaurantes

```http
GET /restaurants
```

Respuesta: array con `id`, `name`, `city`, `rating`, `delivery_minutes`, etc.

### 2. Catálogo de productos

```http
GET /products?restaurantId=rest-ffcore&available=true
```

### 3. Detalle producto (personalización)

```http
GET /products/prod-01
```

Para el modal de personalización del cliente **no se requieren** `ingredients` / `modifier_groups`.
Las extras se toman del catálogo del restaurante:

```http
GET /products?restaurantId=rest-ffcore&available=true
```

Filtrar por `category_name`: `Adiciones`, `Acompañamientos`, `Bebidas`.

### 4. Crear pedido

```http
POST /orders
Content-Type: application/json
```

**No requiere token.**

La personalización del plato principal usa productos del menú del mismo restaurante:

| Campo | Categoría esperada | Obligatorio |
|-------|--------------------|-------------|
| `addition_ids` | Adiciones | No |
| `side_ids` | Acompañamientos | No |
| `drink_ids` | Bebidas | No |
| `special_instructions` | Texto libre | No |

El servidor **valida** que cada ID exista, esté disponible, pertenezca al `restaurant_id` y tenga la categoría correcta. Luego **recalcula** `extra_price` (ignora el valor enviado por el cliente) y persiste nombres/precios en el JSON de la línea.

```json
{
  "customer_name": "Juan Pérez",
  "address": "Calle 15 #11-45, El Poblado",
  "phone": "+573155550544",
  "notes": "Torre B",
  "zone": "El Poblado",
  "restaurant_id": "rest-ffcore",
  "items": [
    {
      "product_id": "prod-01",
      "quantity": 1,
      "customizations": {
        "addition_ids": ["prod-10"],
        "side_ids": ["prod-05"],
        "drink_ids": ["prod-07"],
        "special_instructions": "Sin cebolla / Sin azúcar",
        "extra_price": 8500
      }
    }
  ]
}
```

**Respuesta de cada ítem** (serializer / WebSocket / track):

```json
{
  "line_id": "...",
  "product_id": "prod-01",
  "product_name": "Monster Bacon",
  "quantity": 1,
  "unit_price": 33600,
  "customizations": {
    "addition_ids": ["prod-10"],
    "side_ids": ["prod-05"],
    "drink_ids": ["prod-07"],
    "additions": [{ "product_id": "prod-10", "name": "Tocino crujiente", "price": 4200 }],
    "sides": [{ "product_id": "prod-05", "name": "Papas Rústicas", "price": 8000 }],
    "drinks": [{ "product_id": "prod-07", "name": "Limonada", "price": 5000 }],
    "special_instructions": "Sin cebolla / Sin azúcar",
    "extra_price": 17200
  }
}
```

Endpoints que reflejan el mismo shape (sin cambio de ruta):

- `GET /orders/track/:code`
- `GET /orders/restaurant/:restaurantId`
- WebSocket `new_order` / `order_status_changed`

`GET /products?restaurantId=` no cambia: el cliente filtra por `category_name` (`Adiciones`, `Acompañamientos`, `Bebidas`).

**IDs de producto en seed (rest-ffcore):**

| ID | Producto |
|----|----------|
| `prod-01` | Monster Bacon |
| `prod-02` | La Paisa Smash |
| `prod-05` | Papas Rústicas |
| `prod-09` | Queso cheddar extra |
| `prod-10` | Tocino crujiente |

> Si Neon no tiene seed, ejecuta `npx prisma db seed` o copia IDs reales de `GET /products`.

**Respuesta 201** (ejemplo):

```json
{
  "id": "PED-103",
  "order_id": "uuid-interno",
  "customer_name": "Juan Pérez",
  "status": "Recibido",
  "total": 33600,
  "delivery_fee": 5000,
  "items": [...]
}
```

---

## Auth cliente (opcional para checkout)

| Endpoint | Uso |
|----------|-----|
| `POST /auth/login` | Entrar como cliente |
| `POST /auth/register/client` | Registro |
| `GET /auth/me` | Perfil (prellenar checkout) |

Credenciales demo: `cliente@ffcore.co` / `demo`

`POST /orders` **no exige login** — puedes probar comandas sin autenticación.

---

## Endpoints públicos adicionales

### Categorías (agrupar menú en UI)

```http
GET /restaurants/rest-ffcore/categories
```

### Promociones activas (pestaña Promociones cliente)

```http
GET /restaurants/rest-ffcore/promotions/active
```

Solo promos con `active: true` y vigentes por fecha.

### Reseñas

```http
GET /restaurants/rest-ffcore/reviews?limit=10&offset=0
```

```http
POST /restaurants/rest-ffcore/reviews
Content-Type: application/json

{
  "rating": 5,
  "comment": "Excelente",
  "customer_name": "María López"
}
```

### Seguimiento de pedido (Tracking)

```http
GET /orders/track/PED-103
```

Respuesta: mismo formato que el pedido en Kanban (`status`, `items`, `total`, etc.).

**WebSocket tracking en tiempo real:**

```javascript
// Tras crear el pedido, unirse a la sala del código
socket.emit('join_order', 'PED-103');

socket.on('order_status_changed', (order) => {
  if (order.id === 'PED-103') {
    // Actualizar UI de tracking
  }
});
```

---

## Prueba rápida (Postman / curl)

1. Abre el monitor admin (`/admin`) con WebSocket conectado a `rest-ffcore`.
2. Obtén productos:
   ```bash
   curl "https://ffcore-api.onrender.com/api/v1/products?restaurantId=rest-ffcore&available=true"
   ```
3. Crea pedido (usa un `product_id` del paso anterior):
   ```bash
   curl -X POST "https://ffcore-api.onrender.com/api/v1/orders" \
     -H "Content-Type: application/json" \
     -d '{
       "customer_name": "Test Cliente",
       "address": "Calle 10 #20-30",
       "phone": "+573001234567",
       "restaurant_id": "rest-ffcore",
       "items": [{ "product_id": "prod-01", "quantity": 1 }]
     }'
   ```
4. El pedido aparece al instante en **Recibidos** del Kanban.
5. Seguimiento:
   ```bash
   curl "https://ffcore-api.onrender.com/api/v1/orders/track/PED-XXX"
   ```

---

## Qué prueba cada módulo admin

| Módulo admin | Acción cliente | Endpoint |
|--------------|----------------|----------|
| Comandas (Kanban) | Crear pedido | `POST /orders` + WS `new_order` |
| Dashboard / ventas | Pedidos entregados | Flujo admin/domiciliario |
| Menú | Pedir productos reales | `GET /products`, `GET /products/:id` |
| Promociones | Ver descuentos | `GET /restaurants/:id/promotions/active` |
| Reseñas | Dejar reseña | `POST /restaurants/:id/reviews` |
| Rankin | Ver rating | `GET /restaurants` |

---

## Orden recomendado de integración en frontend

1. `GET /restaurants` → selector de sede
2. `GET /products?restaurantId=...&available=true` → catálogo
3. `GET /products/:id` → modal personalización
4. `POST /orders` → confirmar carrito
5. `GET /orders/track/:code` + `join_order` → tracking
6. `GET /promotions/active` → pestaña promos

---

## WebSocket — resumen eventos

| Evento | Dirección | Sala | Cuándo |
|--------|-----------|------|--------|
| `join_restaurant` | Cliente → servidor | `restaurant:{id}` | Admin monitor |
| `join_order` | Cliente → servidor | `order:{code}` | Tracking cliente |
| `new_order` | Servidor → clientes | restaurant + order | Tras `POST /orders` |
| `order_status_changed` | Servidor → clientes | restaurant + order | Cambio estado/asignación |

---

## Notas producción

- **Seed:** Si la BD está vacía, corre `npx prisma db seed` contra Neon (solo demo).
- **Uploads:** Imágenes en `/uploads` en Render Free no persisten tras reinicio.
- **Domicilio:** `delivery_fee` fijo **5000** en creación de pedido.
