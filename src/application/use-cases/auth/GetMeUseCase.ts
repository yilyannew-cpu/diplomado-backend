import { IUserRepository } from '../../ports';
import { NotFoundError } from '../../../domain/errors';
import { toPublicUser } from '../../../domain/entities/User';

export class GetMeUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }
    return toPublicUser(user);
  }
}
