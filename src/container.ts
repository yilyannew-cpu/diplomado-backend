import { PrismaUserRepository } from './infrastructure/repositories/PrismaUserRepository';
import { PrismaRestaurantRepository } from './infrastructure/repositories/PrismaRestaurantRepository';
import { PrismaProductRepository } from './infrastructure/repositories/PrismaProductRepository';
import { PrismaCategoryRepository } from './infrastructure/repositories/PrismaCategoryRepository';
import { PrismaOrderRepository } from './infrastructure/repositories/PrismaOrderRepository';
import { PrismaPromotionRepository } from './infrastructure/repositories/PrismaPromotionRepository';
import { PrismaAnalyticsRepository } from './infrastructure/repositories/PrismaAnalyticsRepository';
import { PrismaOperationsRepository } from './infrastructure/repositories/PrismaOperationsRepository';
import { PrismaUserReportRepository } from './infrastructure/repositories/PrismaUserReportRepository';
import { PrismaCourierApplicationRepository } from './infrastructure/repositories/PrismaCourierApplicationRepository';
import { BcryptHashService } from './infrastructure/services/BcryptHashService';
import { JwtTokenService } from './infrastructure/services/JwtTokenService';
import { LoginUseCase } from './application/use-cases/auth/LoginUseCase';
import { GetMeUseCase } from './application/use-cases/auth/GetMeUseCase';
import { LogoutUseCase } from './application/use-cases/auth/LogoutUseCase';
import { RegisterClientUseCase } from './application/use-cases/auth/RegisterClientUseCase';
import { RegisterRestaurantUseCase } from './application/use-cases/auth/RegisterRestaurantUseCase';
import { RegisterCourierUseCase } from './application/use-cases/auth/RegisterCourierUseCase';
import { UpdateProfileUseCase } from './application/use-cases/auth/UpdateProfileUseCase';
import { ChangePasswordUseCase } from './application/use-cases/auth/ChangePasswordUseCase';
import { CreateUserUseCase } from './application/use-cases/users/CreateUserUseCase';
import { ApproveUserUseCase } from './application/use-cases/users/ApproveUserUseCase';
import { RejectUserUseCase } from './application/use-cases/users/RejectUserUseCase';
import { ListPendingRegistrationsUseCase } from './application/use-cases/users/ListPendingRegistrationsUseCase';
import { ListRestaurantsUseCase } from './application/use-cases/restaurants/ListRestaurantsUseCase';
import { GetRestaurantUseCase, UpdateRestaurantUseCase } from './application/use-cases/restaurants/RestaurantUseCases';
import {
  ListUsersUseCase,
  GetUserByIdUseCase,
  UpdateUserUseCase,
} from './application/use-cases/users/UserManagementUseCases';
import {
  ListProductsUseCase,
  GetProductUseCase,
  CreateProductUseCase,
  UpdateProductUseCase,
  ToggleAvailabilityUseCase,
  DeleteProductUseCase,
  UpdateProductImageUseCase,
  SetProductIngredientsUseCase,
  SetProductModifierGroupsUseCase,
} from './application/use-cases/products/ProductUseCases';
import {
  ListCategoriesUseCase,
  CreateCategoryUseCase,
  UpdateCategoryUseCase,
  DeleteCategoryUseCase,
  UpdateCategoryImageUseCase,
} from './application/use-cases/categories/CategoryUseCases';
import {
  CreateOrderUseCase,
  ListRestaurantOrdersUseCase,
  UpdateOrderStatusUseCase,
  AssignCourierUseCase,
  BatchAssignCourierUseCase,
  BatchDispatchOrdersUseCase,
  ListAvailableDeliveriesUseCase,
  ListCourierOrdersUseCase,
  GetOrderByCodeUseCase,
  GetMyActiveOrderUseCase,
} from './application/use-cases/orders/OrderUseCases';
import {
  AcceptDeliveryUseCase,
  StartDeliveryUseCase,
  CompleteDeliveryUseCase,
  ListMyCourierOrdersUseCase,
  ListCourierAvailableDeliveriesUseCase,
  UpdateOrderStatusSecureUseCase,
} from './application/use-cases/orders/CourierDeliveryUseCases';
import {
  GetCourierRatingUseCase,
  GetDeliveryReviewStatusUseCase,
  SubmitDeliveryReviewUseCase,
} from './application/use-cases/orders/DeliveryReviewUseCases';
import {
  ListPromotionsUseCase,
  ListActivePromotionsUseCase,
  GetPromotionUseCase,
  CreatePromotionUseCase,
  UpdatePromotionUseCase,
  DeletePromotionUseCase,
} from './application/use-cases/promotions/PromotionUseCases';
import {
  GetRestaurantDashboardUseCase,
  GetSalesReportUseCase,
  GetMonthlySalesUseCase,
  GetCourierPayoutsUseCase,
  ExportSalesCsvUseCase,
  ListReviewsUseCase,
  CreateReviewUseCase,
  GetActiveDeliveriesUseCase,
  ListDispatchesUseCase,
  GetDispatchSummaryUseCase,
  ListAvailableCouriersUseCase,
} from './application/use-cases/analytics/AnalyticsUseCases';
import {
  GetDashboardMetricsUseCase,
  GetSystemStatusUseCase,
  ListOrdersUseCase,
  ListActiveCouriersUseCase,
  GetOperationsMetricsUseCase,
} from './application/use-cases/operations/OperationsUseCases';
import { RejectPaymentUseCase } from './application/use-cases/orders/RejectPaymentUseCase';
import { CreateUserReportUseCase } from './application/use-cases/reports/CreateUserReportUseCase';
import { ListUserReportsUseCase } from './application/use-cases/reports/ListUserReportsUseCase';
import {
  ApplyToRestaurantUseCase,
  ReviewApplicationUseCase,
  ListApplicationsUseCase,
} from './application/use-cases/courier-applications/CourierApplicationUseCases';

const userRepository = new PrismaUserRepository();
const restaurantRepository = new PrismaRestaurantRepository();
const productRepository = new PrismaProductRepository();
const categoryRepository = new PrismaCategoryRepository();
const orderRepository = new PrismaOrderRepository();
const promotionRepository = new PrismaPromotionRepository();
const analyticsRepository = new PrismaAnalyticsRepository();
const operationsRepository = new PrismaOperationsRepository();
const userReportRepository = new PrismaUserReportRepository();
const courierApplicationRepository = new PrismaCourierApplicationRepository();
const hashService = new BcryptHashService();
const tokenService = new JwtTokenService();

export const container = {
  userRepository,
  restaurantRepository,
  productRepository,
  categoryRepository,
  orderRepository,
  promotionRepository,
  analyticsRepository,
  hashService,
  tokenService,
  loginUseCase: new LoginUseCase(userRepository, hashService, tokenService),
  getMeUseCase: new GetMeUseCase(userRepository),
  logoutUseCase: new LogoutUseCase(),
  registerClientUseCase: new RegisterClientUseCase(userRepository, hashService, tokenService),
  registerRestaurantUseCase: new RegisterRestaurantUseCase(
    restaurantRepository,
    hashService,
    (email) => userRepository.emailExists(email)
  ),
  registerCourierUseCase: new RegisterCourierUseCase(userRepository, hashService),
  updateProfileUseCase: new UpdateProfileUseCase(userRepository),
  changePasswordUseCase: new ChangePasswordUseCase(userRepository, hashService),
  createUserUseCase: new CreateUserUseCase(userRepository, hashService),
  approveUserUseCase: new ApproveUserUseCase(userRepository, restaurantRepository),
  rejectUserUseCase: new RejectUserUseCase(userRepository, restaurantRepository),
  listPendingUseCase: new ListPendingRegistrationsUseCase(userRepository),
  listUsersUseCase: new ListUsersUseCase(userRepository),
  getUserByIdUseCase: new GetUserByIdUseCase(userRepository),
  updateUserUseCase: new UpdateUserUseCase(userRepository, restaurantRepository),
  listRestaurantsUseCase: new ListRestaurantsUseCase(restaurantRepository),
  getRestaurantUseCase: new GetRestaurantUseCase(restaurantRepository),
  updateRestaurantUseCase: new UpdateRestaurantUseCase(restaurantRepository),

  listProductsUseCase: new ListProductsUseCase(productRepository),
  getProductUseCase: new GetProductUseCase(productRepository),
  createProductUseCase: new CreateProductUseCase(productRepository),
  updateProductUseCase: new UpdateProductUseCase(productRepository),
  toggleAvailabilityUseCase: new ToggleAvailabilityUseCase(productRepository),
  deleteProductUseCase: new DeleteProductUseCase(productRepository),
  updateProductImageUseCase: new UpdateProductImageUseCase(productRepository),
  setProductIngredientsUseCase: new SetProductIngredientsUseCase(productRepository),
  setProductModifierGroupsUseCase: new SetProductModifierGroupsUseCase(productRepository),

  listCategoriesUseCase: new ListCategoriesUseCase(categoryRepository),
  createCategoryUseCase: new CreateCategoryUseCase(categoryRepository),
  updateCategoryUseCase: new UpdateCategoryUseCase(categoryRepository),
  deleteCategoryUseCase: new DeleteCategoryUseCase(categoryRepository),
  updateCategoryImageUseCase: new UpdateCategoryImageUseCase(categoryRepository),

  createOrderUseCase: new CreateOrderUseCase(orderRepository, productRepository),
  listRestaurantOrdersUseCase: new ListRestaurantOrdersUseCase(orderRepository),
  updateOrderStatusUseCase: new UpdateOrderStatusUseCase(orderRepository),
  assignCourierUseCase: new AssignCourierUseCase(orderRepository),
  batchAssignCourierUseCase: new BatchAssignCourierUseCase(orderRepository),
  batchDispatchOrdersUseCase: new BatchDispatchOrdersUseCase(orderRepository),
  listAvailableDeliveriesUseCase: new ListAvailableDeliveriesUseCase(orderRepository),
  listCourierOrdersUseCase: new ListCourierOrdersUseCase(orderRepository),
  getOrderByCodeUseCase: new GetOrderByCodeUseCase(orderRepository),
  getMyActiveOrderUseCase: new GetMyActiveOrderUseCase(orderRepository, userRepository),
  acceptDeliveryUseCase: new AcceptDeliveryUseCase(orderRepository, userRepository),
  startDeliveryUseCase: new StartDeliveryUseCase(orderRepository),
  completeDeliveryUseCase: new CompleteDeliveryUseCase(orderRepository),
  listMyCourierOrdersUseCase: new ListMyCourierOrdersUseCase(orderRepository),
  listCourierAvailableDeliveriesUseCase: new ListCourierAvailableDeliveriesUseCase(
    orderRepository,
    userRepository,
  ),
  updateOrderStatusSecureUseCase: new UpdateOrderStatusSecureUseCase(orderRepository),
  getDeliveryReviewStatusUseCase: new GetDeliveryReviewStatusUseCase(orderRepository),
  submitDeliveryReviewUseCase: new SubmitDeliveryReviewUseCase(orderRepository),
  getCourierRatingUseCase: new GetCourierRatingUseCase(),

  listPromotionsUseCase: new ListPromotionsUseCase(promotionRepository),
  listActivePromotionsUseCase: new ListActivePromotionsUseCase(promotionRepository),
  getPromotionUseCase: new GetPromotionUseCase(promotionRepository),
  createPromotionUseCase: new CreatePromotionUseCase(promotionRepository, productRepository),
  updatePromotionUseCase: new UpdatePromotionUseCase(promotionRepository, productRepository),
  deletePromotionUseCase: new DeletePromotionUseCase(promotionRepository),

  getRestaurantDashboardUseCase: new GetRestaurantDashboardUseCase(analyticsRepository),
  getSalesReportUseCase: new GetSalesReportUseCase(analyticsRepository),
  getMonthlySalesUseCase: new GetMonthlySalesUseCase(analyticsRepository),
  getCourierPayoutsUseCase: new GetCourierPayoutsUseCase(analyticsRepository),
  exportSalesCsvUseCase: new ExportSalesCsvUseCase(analyticsRepository),
  listReviewsUseCase: new ListReviewsUseCase(analyticsRepository),
  createReviewUseCase: new CreateReviewUseCase(analyticsRepository, restaurantRepository),
  getActiveDeliveriesUseCase: new GetActiveDeliveriesUseCase(analyticsRepository),
  listDispatchesUseCase: new ListDispatchesUseCase(analyticsRepository),
  getDispatchSummaryUseCase: new GetDispatchSummaryUseCase(analyticsRepository),
  listAvailableCouriersUseCase: new ListAvailableCouriersUseCase(analyticsRepository),

  getDashboardMetricsUseCase: new GetDashboardMetricsUseCase(operationsRepository),
  getSystemStatusUseCase: new GetSystemStatusUseCase(operationsRepository),
  listOrdersUseCase: new ListOrdersUseCase(operationsRepository),
  listActiveCouriersUseCase: new ListActiveCouriersUseCase(operationsRepository),
  getOperationsMetricsUseCase: new GetOperationsMetricsUseCase(operationsRepository),
  
  // Fraud Reports
  createUserReportUseCase: new CreateUserReportUseCase(userReportRepository),
  listUserReportsUseCase: new ListUserReportsUseCase(userReportRepository),
  
  // Payment
  rejectPaymentUseCase: new RejectPaymentUseCase(orderRepository),

  // Courier Applications
  courierApplicationRepository,
  applyToRestaurantUseCase: new ApplyToRestaurantUseCase(courierApplicationRepository),
  reviewApplicationUseCase: new ReviewApplicationUseCase(courierApplicationRepository),
  listApplicationsUseCase: new ListApplicationsUseCase(courierApplicationRepository),
};
