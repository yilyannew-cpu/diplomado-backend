import { IOrderRepository } from '../../ports/IOrderRepository';
import { ConflictError, DomainError, NotFoundError } from '../../../domain/errors';
import { OrderStatus } from '../../../domain/enums';
import { prisma } from '../../../infrastructure/database/prisma/client';

export interface SubmitDeliveryReviewInput {
  restaurantRating: number;
  restaurantComment?: string | null;
  courierRating?: number | null;
  courierComment?: string | null;
  customerName?: string | null;
}

export class GetDeliveryReviewStatusUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  async execute(orderId: string) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new NotFoundError('Pedido no encontrado');

    const existing = await prisma.deliveryReview.findUnique({
      where: { order_id: orderId },
      select: { id: true },
    });

    return {
      order_id: order.id,
      order_code: order.code,
      status: order.status,
      can_review: order.status === OrderStatus.ENTREGADO && !existing,
      reviewed: Boolean(existing),
      has_courier: Boolean(order.deliveryPersonId),
      restaurant_id: order.restaurantId,
      courier_id: order.deliveryPersonId,
      courier_name: order.courierName ?? null,
      courier_avatar: order.courierAvatar ?? null,
    };
  }
}

export class SubmitDeliveryReviewUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  async execute(orderId: string, input: SubmitDeliveryReviewInput) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new NotFoundError('Pedido no encontrado');

    if (order.status !== OrderStatus.ENTREGADO) {
      throw new DomainError(
        'INVALID_ORDER_STATUS',
        'Solo puedes reseñar cuando el pedido esté entregado',
      );
    }

    const already = await prisma.deliveryReview.findUnique({
      where: { order_id: orderId },
      select: { id: true },
    });
    if (already) {
      throw new ConflictError('Este pedido ya fue reseñado');
    }

    const restaurantRating = clampRating(input.restaurantRating);
    const courierRating =
      order.deliveryPersonId && input.courierRating != null
        ? clampRating(input.courierRating)
        : null;

    if (!order.deliveryPersonId && input.courierRating != null) {
      throw new DomainError(
        'NO_COURIER',
        'Este pedido no tiene domiciliario para calificar',
      );
    }

    const customerName =
      input.customerName?.trim() || order.customerName || 'Cliente FFCore';

    const created = await prisma.$transaction(async (tx) => {
      const deliveryReview = await tx.deliveryReview.create({
        data: {
          order_id: orderId,
          restaurant_id: order.restaurantId,
          courier_id: order.deliveryPersonId,
          customer_name: customerName,
          restaurant_rating: restaurantRating,
          restaurant_comment: input.restaurantComment?.trim() || null,
          courier_rating: courierRating,
          courier_comment: input.courierComment?.trim() || null,
        },
      });

      // Alimenta el listado existente del panel restaurante.
      await tx.review.create({
        data: {
          restaurant_id: order.restaurantId,
          rating: restaurantRating,
          comment: input.restaurantComment?.trim() || null,
          customer_name: customerName,
        },
      });

      const agg = await tx.review.aggregate({
        where: { restaurant_id: order.restaurantId },
        _avg: { rating: true },
      });
      await tx.restaurant.update({
        where: { id: order.restaurantId },
        data: { rating: Number((agg._avg.rating ?? restaurantRating).toFixed(2)) },
      });

      return deliveryReview;
    });

    return {
      id: created.id,
      order_id: created.order_id,
      restaurant_rating: created.restaurant_rating,
      courier_rating: created.courier_rating,
      created_at: created.created_at.toISOString(),
    };
  }
}

export class GetCourierRatingUseCase {
  async execute(courierId: string) {
    const [agg, recent] = await Promise.all([
      prisma.deliveryReview.aggregate({
        where: { courier_id: courierId, courier_rating: { not: null } },
        _avg: { courier_rating: true },
        _count: { _all: true },
      }),
      prisma.deliveryReview.findMany({
        where: { courier_id: courierId, courier_rating: { not: null } },
        orderBy: { created_at: 'desc' },
        take: 10,
        select: {
          id: true,
          courier_rating: true,
          courier_comment: true,
          customer_name: true,
          created_at: true,
          order: { select: { code: true } },
        },
      }),
    ]);

    return {
      courier_id: courierId,
      average_rating: Number((agg._avg.courier_rating ?? 0).toFixed(2)),
      review_count: agg._count._all,
      recent: recent.map((r) => ({
        id: r.id,
        rating: r.courier_rating,
        comment: r.courier_comment,
        customer_name: r.customer_name,
        order_code: r.order.code,
        created_at: r.created_at.toISOString(),
      })),
    };
  }
}

function clampRating(value: number): number {
  if (!Number.isFinite(value)) {
    throw new DomainError('INVALID_RATING', 'La calificación debe ser un número');
  }
  const rounded = Math.round(value);
  if (rounded < 1 || rounded > 5) {
    throw new DomainError('INVALID_RATING', 'La calificación debe estar entre 1 y 5');
  }
  return rounded;
}
