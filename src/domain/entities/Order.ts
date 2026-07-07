import { OrderStatus } from '../enums';

export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  orderId: string;
  productId: string;
}

export interface Order {
  id: string;
  code: string;
  customerName: string;
  address: string;
  phone: string;
  status: OrderStatus;
  total: number;
  deliveryFee: number;
  restaurantId: string;
  deliveryPersonId: string | null;
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}
