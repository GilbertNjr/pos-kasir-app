import { Response } from 'express';
import { ReportService } from '../services/ReportService';
import { AuthenticatedRequest } from '../middlewares/AuthMiddleware';

export class ReportController {
  private reportService: ReportService;

  constructor(reportService: ReportService) {
    this.reportService = reportService;
  }

  public getSalesReport = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period_type, period, start_date, end_date, user_id, shift_id, business_unit, payment_method } = req.query;
      const effectivePeriod = ((period_type || period) as any) || 'DAILY';

      const report = await this.reportService.generateSalesReport({
        period_type: effectivePeriod,
        start_date: start_date as string,
        end_date: end_date as string,
        user_id: user_id as string,
        shift_id: shift_id as string,
        business_unit: (business_unit as any) || 'ALL',
        payment_method: (payment_method as any) || 'ALL',
      });

      return res.status(200).json({
        message: 'Laporan penjualan berhasil digenerate',
        data: report,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Gagal memproses laporan penjualan' });
    }
  };
}
