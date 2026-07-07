import { Router } from 'express';
import { container } from '../../../container';
import { createAuthenticateMiddleware, authorize } from '../middleware/auth';
import {
  listProductsController,
  getProductController,
  createProductController,
  updateProductController,
  toggleProductAvailabilityController
} from '../controllers/productsController';
import { Role } from '../../../domain/enums';

const router = Router();
const authenticate = createAuthenticateMiddleware(container.tokenService);
const adminOnly = [authenticate, authorize(Role.ADMIN, Role.SUPERADMIN)];

// Public routes
router.get('/', listProductsController);
router.get('/:id', getProductController);

// Protected routes (Admin/Superadmin)
router.post('/', ...adminOnly, createProductController);
router.patch('/:id', ...adminOnly, updateProductController);
router.patch('/:id/availability', ...adminOnly, toggleProductAvailabilityController);

export { router as productsRouter };
