import { Response } from 'express';
import { BackupService } from '../services/BackupService';
import { AuthenticatedRequest } from '../middlewares/AuthMiddleware';

export class BackupController {
  private backupService: BackupService;

  constructor(backupService: BackupService) {
    this.backupService = backupService;
  }

  public exportBackup = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.user_id;
      const snapshot = await this.backupService.createBackupSnapshot(userId);
      return res.status(200).json({
        message: 'Backup snapshot data POS berhasil dibuat',
        data: snapshot,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Gagal membuat backup data' });
    }
  };

  public getHistory = async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const history = await this.backupService.getBackupHistory();
      return res.status(200).json({ data: history });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Gagal mengambil riwayat backup' });
    }
  };

  public restoreBackup = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.user_id;
      const { snapshot_data } = req.body;

      if (!snapshot_data) {
        return res.status(400).json({ error: 'Payload snapshot_data wajib disertakan' });
      }

      const result = await this.backupService.restoreFromSnapshot(snapshot_data, userId);
      return res.status(200).json({
        message: 'Restore data snapshot berhasil diselesaikan',
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Gagal merestore data snapshot' });
    }
  };

  public syncGoogleSheets = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.user_id;
      const result = await this.backupService.syncToGoogleSheets(userId);
      return res.status(200).json({
        message: 'Sinkronisasi data POS ke Google Spreadsheet berhasil diselesaikan!',
        data: result,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Gagal menyinkronkan data ke Google Sheets' });
    }
  };

  public getGoogleSheetsStatus = async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const status = await this.backupService.getGoogleSheetsStatus();
      return res.status(200).json({ data: status });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Gagal mengambil status Google Sheets' });
    }
  };
}
