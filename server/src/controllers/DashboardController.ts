import { Response } from 'express';
import { DashboardService } from '../services/DashboardService';
import { AuthenticatedRequest } from '../middlewares/AuthMiddleware';

export class DashboardController {
  private dashboardService: DashboardService;

  constructor(dashboardService: DashboardService) {
    this.dashboardService = dashboardService;
  }

  public getDashboardMetrics = async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const metrics = await this.dashboardService.getDashboardMetrics();
      return res.status(200).json({
        message: 'Data dashboard analitik owner berhasil dimuat',
        data: metrics,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Gagal memuat dashboard owner' });
    }
  };
}
