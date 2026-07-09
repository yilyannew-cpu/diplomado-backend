export interface Category {
  id: string;
  name: string;
  position: number;
  image?: string | null;
  restaurantId: string;
}
