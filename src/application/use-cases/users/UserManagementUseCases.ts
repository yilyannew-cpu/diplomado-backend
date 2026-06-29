import { IUserRepository, ListUsersFilters } from '../../ports';
import { NotFoundError, ConflictError } from '../../../domain/errors';
import { Role } from '../../../domain/enums';
import { toPublicUser } from '../../../domain/entities/User';

export class ListUsersUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(filters: ListUsersFilters) {
    const data = await this.userRepository.list(filters);
    return { data };
  }
}

export class GetUserByIdUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }
    return toPublicUser(user);
  }
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  phone?: string | null;
  vehicle?: string | null;
  role?: Role;
  status?: import('../../../domain/enums').UserStatus;
  restaurantId?: string | null;
}

export class UpdateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(id: string, input: UpdateUserInput, requesterRole: Role) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    if (input.role === Role.SUPERADMIN && requesterRole !== Role.SUPERADMIN) {
      throw new ConflictError('Solo un superadmin puede asignar rol superadmin');
    }

    if (input.email && input.email.toLowerCase() !== user.email) {
      const exists = await this.userRepository.emailExists(input.email.toLowerCase());
      if (exists) {
        throw new ConflictError('El email ya está registrado', [
          { field: 'email', message: 'El email ya está registrado' },
        ]);
      }
    }

    const updated = await this.userRepository.update(id, {
      name: input.name?.trim(),
      email: input.email?.toLowerCase().trim(),
      phone: input.phone,
      vehicle: input.vehicle,
      role: input.role,
      status: input.status,
      restaurantId: input.restaurantId,
    });

    return toPublicUser(updated);
  }
}
