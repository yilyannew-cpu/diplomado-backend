import { PrismaUserRepository } from './infrastructure/repositories/PrismaUserRepository';
import { PrismaRestaurantRepository } from './infrastructure/repositories/PrismaRestaurantRepository';
import { PrismaProductRepository } from './infrastructure/repositories/PrismaProductRepository';
import { PrismaOrderRepository } from './infrastructure/repositories/PrismaOrderRepository';
import { BcryptHashService } from './infrastructure/services/BcryptHashService';
import { JwtTokenService } from './infrastructure/services/JwtTokenService';
import { LoginUseCase } from './application/use-cases/auth/LoginUseCase';
import { GetMeUseCase } from './application/use-cases/auth/GetMeUseCase';
import { LogoutUseCase } from './application/use-cases/auth/LogoutUseCase';
import { RegisterClientUseCase } from './application/use-cases/auth/RegisterClientUseCase';
import { RegisterRestaurantUseCase } from './application/use-cases/auth/RegisterRestaurantUseCase';
import { RegisterCourierUseCase } from './application/use-cases/auth/RegisterCourierUseCase';
import { CreateUserUseCase } from './application/use-cases/users/CreateUserUseCase';
import { ApproveUserUseCase } from './application/use-cases/users/ApproveUserUseCase';
import { RejectUserUseCase } from './application/use-cases/users/RejectUserUseCase';
import { ListPendingRegistrationsUseCase } from './application/use-cases/users/ListPendingRegistrationsUseCase';
import { ListRestaurantsUseCase } from './application/use-cases/restaurants/ListRestaurantsUseCase';
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
  ToggleAvailabilityUseCase
} from './application/use-cases/products/ProductUseCases';
import {
  CreateOrderUseCase,
  ListRestaurantOrdersUseCase,
  UpdateOrderStatusUseCase,
  AssignCourierUseCase,
  ListAvailableDeliveriesUseCase,
  ListCourierOrdersUseCase
} from './application/use-cases/orders/OrderUseCases';

const userRepository = new PrismaUserRepository();
const restaurantRepository = new PrismaRestaurantRepository();
const productRepository = new PrismaProductRepository();
const orderRepository = new PrismaOrderRepository();
const hashService = new BcryptHashService();
const tokenService = new JwtTokenService();

export const container = {
  userRepository,
  restaurantRepository,
  productRepository,
  orderRepository,
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
  createUserUseCase: new CreateUserUseCase(userRepository, hashService),
  approveUserUseCase: new ApproveUserUseCase(userRepository, restaurantRepository),
  rejectUserUseCase: new RejectUserUseCase(userRepository, restaurantRepository),
  listPendingUseCase: new ListPendingRegistrationsUseCase(userRepository),
  listUsersUseCase: new ListUsersUseCase(userRepository),
  getUserByIdUseCase: new GetUserByIdUseCase(userRepository),
  updateUserUseCase: new UpdateUserUseCase(userRepository),
  
  // Restaurant Use Cases
  listRestaurantsUseCase: new ListRestaurantsUseCase(restaurantRepository),
  
  // Product Use Cases
  listProductsUseCase: new ListProductsUseCase(productRepository),
  getProductUseCase: new GetProductUseCase(productRepository),
  createProductUseCase: new CreateProductUseCase(productRepository),
  updateProductUseCase: new UpdateProductUseCase(productRepository),
  toggleAvailabilityUseCase: new ToggleAvailabilityUseCase(productRepository),

  // Order Use Cases
  createOrderUseCase: new CreateOrderUseCase(orderRepository, productRepository),
  listRestaurantOrdersUseCase: new ListRestaurantOrdersUseCase(orderRepository),
  updateOrderStatusUseCase: new UpdateOrderStatusUseCase(orderRepository),
  assignCourierUseCase: new AssignCourierUseCase(orderRepository),
  listAvailableDeliveriesUseCase: new ListAvailableDeliveriesUseCase(orderRepository),
  listCourierOrdersUseCase: new ListCourierOrdersUseCase(orderRepository),
};
