import { Category } from '../../../domain/entities/Category';

export function serializeCategory(category: Category & { productCount?: number }) {
  return {
    id: category.id,
    name: category.name,
    position: category.position,
    image: category.image ?? null,
    restaurant_id: category.restaurantId,
    product_count: category.productCount ?? 0,
  };
}

export function serializeCategories(categories: (Category & { productCount?: number })[]) {
  return categories.map(serializeCategory);
}
