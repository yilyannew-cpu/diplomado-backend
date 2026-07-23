import { IUserRepository } from '../../ports';
import { ConflictError, DomainError, ForbiddenError, NotFoundError } from '../../../domain/errors';
import { Role } from '../../../domain/enums';
import { toPublicUser } from '../../../domain/entities/User';
import { PrismaCatalogRepository } from '../../../infrastructure/repositories/PrismaCatalogRepository';

export interface UpdateProfileInput {
  email?: string;
  phone?: string;
  comuna?: string;
  avatar?: string;
}

export class UpdateProfileUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly catalogRepository: PrismaCatalogRepository,
  ) {}

  async execute(userId: string, role: Role, input: UpdateProfileInput) {
    if (role === Role.ADMIN && input.avatar === undefined) {
      throw new ForbiddenError(
        'PROFILE_UPDATE_FORBIDDEN',
        'Los administradores de restaurante solo pueden actualizar su contraseña'
      );
    }

    // Avatar de perfil: permitido para domiciliario (y cliente); admin no cambia identidad de restaurante aquí.
    if (role === Role.ADMIN && input.avatar !== undefined) {
      throw new ForbiddenError(
        'PROFILE_AVATAR_FORBIDDEN',
        'Los administradores de restaurante no actualizan avatar de perfil aquí'
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

    let comuna = input.comuna;
    if (comuna !== undefined) {
      comuna = comuna.trim();
      if (!(await this.catalogRepository.isValidComunaCode(comuna))) {
        throw new DomainError('VALIDATION_ERROR', 'Selecciona una comuna válida', 400, [
          { field: 'comuna', message: 'Selecciona una comuna válida' },
        ]);
      }
    }

    const updated = await this.userRepository.update(userId, {
      ...(input.email !== undefined && { email: input.email.toLowerCase().trim() }),
      ...(input.phone !== undefined && { phone: input.phone.trim() }),
      ...(comuna !== undefined && { comuna }),
      ...(input.avatar !== undefined && { avatar: input.avatar }),
    });

    return toPublicUser(updated);
  }
}
