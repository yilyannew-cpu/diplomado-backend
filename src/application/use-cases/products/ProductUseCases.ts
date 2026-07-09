import {
  IProductRepository,
  ListProductsFilters,
  IngredientInput,
  ModifierGroupInput,
} from '../../ports/IProductRepository';
import { NotFoundError } from '../../../domain/errors';

export class ListProductsUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(filters: ListProductsFilters) {
    return this.productRepo.list(filters);
  }
}

export class GetProductUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(id: string) {
    const product = await this.productRepo.findById(id);
    if (!product) throw new NotFoundError('Producto no encontrado');
    return product;
  }
}

export class CreateProductUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(data: {
    name: string;
    description: string;
    price: number;
    image: string;
    categoryId: string;
    restaurantId: string;
    available?: boolean;
  }) {
    return this.productRepo.create(data);
  }
}

export class UpdateProductUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(id: string, data: { name?: string; description?: string; price?: number; image?: string; available?: boolean; categoryId?: string }) {
    return this.productRepo.update(id, data);
  }
}

export class ToggleAvailabilityUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(id: string) {
    return this.productRepo.toggleAvailability(id);
  }
}

export class DeleteProductUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(id: string) {
    const product = await this.productRepo.findById(id);
    if (!product) throw new NotFoundError('Producto no encontrado');
    await this.productRepo.delete(id);
  }
}

export class UpdateProductImageUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(id: string, imageUrl: string) {
    const product = await this.productRepo.findById(id);
    if (!product) throw new NotFoundError('Producto no encontrado');
    return this.productRepo.updateImage(id, imageUrl);
  }
}

export class SetProductIngredientsUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(id: string, ingredients: IngredientInput[]) {
    const product = await this.productRepo.findById(id);
    if (!product) throw new NotFoundError('Producto no encontrado');
    return this.productRepo.setIngredients(id, ingredients);
  }
}

export class SetProductModifierGroupsUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(id: string, modifierGroups: ModifierGroupInput[]) {
    const product = await this.productRepo.findById(id);
    if (!product) throw new NotFoundError('Producto no encontrado');
    return this.productRepo.setModifierGroups(id, modifierGroups);
  }
}
