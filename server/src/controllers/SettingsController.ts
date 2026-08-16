import { Response } from 'express';
import { settingsService } from '../services/SettingsService';
import { AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { sseManager } from '../utils/sseManager';

export class SettingsController {
  public getSettings = async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const settings = await settingsService.getSettings();
      return res.status(200).json({ data: settings });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Gagal mengambil pengaturan sistem' });
    }
  };

  public updateSettings = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Tidak terautentikasi' });

      const updated = await settingsService.updateSettings(req.body);

      // Broadcast SSE signal
      sseManager.broadcast('SETTINGS_UPDATED', {
        updated_by: req.user.username,
        timestamp: new Date().toISOString(),
        settings: updated,
      });

      return res.status(200).json({
        message: 'Pengaturan sistem berhasil diperbarui',
        data: updated,
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Gagal menginstal pengaturan sistem' });
    }
  };
}

export const settingsController = new SettingsController();
