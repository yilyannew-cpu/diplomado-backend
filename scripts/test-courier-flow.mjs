/**
 * Prueba local del flujo domiciliario:
 * available → accept → start-delivery → complete
 */
const API = process.env.API_URL ?? 'http://127.0.0.1:3000/api/v1';

async function req(path, opts = {}) {
  const headers = { Accept: 'application/json' };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }
  return { status: res.status, data, ok: res.ok };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  console.log(`API: ${API}\n`);

  const health = await req('/health');
  assert(health.ok, `Health falló: ${health.status}`);
  console.log('✓ health');

  const loginDomi = await req('/auth/login', {
    method: 'POST',
    body: { email: 'domi@ffcore.co', password: 'demo' },
  });
  assert(loginDomi.ok, `Login domi falló: ${JSON.stringify(loginDomi.data)}`);
  const domiToken = loginDomi.data.token;
  const domiUser = loginDomi.data.user;
  console.log(`✓ login domiciliario (${domiUser.id})`);

  const loginAdmin = await req('/auth/login', {
    method: 'POST',
    body: { email: 'admin@ffcore.co', password: 'demo' },
  });
  assert(loginAdmin.ok, `Login admin falló: ${JSON.stringify(loginAdmin.data)}`);
  const adminToken = loginAdmin.data.token;
  const restaurantId = loginAdmin.data.user.restaurant_id ?? 'rest-ffcore';
  console.log(`✓ login admin (restaurant=${restaurantId})`);

  let productsRes = await req(`/products${'?restaurant_id=' + encodeURIComponent(restaurantId)}`);
  if (!productsRes.ok || !(Array.isArray(productsRes.data) ? productsRes.data.length : 0)) {
    productsRes = await req(`/restaurants/${restaurantId}/products`, { token: adminToken });
  }
  const productList = Array.isArray(productsRes.data)
    ? productsRes.data
    : Array.isArray(productsRes.data?.data)
      ? productsRes.data.data
      : [];
  assert(productList.length > 0, `Sin productos: ${JSON.stringify(productsRes)}`);
  const product = productList[0];
  console.log(`✓ producto ${product.name} (${product.id})`);

  const created = await req('/orders', {
    method: 'POST',
    body: {
      customer_name: 'Prueba Domi Local',
      address: 'Calle 10 #43-28, Cúcuta',
      phone: '+573135550433',
      restaurant_id: restaurantId,
      delivery_fee: 4500,
      items: [{ product_id: product.id, quantity: 1 }],
    },
  });
  assert(created.ok, `Crear pedido falló: ${JSON.stringify(created.data)}`);
  const order = created.data;
  console.log(`✓ pedido creado ${order.id} status=${order.status} uuid=${order.order_id}`);

  let currentUuid = order.order_id;
  for (const status of ['EnPreparacion', 'Listo']) {
    const upd = await req(`/orders/${currentUuid}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: { status },
    });
    assert(upd.ok, `Status→${status} falló: ${JSON.stringify(upd.data)}`);
    currentUuid = upd.data.order_id;
    console.log(`✓ admin status → ${upd.data.status}`);
  }

  const available = await req('/orders/delivery/available', { token: domiToken });
  assert(available.ok, `available falló: ${JSON.stringify(available.data)}`);
  const availList = available.data;
  assert(
    availList.some((o) => o.order_id === currentUuid || o.id === order.id),
    `Pedido no está en available: ${JSON.stringify(availList.map((o) => o.id))}`,
  );
  console.log(`✓ available incluye ${order.id} (${availList.length} en cola)`);

  const accepted = await req(`/orders/${currentUuid}/accept`, {
    method: 'POST',
    token: domiToken,
  });
  assert(accepted.ok, `accept falló: ${JSON.stringify(accepted.data)}`);
  assert(accepted.data.courier_id === domiUser.id, 'courier_id no coincide tras accept');
  assert(accepted.data.status === 'Listo', `tras accept debe seguir Listo, fue ${accepted.data.status}`);
  console.log(`✓ accept ok (sigue Listo, courier=${accepted.data.courier_id})`);

  const available2 = await req('/orders/delivery/available', { token: domiToken });
  assert(
    !available2.data.some((o) => o.order_id === currentUuid),
    'Pedido aceptado aún aparece en available',
  );
  console.log('✓ available ya no incluye el pedido aceptado');

  const mine = await req('/orders/courier/me', { token: domiToken });
  assert(mine.ok, `courier/me falló: ${JSON.stringify(mine.data)}`);
  assert(
    mine.data.some((o) => o.order_id === currentUuid),
    'Pedido no aparece en courier/me',
  );
  console.log(`✓ courier/me tiene el pedido (${mine.data.length} míos)`);

  const started = await req(`/orders/${currentUuid}/start-delivery`, {
    method: 'POST',
    token: domiToken,
  });
  assert(started.ok, `start-delivery falló: ${JSON.stringify(started.data)}`);
  assert(started.data.status === 'EnCamino', `esperado EnCamino, fue ${started.data.status}`);
  console.log('✓ start-delivery → EnCamino');

  const done = await req(`/orders/${currentUuid}/complete`, {
    method: 'POST',
    token: domiToken,
  });
  assert(done.ok, `complete falló: ${JSON.stringify(done.data)}`);
  assert(done.data.status === 'Entregado', `esperado Entregado, fue ${done.data.status}`);
  console.log('✓ complete → Entregado');

  const fake = await req('/orders/00000000-0000-4000-8000-000000000099/complete', {
    method: 'POST',
    token: domiToken,
  });
  assert(fake.status === 404 || fake.status === 400, `fake complete status=${fake.status}`);
  console.log(`✓ ownership/404 en complete ajeno (${fake.status})`);

  console.log('\n✅ Flujo domiciliario LOCAL OK');
}

main().catch((e) => {
  console.error('\n❌', e.message || e);
  process.exit(1);
});
