import { ApplicationStatus } from '../enums';

export interface CourierApplication {
  id: string;
  courierId: string;
  restaurantId: string;
  status: ApplicationStatus;
  courierName?: string;
  restaurantName?: string;
  createdAt: Date;
  updatedAt: Date;
}
