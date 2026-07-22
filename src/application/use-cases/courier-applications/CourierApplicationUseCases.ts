import { ICourierApplicationRepository } from '../../ports';
import { ApplicationStatus, Role } from '../../../domain/enums';
import { ConflictError, ForbiddenError, NotFoundError } from '../../../domain/errors';

/**
 * Domiciliario se postula a un restaurante.
 * Valida que no exista ya una solicitud previa para el mismo restaurante.
 */
export class ApplyToRestaurantUseCase {
  constructor(private repo: ICourierApplicationRepository) {}

  async execute(courierId: string, restaurantId: string) {
    const existing = await this.repo.findExisting(courierId, restaurantId);
    if (existing) {
      throw new ConflictError('Ya tienes una solicitud para este restaurante.');
    }
    return this.repo.create(courierId, restaurantId);
  }
}

/**
 * Admin del restaurante acepta o rechaza una solicitud.
 * Si el actor es admin de sede, solo puede revisar postulaciones de su restaurante.
 */
export class ReviewApplicationUseCase {
  constructor(
    private repo: ICourierApplicationRepository,
    private userRepo: { findById(id: string): Promise<{ role: string; restaurantId?: string | null } | null> },
  ) {}

  async execute(
    applicationId: string,
    status: ApplicationStatus,
    actor?: { id: string; role: string },
  ) {
    const app = await this.repo.findById(applicationId);
    if (!app) {
      throw new NotFoundError('Solicitud no encontrada.');
    }

    if (actor && actor.role !== Role.SUPERADMIN) {
      const admin = await this.userRepo.findById(actor.id);
      if (!admin?.restaurantId || admin.restaurantId !== app.restaurantId) {
        throw new ForbiddenError(
          'FORBIDDEN_RESTAURANT',
          'Solo puedes gestionar postulaciones de tu restaurante.',
        );
      }
    }

    return this.repo.updateStatus(applicationId, status);
  }
}

/**
 * Lista solicitudes filtradas por restaurantId o courierId.
 */
export class ListApplicationsUseCase {
  constructor(private repo: ICourierApplicationRepository) {}

  async execute(params: { restaurantId?: string; courierId?: string }) {
    if (params.restaurantId) {
      return this.repo.listByRestaurant(params.restaurantId);
    }
    if (params.courierId) {
      return this.repo.listByCourier(params.courierId);
    }
    return [];
  }
}
