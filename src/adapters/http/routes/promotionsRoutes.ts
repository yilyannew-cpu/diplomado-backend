import { Router } from 'express';
import { container } from '../../../container';
import { createAuthenticateMiddleware, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { promotionIdParamSchema, updatePromotionSchema } from '../dto/schemas';
import {
  getPromotionController,
  updatePromotionController,
  deletePromotionController,
} from '../controllers/promotionsController';
import { Role } from '../../../domain/enums';

const router = Router();
const authenticate = createAuthenticateMiddleware(container.tokenService);
const adminOnly = [authenticate, authorize(Role.ADMIN, Role.SUPERADMIN)];

router.get('/:promotionId', ...adminOnly, validate(promotionIdParamSchema, 'params'), getPromotionController);
router.patch('/:promotionId', ...adminOnly, validate(promotionIdParamSchema, 'params'), validate(updatePromotionSchema), updatePromotionController);
router.delete('/:promotionId', ...adminOnly, validate(promotionIdParamSchema, 'params'), deletePromotionController);

export { router as promotionsRouter };
