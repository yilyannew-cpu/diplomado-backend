import { IRestaurantRepository } from '../../ports';

export class ListRestaurantsUseCase {
  constructor(private restaurantRepository: IRestaurantRepository) {}

  async execute() {
    return this.restaurantRepository.listAll();
  }
}
