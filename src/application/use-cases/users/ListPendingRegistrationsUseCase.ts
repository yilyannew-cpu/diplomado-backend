import { IUserRepository } from '../../ports';

export class ListPendingRegistrationsUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute() {
    const data = await this.userRepository.listPending();
    return { data };
  }
}
