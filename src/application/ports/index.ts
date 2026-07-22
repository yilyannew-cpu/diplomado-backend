import { User, PublicUser } from '../../domain/entities/User';
import { Restaurant } from '../../domain/entities/Restaurant';
import { CourierApplication } from '../../domain/entities/CourierApplication';
import { Role, UserStatus, ApplicationStatus } from '../../domain/enums';

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  phone?: string | null;
  vehicle?: string | null;
  documentId?: string | null;
  comuna?: string | null;
  status?: UserStatus;
  restaurantId?: string | null;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: string | null;
  vehicle?: string | null;
  documentId?: string | null;
  comuna?: string | null;
  avatar?: string | null;
  role?: Role;
  status?: UserStatus;
  restaurantId?: string | null;
  passwordHash?: string;
  isAvailable?: boolean;
}

export interface ListUsersFilters {
  role?: Role;
  status?: UserStatus;
  q?: string;
}

export interface PendingUserWithRestaurant extends PublicUser {
  restaurant?: {
    id: string;
    name: string;
    city: string;
    address: string;
    status: string;
    logo?: string | null;
  } | null;
}

export interface ListedPublicUser extends PublicUser {
  restaurantName?: string | null;
  restaurantLogo?: string | null;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  emailExists(email: string): Promise<boolean>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User>;
  listPending(): Promise<PendingUserWithRestaurant[]>;
  list(filters: ListUsersFilters): Promise<ListedPublicUser[]>;
}

export interface CreateRestaurantData {
  name: string;
  tagline?: string | null;
  city: string;
  address: string;
  deliveryMinutes?: number;
  initials: string;
  status?: import('../../domain/enums').RestaurantStatus;
}

export interface UpdateRestaurantData {
  name?: string;
  tagline?: string | null;
  city?: string;
  address?: string;
  deliveryMinutes?: number;
  monthlyGoal?: number | null;
  dailyGoal?: number | null;
  accent?: string;
  logo?: string | null;
  coverImage?: string | null;
}

export interface IRestaurantRepository {
  findById(id: string): Promise<Restaurant | null>;
  listAll(): Promise<Restaurant[]>;
  /** Solo activos y sin admin suspendido (catálogo cliente). */
  listActiveForClient(): Promise<Restaurant[]>;
  create(data: CreateRestaurantData): Promise<Restaurant>;
  update(id: string, data: UpdateRestaurantData): Promise<Restaurant>;
  updateStatus(id: string, status: import('../../domain/enums').RestaurantStatus): Promise<Restaurant>;
  createWithAdminUser(
    restaurantData: CreateRestaurantData,
    userData: Omit<CreateUserData, 'restaurantId'>
  ): Promise<{ user: User; restaurant: Restaurant }>;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface ITokenService {
  sign(payload: TokenPayload): string;
  verify(token: string): TokenPayload;
}

export interface IHashService {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}

export interface UserReportData {
  id: string;
  reportedUser: string;
  reportedBy: string;
  reason: string;
  createdAt: Date;
}

export interface CreateUserReportData {
  reportedUser: string;
  reportedBy: string;
  reason: string;
}

export interface IUserReportRepository {
  create(data: CreateUserReportData): Promise<UserReportData>;
  listAll(): Promise<UserReportData[]>;
}

export interface ICourierApplicationRepository {
  create(courierId: string, restaurantId: string): Promise<CourierApplication>;
  findById(id: string): Promise<CourierApplication | null>;
  findExisting(courierId: string, restaurantId: string): Promise<CourierApplication | null>;
  updateStatus(id: string, status: ApplicationStatus): Promise<CourierApplication>;
  listByRestaurant(restaurantId: string): Promise<CourierApplication[]>;
  listByCourier(courierId: string): Promise<CourierApplication[]>;
}
