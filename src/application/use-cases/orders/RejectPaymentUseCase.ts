import { IOrderRepository } from '../../ports/IOrderRepository';

export class RejectPaymentUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  async execute(orderId: string, observation: string) {
    if (!observation || observation.trim() === '') {
      throw new Error('La observación es obligatoria para rechazar un pago');
    }
    return this.orderRepo.rejectPayment(orderId, observation);
  }
}
