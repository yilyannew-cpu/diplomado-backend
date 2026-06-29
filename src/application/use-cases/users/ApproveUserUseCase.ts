import { IUserRepository, IRestaurantRepository } from '../../ports';
import { NotFoundError, ConflictError } from '../../../domain/errors';
import { Role, UserStatus, RestaurantStatus } from '../../../domain/enums';

export class ApproveUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly restaurantRepository: IRestaurantRepository
  ) {}

  async execute(userId: string) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    if (user.status !== UserStatus.PENDIENTE) {
      throw new ConflictError('Solo se pueden aprobar usuarios con estado Pendiente');
    }

    const updated = await this.userRepository.update(userId, { status: UserStatus.ACTIVO });

    if (user.role === Role.ADMIN && user.restaurantId) {
      await this.restaurantRepository.updateStatus(user.restaurantId, RestaurantStatus.ACTIVO);
    }

    return {
      message: 'Usuario aprobado exitosamente',
      data: { id: updated.id, status: updated.status },
    };
  }
}
