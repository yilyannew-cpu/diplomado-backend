import { IOrderRepository } from '../../ports/IOrderRepository';
import { IUserRepository } from '../../ports';
import { OrderStatus, Role, UserStatus } from '../../../domain/enums';
import { DomainError, ForbiddenError, NotFoundError } from '../../../domain/errors';
import { MAX_ORDERS_PER_COURIER } from '../../../shared/courierLimits';

/** @deprecated Preferir MAX_ORDERS_PER_COURIER. */
export const COURIER_MAX_IN_ROUTE = MAX_ORDERS_PER_COURIER;

/**
 * Domiciliario acepta un pedido Listo sin asignar.
 * Queda en Listo + delivery_person_id (esperando salir / "recogido").
 */
export class AcceptDeliveryUseCase {
  constructor(
    private orderRepo: IOrderRepository,
    private userRepo: IUserRepository,
  ) {}

  async execute(orderId: string, courierId: string) {
    const courier = await this.userRepo.findById(courierId);
    if (!courier || courier.role !== Role.DOMICILIARIO) {
      throw new ForbiddenError('NOT_COURIER', 'Solo domiciliarios pueden aceptar pedidos');
    }
    if (courier.status !== UserStatus.ACTIVO) {
      throw new ForbiddenError('COURIER_INACTIVE', 'Tu cuenta de domiciliario no está activa');
    }

    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new NotFoundError('Pedido no encontrado');

    if (order.status !== OrderStatus.LISTO) {
      throw new DomainError('INVALID_ORDER_STATUS', 'Solo puedes aceptar pedidos en estado Listo');
    }
    if (order.deliveryPersonId) {
      throw new DomainError('ORDER_ALREADY_ASSIGNED', 'Este pedido ya tiene domiciliario asignado');
    }

    if (courier.restaurantId && order.restaurantId !== courier.restaurantId) {
      throw new ForbiddenError(
        'WRONG_RESTAURANT',
        'Este pedido pertenece a otro restaurante',
      );
    }

    const inRoute = await this.orderRepo.countInRouteByCourier(courierId);
    if (inRoute >= COURIER_MAX_IN_ROUTE) {
      throw new DomainError(
        'COURIER_AT_CAPACITY',
        `Ya tienes ${COURIER_MAX_IN_ROUTE} pedidos en camino. Completa uno antes de aceptar más.`,
      );
    }

    return this.orderRepo.assignCourier(orderId, courierId);
  }
}

/** Listo + asignado a mí → EnCamino (el cliente ya ve el mapa). */
export class StartDeliveryUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  async execute(orderId: string, courierId: string) {
    return this.orderRepo.startDeliveryByCourier(orderId, courierId);
  }
}

/** EnCamino + asignado a mí → Entregado. */
export class CompleteDeliveryUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  async execute(orderId: string, courierId: string) {
    return this.orderRepo.completeDeliveryByCourier(orderId, courierId);
  }
}

/** Mis pedidos (siempre el courier autenticado). */
export class ListMyCourierOrdersUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  async execute(courierId: string) {
    return this.orderRepo.listByCourier(courierId);
  }
}

/**
 * Disponibles: Listo sin asignar.
 * Si el courier tiene restaurantId, filtra esa sede.
 */
export class ListCourierAvailableDeliveriesUseCase {
  constructor(
    private orderRepo: IOrderRepository,
    private userRepo: IUserRepository,
  ) {}

  async execute(courierId: string, restaurantIdQuery?: string) {
    const courier = await this.userRepo.findById(courierId);
    if (!courier || courier.role !== Role.DOMICILIARIO) {
      throw new ForbiddenError('NOT_COURIER', 'Solo domiciliarios pueden ver la cola');
    }

    const restaurantId =
      restaurantIdQuery ?? courier.restaurantId ?? undefined;

    return this.orderRepo.listAvailableForDelivery(restaurantId);
  }
}

/**
 * Cambio de estado con reglas:
 * - Admin/superadmin: libre (como antes)
 * - Domiciliario: solo sus pedidos y solo EnCamino | Entregado con transición válida
 */
export class UpdateOrderStatusSecureUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  async execute(input: {
    orderId: string;
    status: OrderStatus;
    actorId: string;
    actorRole: Role;
  }) {
    const order = await this.orderRepo.findById(input.orderId);
    if (!order) throw new NotFoundError('Pedido no encontrado');

    if (input.actorRole === Role.DOMICILIARIO) {
      if (order.deliveryPersonId !== input.actorId) {
        throw new ForbiddenError('FORBIDDEN_ORDER', 'Este pedido no está asignado a ti');
      }

      const allowed =
        (order.status === OrderStatus.LISTO && input.status === OrderStatus.EN_CAMINO) ||
        (order.status === OrderStatus.EN_CAMINO && input.status === OrderStatus.ENTREGADO);

      if (!allowed) {
        throw new DomainError(
          'INVALID_TRANSITION',
          'Como domiciliario solo puedes pasar Listo→EnCamino o EnCamino→Entregado. Usa /start-delivery o /complete.',
        );
      }

      if (input.status === OrderStatus.EN_CAMINO) {
        return this.orderRepo.startDeliveryByCourier(input.orderId, input.actorId);
      }
      return this.orderRepo.completeDeliveryByCourier(input.orderId, input.actorId);
    }

    return this.orderRepo.updateStatus(input.orderId, input.status);
  }
}
