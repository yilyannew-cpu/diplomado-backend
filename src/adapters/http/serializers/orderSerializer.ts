import { Order, OrderItem } from '../../../domain/entities/Order';
import { OrderStatus } from '../../../domain/enums';

interface OrderItemWithProduct extends OrderItem {
  productName?: string;
}

interface OrderWithExtras extends Order {
  items: OrderItemWithProduct[];
}

function mapSelectedExtras(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const productId = record.product_id ?? record.productId;
      const name = record.name;
      const price = record.price;
      if (typeof productId !== 'string' || typeof name !== 'string') return null;
      return {
        product_id: productId,
        name,
        price: typeof price === 'number' ? price : Number(price) || 0,
      };
    })
    .filter((item): item is { product_id: string; name: string; price: number } => item !== null);
}

export function serializeOrderItem(item: OrderItemWithProduct) {
  const customizations = item.customizations;
  if (!customizations) {
    return {
      line_id: item.id,
      product_id: item.productId,
      product_name: item.productName ?? '',
      quantity: item.quantity,
      unit_price: item.unitPrice,
      customizations: null,
    };
  }

  return {
    line_id: item.id,
    product_id: item.productId,
    product_name: item.productName ?? '',
    quantity: item.quantity,
    unit_price: item.unitPrice,
    customizations: {
      addition_ids: customizations.addition_ids ?? [],
      side_ids: customizations.side_ids ?? [],
      drink_ids: customizations.drink_ids ?? [],
      additions: mapSelectedExtras(customizations.additions),
      sides: mapSelectedExtras(customizations.sides),
      drinks: mapSelectedExtras(customizations.drinks),
      special_instructions:
        customizations.special_instructions ?? customizations.specialInstructions ?? null,
      removed_ingredients:
        customizations.removedIngredients ?? customizations.removed_ingredients ?? [],
      added_modifiers: customizations.addedModifiers ?? customizations.added_modifiers ?? {},
      extra_price: customizations.extraPrice ?? customizations.extra_price ?? 0,
    },
  };
}

export function serializeOrder(order: OrderWithExtras) {
  return {
    id: order.code,
    order_id: order.id,
    customer_name: order.customerName,
    address: order.address,
    phone: order.phone,
    notes: order.notes ?? null,
    zone: order.zone ?? null,
    status: order.status,
    total: order.total,
    delivery_fee: order.deliveryFee,
    courier_id: order.deliveryPersonId,
    items: order.items.map(serializeOrderItem),
    received_at: order.createdAt.toISOString(),
    status_entered_at: order.statusEnteredAt.toISOString(),
  };
}

export function serializeOrders(orders: OrderWithExtras[]) {
  return orders.map(serializeOrder);
}

export function parseStatusFilter(status?: string): OrderStatus[] | undefined {
  if (!status) return undefined;
  return status.split(',').map((s) => s.trim()) as OrderStatus[];
}
