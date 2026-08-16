import { Response } from 'express';
import { DashboardService } from '../services/DashboardService';
import { AuthenticatedRequest } from '../middlewares/AuthMiddleware';

export class DashboardController {
  private dashboardService: DashboardService;

  constructor(dashboardService: DashboardService) {
    this.dashboardService = dashboardService;
  }

  public getDashboardMetrics = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period_type, start_date, end_date } = req.query;

      const metrics = await this.dashboardService.getDashboardMetrics({
        period_type: period_type as any,
        start_date: start_date as string,
        end_date: end_date as string,
      });

      return res.status(200).json({
        message: 'Data dashboard analitik owner berhasil dimuat',
        data: metrics,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Gagal memuat dashboard owner' });
    }
  };
}
