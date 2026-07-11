import { Role, UserStatus } from '../enums';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  phone: string | null;
  vehicle: string | null;
  documentId: string | null;
  avatar: string | null;
  comuna: string | null;
  status: UserStatus;
  restaurantId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type PublicUser = Omit<User, 'passwordHash'>;

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _, ...publicUser } = user;
  return publicUser;
}
