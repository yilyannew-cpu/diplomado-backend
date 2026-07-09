import { IUserRepository } from '../../ports';
import { ConflictError, ForbiddenError, NotFoundError } from '../../../domain/errors';
import { Role } from '../../../domain/enums';
import { toPublicUser } from '../../../domain/entities/User';

export interface UpdateProfileInput {
  email?: string;
  phone?: string;
}

export class UpdateProfileUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string, role: Role, input: UpdateProfileInput) {
    if (role === Role.ADMIN) {
      throw new ForbiddenError(
        'PROFILE_UPDATE_FORBIDDEN',
        'Los administradores de restaurante solo pueden actualizar su contraseña'
      );
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    if (input.email && input.email.toLowerCase() !== user.email) {
      const exists = await this.userRepository.emailExists(input.email.toLowerCase());
      if (exists) {
        throw new ConflictError('El email ya está registrado', [
          { field: 'email', message: 'El email ya está registrado' },
        ]);
      }
    }

    const updated = await this.userRepository.update(userId, {
      ...(input.email !== undefined && { email: input.email.toLowerCase().trim() }),
      ...(input.phone !== undefined && { phone: input.phone.trim() }),
    });

    return toPublicUser(updated);
  }
}
