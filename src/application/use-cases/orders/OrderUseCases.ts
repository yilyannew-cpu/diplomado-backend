import { IOrderRepository, CreateOrderData, ListRestaurantOrdersFilters } from '../../ports/IOrderRepository';
import { IProductRepository } from '../../ports/IProductRepository';
import { OrderStatus } from '../../../domain/enums';
import { NotFoundError, DomainError } from '../../../domain/errors';

export class CreateOrderUseCase {
  constructor(
    private orderRepo: IOrderRepository,
    private productRepo: IProductRepository,
  ) {}

  async execute(data: CreateOrderData) {
    const itemsWithPrice: { productId: string; quantity: number; unitPrice: number; customizations?: Record<string, unknown> }[] = [];
    let subtotal = 0;

    for (const item of data.items) {
      const product = await this.productRepo.findById(item.productId);
      if (!product) throw new NotFoundError(`Producto ${item.productId} no encontrado`);
      if (!product.available) throw new DomainError('PRODUCT_UNAVAILABLE', `Producto "${product.name}" no está disponible`);

      let extraPrice = 0;
      const customizations = item.customizations as Record<string, unknown> | undefined;
      if (customizations?.extraPrice) extraPrice = Number(customizations.extraPrice);
      if (customizations?.extra_price) extraPrice = Number(customizations.extra_price);

      const finalUnitPrice = product.price + extraPrice;

      itemsWithPrice.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: finalUnitPrice,
        customizations: item.customizations,
      });
      subtotal += finalUnitPrice * item.quantity;
    }

    const deliveryFee = 5000;
    const total = subtotal + deliveryFee;
    const count = await this.orderRepo.countAll();
    const code = `PED-${String(count + 101).padStart(3, '0')}`;

    return this.orderRepo.create({
      ...data,
      code,
      total,
      deliveryFee,
      itemsWithPrice,
    });
  }
}

export class ListRestaurantOrdersUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  async execute(filters: ListRestaurantOrdersFilters) {
    return this.orderRepo.listByRestaurant(filters);
  }
}

export class UpdateOrderStatusUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  async execute(id: string, status: OrderStatus) {
    const order = await this.orderRepo.findById(id);
    if (!order) throw new NotFoundError('Pedido no encontrado');
    return this.orderRepo.updateStatus(id, status);
  }
}

export class AssignCourierUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  async execute(orderId: string, courierId: string) {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new NotFoundError('Pedido no encontrado');
    return this.orderRepo.assignCourier(orderId, courierId);
  }
}

export class BatchAssignCourierUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  async execute(orderIds: string[], courierId: string) {
    if (!orderIds.length) throw new DomainError('INVALID_ORDERS', 'Debe incluir al menos un pedido');
    return this.orderRepo.batchAssignCourier(orderIds, courierId);
  }
}

export class BatchDispatchOrdersUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  async execute(orderIds: string[], restaurantId: string) {
    if (!orderIds.length) throw new DomainError('INVALID_ORDERS', 'Debe incluir al menos un pedido');
    return this.orderRepo.dispatchOrders(orderIds, restaurantId);
  }
}

export class ListAvailableDeliveriesUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  async execute(restaurantId?: string) {
    return this.orderRepo.listAvailableForDelivery(restaurantId);
  }
}

export class ListCourierOrdersUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  async execute(courierId: string) {
    return this.orderRepo.listByCourier(courierId);
  }
}
