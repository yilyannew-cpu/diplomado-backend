import { Order } from '../../domain/entities/Order';
import { OrderStatus } from '../../domain/enums';

export interface CreateOrderItemData {
  productId: string;
  quantity: number;
  customizations?: Record<string, any>;
}

export interface CreateOrderData {
  customerName: string;
  address: string;
  phone: string;
  paymentMethod?: string;
  paymentStatus?: string;
  restaurantId: string;
  items: CreateOrderItemData[];
}

export interface IOrderRepository {
  create(data: CreateOrderData & { code: string; total: number; deliveryFee: number; itemsWithPrice: { productId: string; quantity: number; unitPrice: number; customizations?: Record<string, any> }[] }): Promise<Order>;
  findByCode(code: string): Promise<Order | null>;
  listByRestaurant(restaurantId: string): Promise<Order[]>;
  updateStatus(id: string, status: OrderStatus): Promise<Order>;
  assignCourier(id: string, courierId: string): Promise<Order>;
  listAvailableForDelivery(): Promise<Order[]>;
  listByCourier(courierId: string): Promise<Order[]>;
  countAll(): Promise<number>;
}
