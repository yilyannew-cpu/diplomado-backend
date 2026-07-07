export interface Ingredient {
  id: string;
  name: string;
  available: boolean;
}

export interface ModifierOption {
  id: string;
  name: string;
  priceExtra: number;
  available: boolean;
  groupId: string;
}

export interface ModifierGroup {
  id: string;
  name: string;
  productId: string;
  minSelections: number;
  maxSelections: number;
  options: ModifierOption[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
  categoryId: string;
  restaurantId: string;
  ingredients?: Ingredient[];
  modifierGroups?: ModifierGroup[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductWithCategory extends Product {
  categoryName: string;
}

