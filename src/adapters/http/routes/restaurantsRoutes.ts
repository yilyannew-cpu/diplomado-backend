import { Router } from 'express';
import { container } from '../../../container';
import { createAuthenticateMiddleware, authorize } from '../middleware/auth';
import { requireRestaurantAccess } from '../middleware/restaurantAccess';
import { validate } from '../middleware/validate';
import { uploadImage } from '../../../infrastructure/services/UploadService';
import {
  restaurantIdParamSchema,
  updateRestaurantSchema,
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema,
  createPromotionSchema,
  updatePromotionSchema,
  promotionIdParamSchema,
  reviewsQuerySchema,
  createReviewSchema,
  salesReportQuerySchema,
  dateRangeQuerySchema,
  dispatchQuerySchema,
  couriersAvailableQuerySchema,
} from '../dto/schemas';
import { listRestaurantsController } from '../controllers/restaurantsController';
import {
  getRestaurantController,
  updateRestaurantController,
  uploadRestaurantLogoController,
  getDashboardController,
  listReviewsController,
  createReviewController,
  getSalesReportController,
  getMonthlySalesController,
  getCourierPayoutsController,
  exportSalesCsvController,
  getActiveDeliveriesController,
  listDispatchesController,
  getDispatchSummaryController,
  listAvailableCouriersController,
} from '../controllers/restaurantAdminController';
import {
  listCategoriesController,
  createCategoryController,
} from '../controllers/categoriesController';
import {
  listPromotionsController,
  listActivePromotionsController,
  createPromotionController,
} from '../controllers/promotionsController';
import { Role } from '../../../domain/enums';

const router = Router();
const authenticate = createAuthenticateMiddleware(container.tokenService);
const adminOnly = [authenticate, authorize(Role.ADMIN, Role.SUPERADMIN)];
const adminRestaurant = [...adminOnly, validate(restaurantIdParamSchema, 'params'), requireRestaurantAccess()];

router.get('/', listRestaurantsController);

// Público — portal cliente (sin auth)
router.get('/:restaurantId/categories', validate(restaurantIdParamSchema, 'params'), listCategoriesController);
router.get(
  '/:restaurantId/promotions/active',
  validate(restaurantIdParamSchema, 'params'),
  listActivePromotionsController
);
router.get(
  '/:restaurantId/reviews',
  validate(restaurantIdParamSchema, 'params'),
  validate(reviewsQuerySchema, 'query'),
  listReviewsController
);
router.post(
  '/:restaurantId/reviews',
  validate(restaurantIdParamSchema, 'params'),
  validate(createReviewSchema),
  createReviewController
);

router.get('/:restaurantId', ...adminRestaurant, getRestaurantController);
router.patch('/:restaurantId', ...adminRestaurant, validate(updateRestaurantSchema), updateRestaurantController);
router.post(
  '/:restaurantId/logo',
  ...adminRestaurant,
  uploadImage.single('file'),
  uploadRestaurantLogoController
);

router.get('/:restaurantId/dashboard', ...adminRestaurant, getDashboardController);

router.get('/:restaurantId/reports/sales', ...adminRestaurant, validate(salesReportQuerySchema, 'query'), getSalesReportController);
router.get('/:restaurantId/reports/sales/monthly', ...adminRestaurant, getMonthlySalesController);
router.get('/:restaurantId/reports/courier-payouts', ...adminRestaurant, validate(dateRangeQuerySchema, 'query'), getCourierPayoutsController);
router.get('/:restaurantId/reports/sales/export', ...adminRestaurant, validate(dateRangeQuerySchema, 'query'), exportSalesCsvController);

router.get('/:restaurantId/categories', ...adminRestaurant, listCategoriesController);
router.post('/:restaurantId/categories', ...adminRestaurant, validate(createCategorySchema), createCategoryController);

router.get('/:restaurantId/promotions', ...adminRestaurant, listPromotionsController);
router.post('/:restaurantId/promotions', ...adminRestaurant, validate(createPromotionSchema), createPromotionController);

router.get('/:restaurantId/deliveries/active', ...adminRestaurant, getActiveDeliveriesController);
router.get('/:restaurantId/dispatches', ...adminRestaurant, validate(dispatchQuerySchema, 'query'), listDispatchesController);
router.get('/:restaurantId/dispatches/summary', ...adminRestaurant, getDispatchSummaryController);
router.get('/:restaurantId/couriers/available', ...adminRestaurant, validate(couriersAvailableQuerySchema, 'query'), listAvailableCouriersController);

export { router as restaurantsRouter };
