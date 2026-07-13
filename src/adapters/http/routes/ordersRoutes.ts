import { Router } from 'express';
import { container } from '../../../container';
import { createAuthenticateMiddleware, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  listOrdersQuerySchema,
  updateOrderStatusSchema,
  assignCourierSchema,
  batchOrdersSchema,
  batchDispatchSchema,
  restaurantOrdersQuerySchema,
  createOrderSchema,
  orderTrackParamSchema,
  idParamSchema,
  submitDeliveryReviewSchema,
} from '../dto/schemas';
import {
  createOrderController,
  trackOrderController,
  myActiveOrderController,
  listRestaurantOrdersController,
  updateOrderStatusController,
  rejectPaymentController,
  assignCourierController,
  batchAssignCourierController,
  batchDispatchOrdersController,
  listAvailableDeliveriesController,
  listMyCourierOrdersController,
  listCourierOrdersController,
  acceptDeliveryController,
  startDeliveryController,
  completeDeliveryController,
  getDeliveryReviewStatusController,
  submitDeliveryReviewController,
  getMyCourierRatingController,
} from '../controllers/ordersController';
import { listOrdersController } from '../controllers/operationsController';
import { Role } from '../../../domain/enums';

const router = Router();
const authenticate = createAuthenticateMiddleware(container.tokenService);
const adminOnly = [authenticate, authorize(Role.ADMIN, Role.SUPERADMIN)];
const adminOrCourier = [authenticate, authorize(Role.ADMIN, Role.SUPERADMIN, Role.DOMICILIARIO)];
const courierOnly = [authenticate, authorize(Role.DOMICILIARIO)];
const superadminOnly = [authenticate, authorize(Role.SUPERADMIN)];
const clientOnly = [authenticate, authorize(Role.CLIENTE)];

router.get('/', ...superadminOnly, validate(listOrdersQuerySchema, 'query'), listOrdersController);
router.get('/my-active', ...clientOnly, myActiveOrderController);
router.get('/track/:code', validate(orderTrackParamSchema, 'params'), trackOrderController);
router.post('/', validate(createOrderSchema), createOrderController);

router.get(
  '/restaurant/:restaurantId',
  ...adminOrCourier,
  validate(restaurantOrdersQuerySchema, 'query'),
  listRestaurantOrdersController
);

router.patch('/batch/assign', ...adminOnly, validate(batchOrdersSchema), batchAssignCourierController);
router.patch('/batch/dispatch', ...adminOnly, validate(batchDispatchSchema), batchDispatchOrdersController);

/** Cola de pedidos Listo sin asignar (domiciliario ve su sede; admin puede filtrar). */
router.get('/delivery/available', ...adminOrCourier, listAvailableDeliveriesController);

/** Pedidos del domiciliario autenticado. */
router.get('/courier/me', ...courierOnly, listMyCourierOrdersController);
router.get('/courier/me/rating', ...courierOnly, getMyCourierRatingController);
router.get('/courier/:courierId', ...adminOrCourier, listCourierOrdersController);

/** Flujo operativo del domiciliario. */
router.post('/:id/accept', ...courierOnly, validate(idParamSchema, 'params'), acceptDeliveryController);
router.post('/:id/start-delivery', ...courierOnly, validate(idParamSchema, 'params'), startDeliveryController);
router.post('/:id/complete', ...courierOnly, validate(idParamSchema, 'params'), completeDeliveryController);

/** Reseñas post-entrega (cliente): restaurante + domiciliario. */
router.get(
  '/:id/review-status',
  validate(idParamSchema, 'params'),
  getDeliveryReviewStatusController,
);
router.post(
  '/:id/reviews',
  validate(idParamSchema, 'params'),
  validate(submitDeliveryReviewSchema),
  submitDeliveryReviewController,
);

router.patch(
  '/:id/status',
  ...adminOrCourier,
  validate(idParamSchema, 'params'),
  validate(updateOrderStatusSchema),
  updateOrderStatusController
);
router.patch('/:id/reject-payment', ...adminOnly, rejectPaymentController);
router.patch('/:id/assign', ...adminOnly, validate(assignCourierSchema), assignCourierController);

export { router as ordersRouter };
