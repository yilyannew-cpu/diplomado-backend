import { IOrderRepository, CreateOrderData, ListRestaurantOrdersFilters } from '../../ports/IOrderRepository';
import { IProductRepository } from '../../ports/IProductRepository';
import { ProductWithCategory } from '../../../domain/entities/Product';
import { OrderStatus } from '../../../domain/enums';
import { NotFoundError, DomainError } from '../../../domain/errors';

const CATEGORY_ADDITIONS = 'Adiciones';
const CATEGORY_SIDES = 'Acompañamientos';
const CATEGORY_DRINKS = 'Bebidas';

type SelectedExtra = {
  product_id: string;
  name: string;
  price: number;
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string' && v.length > 0);
}

export class CreateOrderUseCase {
  constructor(
    private orderRepo: IOrderRepository,
    private productRepo: IProductRepository,
  ) {}

  async execute(data: CreateOrderData) {
    const itemsWithPrice: {
      productId: string;
      quantity: number;
      unitPrice: number;
      customizations?: Record<string, unknown>;
    }[] = [];
    let subtotal = 0;

    for (const item of data.items) {
      const product = await this.productRepo.findById(item.productId);
      if (!product) throw new NotFoundError(`Producto ${item.productId} no encontrado`);
      if (!product.available) {
        throw new DomainError('PRODUCT_UNAVAILABLE', `Producto "${product.name}" no está disponible`);
      }
      if (product.restaurantId !== data.restaurantId) {
        throw new DomainError(
          'INVALID_PRODUCT_RESTAURANT',
          `El producto "${product.name}" no pertenece al restaurante del pedido`,
        );
      }

      const customizations = item.customizations as Record<string, unknown> | undefined;
      const resolved = await this.resolveMenuExtras(customizations, data.restaurantId);

      const finalUnitPrice = product.price + resolved.extra_price;

      itemsWithPrice.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: finalUnitPrice,
        customizations: resolved.hasContent ? resolved.payload : undefined,
      });
      subtotal += finalUnitPrice * item.quantity;
    }

    // Tarifa por km de ruta (frontend): base 4500 + km extra + recargo tráfico, redondeada a centena.
    const DEFAULT_FEE = 4_500;
    const MIN_FEE = 4_500;
    const MAX_FEE = 200_000;
    const rawFee = data.deliveryFee;
    const deliveryFee =
      typeof rawFee === 'number' &&
      Number.isInteger(rawFee) &&
      rawFee >= MIN_FEE &&
      rawFee <= MAX_FEE &&
      rawFee % 100 === 0
        ? rawFee
        : DEFAULT_FEE;
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

  private async resolveMenuExtras(
    customizations: Record<string, unknown> | undefined,
    restaurantId: string,
  ): Promise<{
    extra_price: number;
    hasContent: boolean;
    payload: Record<string, unknown>;
  }> {
    if (!customizations) {
      return { extra_price: 0, hasContent: false, payload: {} };
    }

    const additionIds = asStringArray(customizations.addition_ids);
    const sideIds = asStringArray(customizations.side_ids);
    const drinkIds = asStringArray(customizations.drink_ids);
    const specialInstructions =
      typeof customizations.special_instructions === 'string'
        ? customizations.special_instructions.trim()
        : '';

    const additions = await this.loadExtras(additionIds, restaurantId, CATEGORY_ADDITIONS);
    const sides = await this.loadExtras(sideIds, restaurantId, CATEGORY_SIDES);
    const drinks = await this.loadExtras(drinkIds, restaurantId, CATEGORY_DRINKS);

    const extra_price =
      additions.reduce((sum, e) => sum + e.price, 0) +
      sides.reduce((sum, e) => sum + e.price, 0) +
      drinks.reduce((sum, e) => sum + e.price, 0);

    // Compatibilidad con pedidos antiguos (solo si no hay IDs de menú).
    const legacyRemoved = asStringArray(customizations.removed_ingredients);
    const legacyModifiers =
      customizations.added_modifiers && typeof customizations.added_modifiers === 'object'
        ? (customizations.added_modifiers as Record<string, string[]>)
        : undefined;

    const hasLegacy =
      additionIds.length === 0 &&
      sideIds.length === 0 &&
      drinkIds.length === 0 &&
      (legacyRemoved.length > 0 || Boolean(legacyModifiers && Object.keys(legacyModifiers).length > 0));

    let legacyExtra = 0;
    if (hasLegacy) {
      if (typeof customizations.extra_price === 'number') legacyExtra = customizations.extra_price;
      if (typeof customizations.extraPrice === 'number') legacyExtra = Number(customizations.extraPrice);
    }

    const payload: Record<string, unknown> = {
      addition_ids: additionIds,
      side_ids: sideIds,
      drink_ids: drinkIds,
      additions,
      sides,
      drinks,
      special_instructions: specialInstructions || null,
      extra_price: hasLegacy ? legacyExtra : extra_price,
    };

    if (hasLegacy) {
      payload.removed_ingredients = legacyRemoved;
      payload.added_modifiers = legacyModifiers ?? {};
    }

    const hasContent =
      additions.length > 0 ||
      sides.length > 0 ||
      drinks.length > 0 ||
      Boolean(specialInstructions) ||
      hasLegacy;

    return {
      extra_price: hasLegacy ? legacyExtra : extra_price,
      hasContent,
      payload,
    };
  }

  private async loadExtras(
    ids: string[],
    restaurantId: string,
    expectedCategory: string,
  ): Promise<SelectedExtra[]> {
    const uniqueIds = [...new Set(ids)];
    const result: SelectedExtra[] = [];

    for (const id of uniqueIds) {
      const product = await this.productRepo.findById(id);
      this.assertValidExtra(product, id, restaurantId, expectedCategory);
      result.push({
        product_id: product!.id,
        name: product!.name,
        price: product!.price,
      });
    }

    return result;
  }

  private assertValidExtra(
    product: ProductWithCategory | null,
    id: string,
    restaurantId: string,
    expectedCategory: string,
  ): asserts product is ProductWithCategory {
    if (!product) throw new NotFoundError(`Producto extra ${id} no encontrado`);
    if (!product.available) {
      throw new DomainError('PRODUCT_UNAVAILABLE', `Producto "${product.name}" no está disponible`);
    }
    if (product.restaurantId !== restaurantId) {
      throw new DomainError(
        'INVALID_PRODUCT_RESTAURANT',
        `El producto "${product.name}" no pertenece al restaurante del pedido`,
      );
    }
    if (product.categoryName !== expectedCategory) {
      throw new DomainError(
        'INVALID_EXTRA_CATEGORY',
        `El producto "${product.name}" debe ser de categoría "${expectedCategory}"`,
      );
    }
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

export class GetOrderByCodeUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  async execute(code: string) {
    const order = await this.orderRepo.findByCode(code);
    if (!order) throw new NotFoundError('Pedido no encontrado');
    return order;
  }
}

/**
 * Recupera el pedido activo del cliente autenticado por su teléfono de perfil.
 * Evita depender solo de localStorage en el navegador.
 */
export class GetMyActiveOrderUseCase {
  constructor(
    private orderRepo: IOrderRepository,
    private userRepo: { findById(id: string): Promise<{ phone?: string | null } | null> },
  ) {}

  async execute(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user?.phone?.trim()) return null;
    return this.orderRepo.findLatestActiveByPhone(user.phone.trim());
  }
}
