import { IRestaurantRepository, UpdateRestaurantData } from '../../ports';
import { NotFoundError } from '../../../domain/errors';

export class GetRestaurantUseCase {
  constructor(private restaurantRepo: IRestaurantRepository) {}

  async execute(id: string) {
    const restaurant = await this.restaurantRepo.findById(id);
    if (!restaurant) throw new NotFoundError('Restaurante no encontrado');
    return restaurant;
  }
}

export class UpdateRestaurantUseCase {
  constructor(private restaurantRepo: IRestaurantRepository) {}

  async execute(id: string, data: UpdateRestaurantData) {
    const restaurant = await this.restaurantRepo.findById(id);
    if (!restaurant) throw new NotFoundError('Restaurante no encontrado');
    return this.restaurantRepo.update(id, data);
  }
}
