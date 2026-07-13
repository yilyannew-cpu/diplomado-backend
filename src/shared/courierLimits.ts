import { prisma } from '../infrastructure/database/prisma/client';
import { DomainError } from '../domain/errors';

/** Máximo de pedidos del mismo restaurante + misma zona antes de salir. */
export const MAX_ORDERS_PER_COURIER = 3;

export function normalizeZone(zone?: string | null): string {
  return (zone ?? '').trim().toLowerCase();
}

export type CourierAssignedOrder = {
  id: string;
  status: string;
  restaurant_id: string;
  zone: string | null;
};

export type CourierLoad = {
  enCamino: CourierAssignedOrder[];
  waitingAtRestaurant: CourierAssignedOrder[];
};

export async function loadCourierActiveOrders(courierId: string): Promise<CourierLoad> {
  const orders = await prisma.order.findMany({
    where: {
      delivery_person_id: courierId,
      status: { in: ['Listo', 'EnCamino'] },
    },
    select: {
      id: true,
      status: true,
      restaurant_id: true,
      zone: true,
    },
  });

  return {
    enCamino: orders.filter((o) => o.status === 'EnCamino'),
    waitingAtRestaurant: orders.filter((o) => o.status === 'Listo'),
  };
}

/**
 * Reglas operativas:
 * - Si ya salió (EnCamino ≥ 1): no disponible para ningún restaurante.
 * - Si tiene Listo asignados: solo puede sumar del mismo restaurante + misma zona,
 *   hasta MAX_ORDERS_PER_COURIER en total (espera + nuevo lote).
 * - Libre (0 Listo / 0 EnCamino): puede tomar un lote ≤ máx. de un restaurante/zona.
 */
export function evaluateCourierBatchCapacity(input: {
  load: CourierLoad;
  restaurantId: string;
  zone?: string | null;
  batchSize: number;
}): { canTake: boolean; reason: string | null } {
  const { load, restaurantId, zone, batchSize } = input;

  if (batchSize < 1) {
    return { canTake: false, reason: 'El lote debe tener al menos un pedido.' };
  }
  if (batchSize > MAX_ORDERS_PER_COURIER) {
    return {
      canTake: false,
      reason: `Máximo ${MAX_ORDERS_PER_COURIER} pedidos del mismo restaurante y zona.`,
    };
  }

  if (load.enCamino.length > 0) {
    return {
      canTake: false,
      reason:
        'El domiciliario ya salió a entregar. No está en el restaurante hasta que entregue sus pedidos.',
    };
  }

  const waiting = load.waitingAtRestaurant;
  if (waiting.length === 0) {
    return { canTake: true, reason: null };
  }

  const currentRestaurant = waiting[0].restaurant_id;
  const currentZone = normalizeZone(waiting[0].zone);
  const inconsistent = waiting.some(
    (o) => o.restaurant_id !== currentRestaurant || normalizeZone(o.zone) !== currentZone,
  );
  if (inconsistent) {
    return {
      canTake: false,
      reason: 'El domiciliario tiene pedidos mixtos pendientes. Debe completarlos antes.',
    };
  }

  if (currentRestaurant !== restaurantId) {
    return {
      canTake: false,
      reason: 'Tiene pedidos de otro restaurante pendientes de salir o entregar.',
    };
  }

  if (normalizeZone(zone) !== currentZone) {
    return {
      canTake: false,
      reason: 'Tiene pedidos de otra zona en este restaurante. Complete ese grupo primero.',
    };
  }

  if (waiting.length + batchSize > MAX_ORDERS_PER_COURIER) {
    return {
      canTake: false,
      reason: `Ya tiene ${waiting.length} pedido(s) de esta zona. Tope ${MAX_ORDERS_PER_COURIER}.`,
    };
  }

  return { canTake: true, reason: null };
}

export function assertCourierCanTakeBatch(input: {
  load: CourierLoad;
  restaurantId: string;
  zone?: string | null;
  batchSize: number;
}): void {
  const result = evaluateCourierBatchCapacity(input);
  if (!result.canTake) {
    throw new DomainError('COURIER_UNAVAILABLE', result.reason ?? 'Domiciliario no disponible');
  }
}
