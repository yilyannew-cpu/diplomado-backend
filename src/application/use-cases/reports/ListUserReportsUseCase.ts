import { IUserReportRepository } from '../../ports';

export class ListUserReportsUseCase {
  constructor(private userReportRepo: IUserReportRepository) {}

  async execute() {
    return this.userReportRepo.listAll();
  }
}
