export interface Promotion {
  id: string;
  name: string;
  discountPercent: number;
  startDate: Date;
  endDate: Date;
  active: boolean;
  restaurantId: string;
  productIds: string[];
}

export interface CreatePromotionData {
  name: string;
  discountPercent: number;
  productIds: string[];
  startDate: Date;
  endDate: Date;
  active?: boolean;
  restaurantId: string;
}

export interface UpdatePromotionData {
  name?: string;
  discountPercent?: number;
  productIds?: string[];
  startDate?: Date;
  endDate?: Date;
  active?: boolean;
}

export interface IPromotionRepository {
  listByRestaurant(restaurantId: string): Promise<Promotion[]>;
  findById(id: string): Promise<Promotion | null>;
  create(data: CreatePromotionData): Promise<Promotion>;
  update(id: string, data: UpdatePromotionData): Promise<Promotion>;
  delete(id: string): Promise<void>;
  countActive(restaurantId: string): Promise<number>;
}
