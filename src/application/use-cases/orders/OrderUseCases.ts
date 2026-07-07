import { IOrderRepository, CreateOrderData } from '../../ports/IOrderRepository';
import { IProductRepository } from '../../ports/IProductRepository';
import { OrderStatus } from '../../../domain/enums';

export class CreateOrderUseCase {
  constructor(
    private orderRepo: IOrderRepository,
    private productRepo: IProductRepository,
  ) {}

  async execute(data: CreateOrderData) {
    // Validate items and calculate total
    const itemsWithPrice: { productId: string; quantity: number; unitPrice: number }[] = [];
    let subtotal = 0;

    for (const item of data.items) {
      const product = await this.productRepo.findById(item.productId);
      if (!product) throw new Error(`Producto ${item.productId} no encontrado`);
      if (!product.available) throw new Error(`Producto "${product.name}" no está disponible`);

      itemsWithPrice.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
      });
      subtotal += product.price * item.quantity;
    }

    const deliveryFee = 5000;
    const total = subtotal + deliveryFee;

    // Generate human-readable code
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

  async execute(restaurantId: string) {
    return this.orderRepo.listByRestaurant(restaurantId);
  }
}

export class UpdateOrderStatusUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  async execute(id: string, status: OrderStatus) {
    return this.orderRepo.updateStatus(id, status);
  }
}

export class AssignCourierUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  async execute(orderId: string, courierId: string) {
    return this.orderRepo.assignCourier(orderId, courierId);
  }
}
