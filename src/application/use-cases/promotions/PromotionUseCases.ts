import {
  IPromotionRepository,
  CreatePromotionData,
  UpdatePromotionData,
} from '../../ports/IPromotionRepository';
import { IProductRepository } from '../../ports/IProductRepository';
import { NotFoundError, DomainError } from '../../../domain/errors';

export class ListPromotionsUseCase {
  constructor(private promotionRepo: IPromotionRepository) {}

  async execute(restaurantId: string) {
    return this.promotionRepo.listByRestaurant(restaurantId);
  }
}

export class GetPromotionUseCase {
  constructor(private promotionRepo: IPromotionRepository) {}

  async execute(id: string) {
    const promotion = await this.promotionRepo.findById(id);
    if (!promotion) throw new NotFoundError('Promoción no encontrada');
    return promotion;
  }
}

export class CreatePromotionUseCase {
  constructor(
    private promotionRepo: IPromotionRepository,
    private productRepo: IProductRepository,
  ) {}

  async execute(data: CreatePromotionData) {
    if (data.discountPercent < 1 || data.discountPercent > 90) {
      throw new DomainError('INVALID_DISCOUNT', 'El descuento debe estar entre 1 y 90', 400);
    }
    if (!data.productIds.length) {
      throw new DomainError('INVALID_PRODUCTS', 'Debe incluir al menos un producto', 400);
    }

    for (const productId of data.productIds) {
      const product = await this.productRepo.findById(productId);
      if (!product) throw new NotFoundError(`Producto ${productId} no encontrado`);
      if (product.restaurantId !== data.restaurantId) {
        throw new DomainError('INVALID_PRODUCT', 'El producto no pertenece a este restaurante', 400);
      }
      if (product.categoryName.toLowerCase().includes('adicion')) {
        throw new DomainError('INVALID_PRODUCT', 'No se pueden incluir productos de Adiciones', 400);
      }
    }

    return this.promotionRepo.create(data);
  }
}

export class UpdatePromotionUseCase {
  constructor(
    private promotionRepo: IPromotionRepository,
    private productRepo: IProductRepository,
  ) {}

  async execute(id: string, data: UpdatePromotionData) {
    const promotion = await this.promotionRepo.findById(id);
    if (!promotion) throw new NotFoundError('Promoción no encontrada');

    if (data.discountPercent !== undefined && (data.discountPercent < 1 || data.discountPercent > 90)) {
      throw new DomainError('INVALID_DISCOUNT', 'El descuento debe estar entre 1 y 90', 400);
    }

    if (data.productIds) {
      for (const productId of data.productIds) {
        const product = await this.productRepo.findById(productId);
        if (!product) throw new NotFoundError(`Producto ${productId} no encontrado`);
        if (product.categoryName.toLowerCase().includes('adicion')) {
          throw new DomainError('INVALID_PRODUCT', 'No se pueden incluir productos de Adiciones', 400);
        }
      }
    }

    return this.promotionRepo.update(id, data);
  }
}

export class DeletePromotionUseCase {
  constructor(private promotionRepo: IPromotionRepository) {}

  async execute(id: string) {
    const promotion = await this.promotionRepo.findById(id);
    if (!promotion) throw new NotFoundError('Promoción no encontrada');
    await this.promotionRepo.delete(id);
  }
}
