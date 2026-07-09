import { IUserReportRepository, CreateUserReportData, UserReportData } from '../../application/ports';
import { prisma } from '../database/prisma/client';

export class PrismaUserReportRepository implements IUserReportRepository {
  async create(data: CreateUserReportData): Promise<UserReportData> {
    const record = await prisma.userReport.create({
      data: {
        reported_user: data.reportedUser,
        reported_by: data.reportedBy,
        reason: data.reason,
      },
    });

    return {
      id: record.id,
      reportedUser: record.reported_user,
      reportedBy: record.reported_by,
      reason: record.reason,
      createdAt: record.created_at,
    };
  }

  async listAll(): Promise<UserReportData[]> {
    const records = await prisma.userReport.findMany({
      orderBy: { created_at: 'desc' },
    });

    return records.map(record => ({
      id: record.id,
      reportedUser: record.reported_user,
      reportedBy: record.reported_by,
      reason: record.reason,
      createdAt: record.created_at,
    }));
  }
}
