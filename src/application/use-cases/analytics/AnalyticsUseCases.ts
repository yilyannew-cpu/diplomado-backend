import { IAnalyticsRepository } from '../../ports/IAnalyticsRepository';
import { IRestaurantRepository } from '../../ports';
import { NotFoundError } from '../../../domain/errors';

function resolveDateRange(preset: string, from?: string, to?: string): { from: Date; to: Date } {
  const now = new Date();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  switch (preset) {
    case 'today': {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { from: start, to: todayEnd };
    }
    case 'week': {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      return { from: start, to: todayEnd };
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: start, to: todayEnd };
    }
    case 'year': {
      const start = new Date(now.getFullYear(), 0, 1);
      return { from: start, to: todayEnd };
    }
    case 'custom': {
      if (!from || !to) throw new Error('from y to son requeridos para preset custom');
      return { from: new Date(from), to: new Date(to + 'T23:59:59') };
    }
    default: {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: start, to: todayEnd };
    }
  }
}

export class GetRestaurantDashboardUseCase {
  constructor(private analyticsRepo: IAnalyticsRepository) {}

  async execute(restaurantId: string) {
    return this.analyticsRepo.getDashboard(restaurantId);
  }
}

export class GetSalesReportUseCase {
  constructor(private analyticsRepo: IAnalyticsRepository) {}

  async execute(restaurantId: string, preset: string, from?: string, to?: string) {
    const range = resolveDateRange(preset, from, to);
    return this.analyticsRepo.getSalesReport(restaurantId, range.from, range.to);
  }
}

export class GetMonthlySalesUseCase {
  constructor(private analyticsRepo: IAnalyticsRepository) {}

  async execute(restaurantId: string, year: number) {
    return this.analyticsRepo.getMonthlySales(restaurantId, year);
  }
}

export class GetCourierPayoutsUseCase {
  constructor(private analyticsRepo: IAnalyticsRepository) {}

  async execute(restaurantId: string, from: string, to: string) {
    return this.analyticsRepo.getCourierPayouts(
      restaurantId,
      new Date(from),
      new Date(to + 'T23:59:59')
    );
  }
}

export class ExportSalesCsvUseCase {
  constructor(private analyticsRepo: IAnalyticsRepository) {}

  async execute(restaurantId: string, from: string, to: string) {
    return this.analyticsRepo.exportSalesCsv(
      restaurantId,
      new Date(from),
      new Date(to + 'T23:59:59')
    );
  }
}

export class ListReviewsUseCase {
  constructor(private analyticsRepo: IAnalyticsRepository) {}

  async execute(restaurantId: string, limit: number, offset: number) {
    return this.analyticsRepo.listReviews(restaurantId, limit, offset);
  }
}

export class CreateReviewUseCase {
  constructor(
    private analyticsRepo: IAnalyticsRepository,
    private restaurantRepo: IRestaurantRepository
  ) {}

  async execute(
    restaurantId: string,
    data: { rating: number; comment?: string; customerName: string }
  ) {
    const restaurant = await this.restaurantRepo.findById(restaurantId);
    if (!restaurant) throw new NotFoundError('Restaurante no encontrado');
    return this.analyticsRepo.createReview(restaurantId, data);
  }
}

export class GetActiveDeliveriesUseCase {
  constructor(private analyticsRepo: IAnalyticsRepository) {}

  async execute(restaurantId: string) {
    return this.analyticsRepo.getActiveDeliveries(restaurantId);
  }
}

export class ListDispatchesUseCase {
  constructor(private analyticsRepo: IAnalyticsRepository) {}

  async execute(restaurantId: string, from?: string, to?: string, period?: string) {
    const now = new Date();
    let fromDate: Date;
    let toDate: Date = new Date(now);
    toDate.setHours(23, 59, 59, 999);

    if (from && to) {
      fromDate = new Date(from);
      toDate = new Date(to + 'T23:59:59');
    } else if (period === 'today') {
      fromDate = new Date(now);
      fromDate.setHours(0, 0, 0, 0);
    } else if (period === 'year') {
      fromDate = new Date(now.getFullYear(), 0, 1);
    } else {
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return this.analyticsRepo.listDispatches(restaurantId, fromDate, toDate);
  }
}

export class GetDispatchSummaryUseCase {
  constructor(private analyticsRepo: IAnalyticsRepository) {}

  async execute(restaurantId: string, period: 'today' | 'month' | 'year') {
    return this.analyticsRepo.getDispatchSummary(restaurantId, period);
  }
}

export class ListAvailableCouriersUseCase {
  constructor(private analyticsRepo: IAnalyticsRepository) {}

  async execute(restaurantId: string, batchSize: number, zone?: string | null) {
    return this.analyticsRepo.listAvailableCouriers(restaurantId, batchSize, zone);
  }
}
