import { Router } from 'express';
import { container } from '../../../container';
import { createAuthenticateMiddleware, authorize } from '../middleware/auth';
import { uploadImage } from '../../../infrastructure/services/UploadService';
import { uploadImageController } from '../controllers/uploadsController';
import { Role } from '../../../domain/enums';

const router = Router();
const authenticate = createAuthenticateMiddleware(container.tokenService);
const adminOnly = [authenticate, authorize(Role.ADMIN, Role.SUPERADMIN)];

router.post('/images', ...adminOnly, uploadImage.single('file'), uploadImageController);

export { router as uploadsRouter };
