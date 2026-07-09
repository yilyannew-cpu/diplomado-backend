import { IHashService, IUserRepository } from '../../ports';
import { DomainError, NotFoundError } from '../../../domain/errors';
import { toPublicUser } from '../../../domain/entities/User';

export interface ChangePasswordInput {
  currentPassword: string;
  password: string;
}

export class ChangePasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly hashService: IHashService
  ) {}

  async execute(userId: string, input: ChangePasswordInput) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    const valid = await this.hashService.compare(input.currentPassword, user.passwordHash);
    if (!valid) {
      throw new DomainError('INVALID_PASSWORD', 'La contraseña actual es incorrecta', 400, [
        { field: 'current_password', message: 'La contraseña actual es incorrecta' },
      ]);
    }

    const passwordHash = await this.hashService.hash(input.password);
    const updated = await this.userRepository.update(userId, { passwordHash });

    return toPublicUser(updated);
  }
}
