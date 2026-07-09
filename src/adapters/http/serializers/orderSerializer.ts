import { Order, OrderItem } from '../../../domain/entities/Order';
import { OrderStatus } from '../../../domain/enums';

interface OrderItemWithProduct extends OrderItem {
  productName?: string;
}

interface OrderWithExtras extends Order {
  items: OrderItemWithProduct[];
}

export function serializeOrderItem(item: OrderItemWithProduct) {
  const customizations = item.customizations;
  return {
    line_id: item.id,
    product_id: item.productId,
    product_name: item.productName ?? '',
    quantity: item.quantity,
    unit_price: item.unitPrice,
    customizations: customizations
      ? {
          removed_ingredients: customizations.removedIngredients ?? customizations.removed_ingredients ?? [],
          added_modifiers: customizations.addedModifiers ?? customizations.added_modifiers ?? {},
          extra_price: customizations.extraPrice ?? customizations.extra_price ?? 0,
        }
      : null,
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
