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

export interface IProductRepository {
  list(filters: ListProductsFilters): Promise<ProductWithCategory[]>;
  findById(id: string): Promise<ProductWithCategory | null>;
  create(data: CreateProductData): Promise<Product>;
  update(id: string, data: UpdateProductData): Promise<Product>;
  toggleAvailability(id: string): Promise<Product>;
}

export interface ICategoryRepository {
  listAll(): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
}
