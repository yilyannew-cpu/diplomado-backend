import { ICourierApplicationRepository } from '../../ports';
import { ApplicationStatus } from '../../../domain/enums';
import { ConflictError, NotFoundError } from '../../../domain/errors';

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
 */
export class ReviewApplicationUseCase {
  constructor(private repo: ICourierApplicationRepository) {}

  async execute(applicationId: string, status: ApplicationStatus) {
    const app = await this.repo.findById(applicationId);
    if (!app) {
      throw new NotFoundError('Solicitud no encontrada.');
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
