import { IOperationsRepository } from '../../ports/operations';
import { OrderStatus } from '../../../domain/enums';

export class GetDashboardMetricsUseCase {
  constructor(private readonly operationsRepository: IOperationsRepository) {}

  execute() {
    return this.operationsRepository.getDashboardMetrics();
  }
}

export class GetSystemStatusUseCase {
  constructor(private readonly operationsRepository: IOperationsRepository) {}

  execute() {
    return this.operationsRepository.getSystemStatus();
  }
}

export class ListOrdersUseCase {
  constructor(private readonly operationsRepository: IOperationsRepository) {}

  execute(status?: OrderStatus) {
    return this.operationsRepository.listOrders(status);
  }
}

export class ListActiveCouriersUseCase {
  constructor(private readonly operationsRepository: IOperationsRepository) {}

  execute() {
    return this.operationsRepository.listActiveCouriers();
  }
}

export class GetOperationsMetricsUseCase {
  constructor(private readonly operationsRepository: IOperationsRepository) {}

  execute() {
    return this.operationsRepository.getOperationsMetrics();
  }
}
