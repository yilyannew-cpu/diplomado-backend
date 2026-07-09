import { ICategoryRepository, CreateCategoryData, UpdateCategoryData } from '../../ports/IProductRepository';
import { NotFoundError, ConflictError } from '../../../domain/errors';

export class ListCategoriesUseCase {
  constructor(private categoryRepo: ICategoryRepository) {}

  async execute(restaurantId: string) {
    return this.categoryRepo.listByRestaurant(restaurantId);
  }
}

export class CreateCategoryUseCase {
  constructor(private categoryRepo: ICategoryRepository) {}

  async execute(data: CreateCategoryData) {
    const exists = await this.categoryRepo.nameExistsInRestaurant(data.restaurantId, data.name);
    if (exists) throw new ConflictError('Ya existe una categoría con ese nombre');
    return this.categoryRepo.create(data);
  }
}

export class UpdateCategoryUseCase {
  constructor(private categoryRepo: ICategoryRepository) {}

  async execute(id: string, data: UpdateCategoryData) {
    const category = await this.categoryRepo.findById(id);
    if (!category) throw new NotFoundError('Categoría no encontrada');

    if (data.name) {
      const exists = await this.categoryRepo.nameExistsInRestaurant(
        category.restaurantId,
        data.name,
        id
      );
      if (exists) throw new ConflictError('Ya existe una categoría con ese nombre');
    }

    return this.categoryRepo.update(id, data);
  }
}

export class DeleteCategoryUseCase {
  constructor(private categoryRepo: ICategoryRepository) {}

  async execute(id: string) {
    const category = await this.categoryRepo.findById(id);
    if (!category) throw new NotFoundError('Categoría no encontrada');
    if (category.productCount > 0) {
      throw new ConflictError('No se puede eliminar una categoría con productos asociados');
    }
    await this.categoryRepo.delete(id);
  }
}

export class UpdateCategoryImageUseCase {
  constructor(private categoryRepo: ICategoryRepository) {}

  async execute(id: string, imageUrl: string) {
    const category = await this.categoryRepo.findById(id);
    if (!category) throw new NotFoundError('Categoría no encontrada');
    return this.categoryRepo.updateImage(id, imageUrl);
  }
}
