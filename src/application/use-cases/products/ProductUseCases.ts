import { IProductRepository, ListProductsFilters } from '../../ports/IProductRepository';

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
    if (!product) throw new Error('Producto no encontrado');
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
