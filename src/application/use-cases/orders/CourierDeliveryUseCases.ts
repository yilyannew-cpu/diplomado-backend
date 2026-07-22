import { IOrderRepository } from '../../ports/IOrderRepository';
import { IUserRepository, ICourierApplicationRepository } from '../../ports';
import { ApplicationStatus, OrderStatus, Role, UserStatus } from '../../../domain/enums';
import { DomainError, ForbiddenError, NotFoundError } from '../../../domain/errors';
import {
  assertCourierCanTakeBatch,
  loadCourierActiveOrders,
  MAX_ORDERS_PER_COURIER,
} from '../../../shared/courierLimits';
import {
  markCourierAvailableIfIdle,
  markCourierUnavailableOnDelivery,
} from '../courier-applications/SetCourierAvailabilityUseCase';

/** @deprecated Preferir MAX_ORDERS_PER_COURIER. */
export const COURIER_MAX_IN_ROUTE = MAX_ORDERS_PER_COURIER;

/**
 * Domiciliario acepta un pedido Listo sin asignar.
 * Queda en Listo + delivery_person_id (esperando salir / "recogido").
 * Requiere contrato ACCEPTED con el restaurante del pedido.
 */
export class AcceptDeliveryUseCase {
  constructor(
    private orderRepo: IOrderRepository,
    private userRepo: IUserRepository,
    private appRepo: ICourierApplicationRepository,
  ) {}

  async execute(orderId: string, courierId: string) {
    const courier = await this.userRepo.findById(courierId);
    if (!courier || courier.role !== Role.DOMICILIARIO) {
      throw new ForbiddenError('NOT_COURIER', 'Solo domiciliarios pueden aceptar pedidos');
    }
    if (courier.status !== UserStatus.ACTIVO) {
      throw new ForbiddenError('COURIER_INACTIVE', 'Tu cuenta de domiciliario no está activa');
    }
    if (!courier.isAvailable) {
      throw new ForbiddenError(
        'COURIER_OFFLINE',
        'Estás desconectado. Activa tu turno para aceptar pedidos.',
      );
    }

    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new NotFoundError('Pedido no encontrado');

    if (order.status !== OrderStatus.LISTO) {
      throw new DomainError('INVALID_ORDER_STATUS', 'Solo puedes aceptar pedidos en estado Listo');
    }
    if (order.deliveryPersonId) {
      throw new DomainError('ORDER_ALREADY_ASSIGNED', 'Este pedido ya tiene domiciliario asignado');
    }

    const app = await this.appRepo.findExisting(courierId, order.restaurantId);
    if (!app || app.status !== ApplicationStatus.ACCEPTED) {
      throw new ForbiddenError(
        'WRONG_RESTAURANT',
        'No estás contratado en el restaurante de este pedido.',
      );
    }

    const load = await loadCourierActiveOrders(courierId);
    assertCourierCanTakeBatch({
      load,
      restaurantId: order.restaurantId,
      zone: order.zone,
      batchSize: 1,
    });

    return this.orderRepo.assignCourier(orderId, courierId);
  }
}

/** Listo + asignado a mí → EnCamino (el cliente ya ve el mapa). */
export class StartDeliveryUseCase {
  constructor(
    private orderRepo: IOrderRepository,
    private userRepo: IUserRepository,
  ) {}

  async execute(orderId: string, courierId: string) {
    const order = await this.orderRepo.startDeliveryByCourier(orderId, courierId);
    await markCourierUnavailableOnDelivery(this.userRepo, courierId);
    return order;
  }
}

/** EnCamino + asignado a mí → Entregado. */
export class CompleteDeliveryUseCase {
  constructor(
    private orderRepo: IOrderRepository,
    private userRepo: IUserRepository,
  ) {}

  async execute(orderId: string, courierId: string) {
    const order = await this.orderRepo.completeDeliveryByCourier(orderId, courierId);
    await markCourierAvailableIfIdle(this.userRepo, courierId);
    return order;
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
 * Disponibles: Listo sin asignar, solo de restaurantes donde el domi está ACCEPTED.
 */
export class ListCourierAvailableDeliveriesUseCase {
  constructor(
    private orderRepo: IOrderRepository,
    private userRepo: IUserRepository,
    private appRepo: ICourierApplicationRepository,
  ) {}

  async execute(courierId: string, restaurantIdQuery?: string) {
    const courier = await this.userRepo.findById(courierId);
    if (!courier || courier.role !== Role.DOMICILIARIO) {
      throw new ForbiddenError('NOT_COURIER', 'Solo domiciliarios pueden ver la cola');
    }

    const apps = await this.appRepo.listByCourier(courierId);
    const acceptedRestaurantIds = apps
      .filter((a) => a.status === ApplicationStatus.ACCEPTED)
      .map((a) => a.restaurantId);

    if (acceptedRestaurantIds.length === 0) return [];

    if (restaurantIdQuery) {
      if (!acceptedRestaurantIds.includes(restaurantIdQuery)) return [];
      return this.orderRepo.listAvailableForDelivery(restaurantIdQuery);
    }

    const batches = await Promise.all(
      acceptedRestaurantIds.map((id) => this.orderRepo.listAvailableForDelivery(id)),
    );
    return batches.flat();
  }
}

/**
 * Cambio de estado con reglas:
 * - Admin/superadmin: libre (como antes)
 * - Domiciliario: solo sus pedidos y solo EnCamino | Entregado con transición válida
 */
export class UpdateOrderStatusSecureUseCase {
  constructor(
    private orderRepo: IOrderRepository,
    private userRepo: IUserRepository,
  ) {}

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
        const updated = await this.orderRepo.startDeliveryByCourier(input.orderId, input.actorId);
        await markCourierUnavailableOnDelivery(this.userRepo, input.actorId);
        return updated;
      }
      const updated = await this.orderRepo.completeDeliveryByCourier(input.orderId, input.actorId);
      await markCourierAvailableIfIdle(this.userRepo, input.actorId);
      return updated;
    }

    return this.orderRepo.updateStatus(input.orderId, input.status);
  }
}
