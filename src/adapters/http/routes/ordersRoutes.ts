import { Router } from 'express';
import { container } from '../../../container';
import { createAuthenticateMiddleware, authorize } from '../middleware/auth';
import {
  createOrderController,
  listRestaurantOrdersController,
  updateOrderStatusController,
  assignCourierController
} from '../controllers/ordersController';
import { Role } from '../../../domain/enums';

const router = Router();
const authenticate = createAuthenticateMiddleware(container.tokenService);
const adminOnly = [authenticate, authorize(Role.ADMIN, Role.SUPERADMIN)];

// Public/Client routes
router.post('/', createOrderController); // Clients can create orders

// Protected routes (Admin/Superadmin)
router.get('/restaurant/:restaurantId', ...adminOnly, listRestaurantOrdersController);
router.patch('/:id/status', ...adminOnly, updateOrderStatusController);
router.patch('/:id/assign', ...adminOnly, assignCourierController);

export { router as ordersRouter };

