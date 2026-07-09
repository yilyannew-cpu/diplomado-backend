import { RestaurantStatus } from '../enums';

export interface Restaurant {
  id: string;
  name: string;
  tagline: string | null;
  city: string;
  address: string;
  rating: number;
  deliveryMinutes: number;
  monthlyGoal: number;
  accent: string;
  initials: string;
  status: RestaurantStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type PublicRestaurant = Pick<
  Restaurant,
  'id' | 'name' | 'tagline' | 'city' | 'address' | 'status'
>;
