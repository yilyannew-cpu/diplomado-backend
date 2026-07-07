import { Router } from 'express';
import { listRestaurantsController } from '../controllers/restaurantsController';

const router = Router();

// Public route to list all restaurants
router.get('/', listRestaurantsController);

export { router as restaurantsRouter };
