export interface SalesByCategory {
  categoryId: string;
  categoryName: string;
  image: string | null;
  total: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  quantitySold: number;
  revenue: number;
}

export interface RestaurantDashboard {
  salesToday: number;
  ordersToday: number;
  monthlySales: number;
  monthlyGoal: number | null;
  dailyGoal: number | null;
  goalProgressPercent: number | null;
  dailyGoalProgressPercent: number | null;
  salesByCategory: SalesByCategory[];
  topProducts: TopProduct[];
  activePromotionsCount: number;
  averageRating: number;
  reviewCount: number;
}

export interface SalesReport {
  period: { from: string; to: string };
  grossSales: number;
  courierPayout: number;
  deliveredOrders: number;
  netProfit: number;
  appCommissions: number;
  realNetProfit: number;
  marginPercent: number;
}

export interface MonthlySalesPoint {
  month: number;
  label: string;
  grossSales: number;
  orders: number;
}

export interface CourierPayoutRow {
  courierId: string;
  courierName: string;
  ordersDelivered: number;
  totalPayout: number;
}

export interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  customerName: string;
  createdAt: Date;
}

export interface ActiveDeliveryGroup {
  courierId: string;
  courierName: string;
  vehicle: string | null;
  averageRating: number;
  orders: Array<{
    orderId: string;
    customerName: string;
    address: string;
    zone: string | null;
    status: string;
    deliveryFee: number;
  }>;
  totalDeliveryPay: number;
  zones: string[];
}

export interface DispatchItem {
  orderId: string;
  customerName: string;
  total: number;
  deliveryFee: number;
  courierId: string;
  courierName: string;
  dispatchedAt: Date;
}

export interface DispatchSummary {
  today: number;
  month: number;
  year: number;
}

export interface IAnalyticsRepository {
  getDashboard(restaurantId: string): Promise<RestaurantDashboard>;
  getSalesReport(restaurantId: string, from: Date, to: Date): Promise<SalesReport>;
  getMonthlySales(restaurantId: string, year: number): Promise<MonthlySalesPoint[]>;
  getCourierPayouts(restaurantId: string, from: Date, to: Date): Promise<CourierPayoutRow[]>;
  exportSalesCsv(restaurantId: string, from: Date, to: Date): Promise<string>;
  listReviews(restaurantId: string, limit: number, offset: number): Promise<{ data: ReviewItem[]; total: number }>;
  createReview(
    restaurantId: string,
    data: { rating: number; comment?: string; customerName: string }
  ): Promise<ReviewItem>;
  getActiveDeliveries(restaurantId: string): Promise<ActiveDeliveryGroup[]>;
  listDispatches(restaurantId: string, from: Date, to: Date): Promise<DispatchItem[]>;
  getDispatchSummary(restaurantId: string, period: 'today' | 'month' | 'year'): Promise<DispatchSummary>;
  listAvailableCouriers(restaurantId: string, batchSize: number): Promise<Array<{
    id: string;
    name: string;
    vehicle: string | null;
    averageRating: number;
    activeOrders: number;
    canTakeBatch: boolean;
  }>>;
}
