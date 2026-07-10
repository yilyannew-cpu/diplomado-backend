import { IRestaurantRepository } from '../../ports';

/** Catálogo público: solo restaurantes activos (y sin admin suspendido). */
export class ListRestaurantsUseCase {
  constructor(private restaurantRepository: IRestaurantRepository) {}

  async execute() {
    return this.restaurantRepository.listActiveForClient();
  }
}
