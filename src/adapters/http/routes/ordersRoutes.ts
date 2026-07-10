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
} from '../dto/schemas';
import {
  createOrderController,
  trackOrderController,
  listRestaurantOrdersController,
  updateOrderStatusController,
  rejectPaymentController,
  assignCourierController,
  batchAssignCourierController,
  batchDispatchOrdersController,
  listAvailableDeliveriesController,
  listCourierOrdersController,
} from '../controllers/ordersController';
import { listOrdersController } from '../controllers/operationsController';
import { Role } from '../../../domain/enums';

const router = Router();
const authenticate = createAuthenticateMiddleware(container.tokenService);
const adminOnly = [authenticate, authorize(Role.ADMIN, Role.SUPERADMIN)];
const adminOrCourier = [authenticate, authorize(Role.ADMIN, Role.SUPERADMIN, Role.DOMICILIARIO)];
const superadminOnly = [authenticate, authorize(Role.SUPERADMIN)];

router.get('/', ...superadminOnly, validate(listOrdersQuerySchema, 'query'), listOrdersController);
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

router.patch('/:id/status', ...adminOrCourier, validate(updateOrderStatusSchema), updateOrderStatusController);
router.patch('/:id/reject-payment', ...adminOnly, rejectPaymentController);
router.patch('/:id/assign', ...adminOnly, validate(assignCourierSchema), assignCourierController);
router.get('/delivery/available', ...adminOrCourier, listAvailableDeliveriesController);
router.get('/courier/:courierId', ...adminOrCourier, listCourierOrdersController);

export { router as ordersRouter };
