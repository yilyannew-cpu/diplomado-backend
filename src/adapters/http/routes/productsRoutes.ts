import { Router } from 'express';
import { container } from '../../../container';
import { createAuthenticateMiddleware, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { uploadImage } from '../../../infrastructure/services/UploadService';
import {
  createProductSchema,
  updateProductSchema,
  productIngredientsSchema,
  productModifierGroupsSchema,
  idParamSchema,
} from '../dto/schemas';
import {
  listProductsController,
  getProductController,
  createProductController,
  updateProductController,
  toggleProductAvailabilityController,
  deleteProductController,
  uploadProductImageController,
  setProductIngredientsController,
  setProductModifierGroupsController,
} from '../controllers/productsController';
import { Role } from '../../../domain/enums';

const router = Router();
const authenticate = createAuthenticateMiddleware(container.tokenService);
const adminOnly = [authenticate, authorize(Role.ADMIN, Role.SUPERADMIN)];

router.get('/', listProductsController);
router.get('/:id', getProductController);

router.post('/', ...adminOnly, validate(createProductSchema), createProductController);
router.patch('/:id', ...adminOnly, validate(idParamSchema, 'params'), validate(updateProductSchema), updateProductController);
router.patch('/:id/availability', ...adminOnly, validate(idParamSchema, 'params'), toggleProductAvailabilityController);
router.delete('/:id', ...adminOnly, validate(idParamSchema, 'params'), deleteProductController);
router.post('/:id/image', ...adminOnly, validate(idParamSchema, 'params'), uploadImage.single('file'), uploadProductImageController);
router.put('/:id/ingredients', ...adminOnly, validate(idParamSchema, 'params'), validate(productIngredientsSchema), setProductIngredientsController);
router.put('/:id/modifier-groups', ...adminOnly, validate(idParamSchema, 'params'), validate(productModifierGroupsSchema), setProductModifierGroupsController);

export { router as productsRouter };
