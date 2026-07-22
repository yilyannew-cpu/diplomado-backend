import { IUserRepository } from '../../ports';
import { Role } from '../../../domain/enums';
import { DomainError, ForbiddenError, NotFoundError } from '../../../domain/errors';
import { loadCourierActiveOrders } from '../../../shared/courierLimits';
import { toPublicUser } from '../../../domain/entities/User';

/**
 * Domiciliario enciende/apaga su turno (Buscando / Desconectado).
 * No puede ponerse disponible si tiene pedidos EnCamino.
 */
export class SetCourierAvailabilityUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(courierId: string, isAvailable: boolean) {
    const user = await this.userRepo.findById(courierId);
    if (!user) throw new NotFoundError('Usuario no encontrado');
    if (user.role !== Role.DOMICILIARIO) {
      throw new ForbiddenError('NOT_COURIER', 'Solo domiciliarios pueden cambiar disponibilidad');
    }

    if (isAvailable) {
      const load = await loadCourierActiveOrders(courierId);
      if (load.enCamino.length > 0) {
        throw new DomainError(
          'COURIER_ON_DELIVERY',
          'No puedes ponerte disponible mientras tienes pedidos en ruta. Entrégalos primero.',
        );
      }
    }

    const updated = await this.userRepo.update(courierId, { isAvailable });
    return toPublicUser(updated);
  }
}

/** Fuerza desconectado al salir a entregar. */
export async function markCourierUnavailableOnDelivery(
  userRepo: IUserRepository,
  courierId: string,
): Promise<void> {
  await userRepo.update(courierId, { isAvailable: false });
}

/** Reactiva el turno cuando ya no quedan pedidos EnCamino. */
export async function markCourierAvailableIfIdle(
  userRepo: IUserRepository,
  courierId: string,
): Promise<void> {
  const load = await loadCourierActiveOrders(courierId);
  if (load.enCamino.length === 0) {
    await userRepo.update(courierId, { isAvailable: true });
  }
}
