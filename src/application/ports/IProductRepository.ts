import { Product, ProductWithCategory } from '../../domain/entities/Product';
import { Category } from '../../domain/entities/Category';

export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  image: string;
  available?: boolean;
  categoryId: string;
  restaurantId: string;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  image?: string;
  available?: boolean;
  categoryId?: string;
}

export interface ListProductsFilters {
  restaurantId?: string;
  categoryId?: string;
  onlyAvailable?: boolean;
}

export interface IngredientInput {
  name: string;
  available: boolean;
}

export interface ModifierOptionInput {
  name: string;
  price_extra: number;
  available: boolean;
}

export interface ModifierGroupInput {
  name: string;
  min_selections: number;
  max_selections: number;
  options: ModifierOptionInput[];
}

export interface IProductRepository {
  list(filters: ListProductsFilters): Promise<ProductWithCategory[]>;
  findById(id: string): Promise<ProductWithCategory | null>;
  create(data: CreateProductData): Promise<Product>;
  update(id: string, data: UpdateProductData): Promise<Product>;
  toggleAvailability(id: string): Promise<Product>;
  delete(id: string): Promise<void>;
  updateImage(id: string, imageUrl: string): Promise<Product>;
  setIngredients(productId: string, ingredients: IngredientInput[]): Promise<ProductWithCategory>;
  setModifierGroups(productId: string, groups: ModifierGroupInput[]): Promise<ProductWithCategory>;
}

export interface CreateCategoryData {
  name: string;
  position: number;
  image?: string | null;
  restaurantId: string;
}

export interface UpdateCategoryData {
  name?: string;
  position?: number;
  image?: string | null;
}

export interface ICategoryRepository {
  listByRestaurant(restaurantId: string): Promise<(Category & { productCount: number })[]>;
  findById(id: string): Promise<(Category & { productCount: number }) | null>;
  create(data: CreateCategoryData): Promise<Category>;
  update(id: string, data: UpdateCategoryData): Promise<Category>;
  delete(id: string): Promise<void>;
  updateImage(id: string, imageUrl: string): Promise<Category>;
  nameExistsInRestaurant(restaurantId: string, name: string, excludeId?: string): Promise<boolean>;
}
