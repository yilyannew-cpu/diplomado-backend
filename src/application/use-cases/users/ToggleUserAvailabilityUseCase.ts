import { IUserRepository } from '../../ports';
import { NotFoundError } from '../../../domain/errors';

export class ToggleUserAvailabilityUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string, isAvailable: boolean) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    return this.userRepository.update(userId, { isAvailable });
  }
}
