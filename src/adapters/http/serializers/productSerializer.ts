import { ProductWithCategory } from '../../../domain/entities/Product';

export function serializeProduct(product: ProductWithCategory) {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    category_id: product.categoryId,
    category_name: product.categoryName,
    description: product.description,
    image: product.image,
    available: product.available,
    restaurant_id: product.restaurantId,
    ingredients: product.ingredients?.map((i) => ({
      id: i.id,
      name: i.name,
      available: i.available,
    })),
    modifier_groups: product.modifierGroups?.map((g) => ({
      id: g.id,
      name: g.name,
      min_selections: g.minSelections,
      max_selections: g.maxSelections,
      options: g.options.map((o) => ({
        id: o.id,
        name: o.name,
        price_extra: o.priceExtra,
        available: o.available,
      })),
    })),
  };
}

export function serializeProducts(products: ProductWithCategory[]) {
  return products.map(serializeProduct);
}
