import { PrismaUserRepository } from './infrastructure/repositories/PrismaUserRepository';
import { PrismaRestaurantRepository } from './infrastructure/repositories/PrismaRestaurantRepository';
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
import {
  ListUsersUseCase,
  GetUserByIdUseCase,
  UpdateUserUseCase,
} from './application/use-cases/users/UserManagementUseCases';

const userRepository = new PrismaUserRepository();
const restaurantRepository = new PrismaRestaurantRepository();
const hashService = new BcryptHashService();
const tokenService = new JwtTokenService();

export const container = {
  userRepository,
  restaurantRepository,
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
};
