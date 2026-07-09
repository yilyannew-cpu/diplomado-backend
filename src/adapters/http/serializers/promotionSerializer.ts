export function serializePromotion(promotion: {
  id: string;
  name: string;
  discountPercent: number;
  startDate: Date;
  endDate: Date;
  active: boolean;
  restaurantId: string;
  productIds: string[];
}) {
  return {
    id: promotion.id,
    name: promotion.name,
    discount_percent: promotion.discountPercent,
    product_ids: promotion.productIds,
    start_date: promotion.startDate.toISOString().split('T')[0],
    end_date: promotion.endDate.toISOString().split('T')[0],
    active: promotion.active,
    restaurant_id: promotion.restaurantId,
  };
}
