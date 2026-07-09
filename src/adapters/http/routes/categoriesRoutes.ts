import { Router } from 'express';
import { container } from '../../../container';
import { createAuthenticateMiddleware, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { uploadImage } from '../../../infrastructure/services/UploadService';
import { categoryIdParamSchema, updateCategorySchema } from '../dto/schemas';
import {
  updateCategoryController,
  deleteCategoryController,
  uploadCategoryImageController,
} from '../controllers/categoriesController';
import { Role } from '../../../domain/enums';

const router = Router();
const authenticate = createAuthenticateMiddleware(container.tokenService);
const adminOnly = [authenticate, authorize(Role.ADMIN, Role.SUPERADMIN)];

router.patch('/:categoryId', ...adminOnly, validate(categoryIdParamSchema, 'params'), validate(updateCategorySchema), updateCategoryController);
router.delete('/:categoryId', ...adminOnly, validate(categoryIdParamSchema, 'params'), deleteCategoryController);
router.post('/:categoryId/image', ...adminOnly, validate(categoryIdParamSchema, 'params'), uploadImage.single('file'), uploadCategoryImageController);

export { router as categoriesRouter };
