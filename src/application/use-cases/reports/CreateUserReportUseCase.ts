import { IUserReportRepository, CreateUserReportData } from '../../ports';

export class CreateUserReportUseCase {
  constructor(private userReportRepo: IUserReportRepository) {}

  async execute(data: CreateUserReportData) {
    if (!data.reportedUser || !data.reportedBy || !data.reason) {
      throw new Error('Datos incompletos para el reporte');
    }
    return this.userReportRepo.create(data);
  }
}
