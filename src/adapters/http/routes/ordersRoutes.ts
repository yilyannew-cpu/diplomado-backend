import { Router } from 'express';
import { container } from '../../../container';
import { createAuthenticateMiddleware, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { listOrdersQuerySchema } from '../dto/schemas';
import {
  createOrderController,
  listRestaurantOrdersController,
  updateOrderStatusController,
  assignCourierController,
  listAvailableDeliveriesController,
  listCourierOrdersController
} from '../controllers/ordersController';
import { listOrdersController } from '../controllers/operationsController';
import { Role } from '../../../domain/enums';

const router = Router();
const authenticate = createAuthenticateMiddleware(container.tokenService);
const adminOnly = [authenticate, authorize(Role.ADMIN, Role.SUPERADMIN)];
const adminOrCourier = [authenticate, authorize(Role.ADMIN, Role.SUPERADMIN, Role.DOMICILIARIO)];
const superadminOnly = [authenticate, authorize(Role.SUPERADMIN)];

// Superadmin: seguimiento logístico (datos demo)
router.get('/', ...superadminOnly, validate(listOrdersQuerySchema, 'query'), listOrdersController);

// Public/Client routes
router.post('/', createOrderController);

// Protected routes
router.get('/restaurant/:restaurantId', ...adminOrCourier, listRestaurantOrdersController);
router.patch('/:id/status', ...adminOrCourier, updateOrderStatusController);
router.patch('/:id/assign', ...adminOnly, assignCourierController);
router.get('/delivery/available', ...adminOrCourier, listAvailableDeliveriesController);
router.get('/courier/:courierId', ...adminOrCourier, listCourierOrdersController);

export { router as ordersRouter };
