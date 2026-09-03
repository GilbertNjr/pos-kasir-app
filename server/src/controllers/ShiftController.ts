import { Response } from 'express';
import { ShiftService } from '../services/ShiftService';
import { AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { sseManager } from '../utils/sseManager';

export class ShiftController {
  private shiftService: ShiftService;

  constructor(shiftService: ShiftService) {
    this.shiftService = shiftService;
  }

  public getActiveShift = async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const activeShiftDetails = await this.shiftService.getActiveShift();
      return res.status(200).json({ data: activeShiftDetails });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Gagal mengambil detail shift aktif' });
    }
  };

  public getShiftHistory = async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const history = await this.shiftService.getShiftHistory();
      return res.status(200).json({ data: history });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Gagal mengambil riwayat shift' });
    }
  };

  public getShiftDetails = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { shift_id } = req.params;
      const details = await this.shiftService.getShiftDetails(shift_id);
      return res.status(200).json({ data: details });
    } catch (error: any) {
      return res.status(404).json({ error: error.message || 'Detail shift tidak ditemukan' });
    }
  };

  public openShift = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Tidak terautentikasi' });

      const { initial_cash, duty_staff_names, shift_category, shift_metadata } = req.body;
      const initialCashNum = Number(initial_cash ?? 0);

      const result = await this.shiftService.openShift(
        req.user.user_id,
        initialCashNum,
        typeof duty_staff_names === 'string' ? duty_staff_names : (Array.isArray(duty_staff_names) ? duty_staff_names.join(', ') : undefined),
        shift_category,
        shift_metadata
      );

      // Broadcast Realtime SSE Event to all connected Dashboards (including Owner Dashboard)
      sseManager.broadcast('SHIFT_OPENED', {
        shift_id: result.shift.shift_id,
        opened_by_user_id: req.user.user_id,
        user_name: req.user.username,
        role: req.user.role,
        initial_cash: initialCashNum,
        timestamp: new Date().toISOString(),
      });

      return res.status(201).json({
        message: 'Shift berhasil dibuka. Anda adalah Penanggung Jawab Shift ini.',
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Gagal membuka shift' });
    }
  };

  public updateShiftMetadata = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Tidak terautentikasi' });

      const { shift_id, duty_staff_names, shift_category, shift_metadata } = req.body;
      const updated = await this.shiftService.updateShiftMetadata(
        shift_id,
        typeof duty_staff_names === 'string' ? duty_staff_names : (Array.isArray(duty_staff_names) ? duty_staff_names.join(', ') : undefined),
        shift_category,
        shift_metadata
      );

      return res.status(200).json({
        message: 'Metadata shift berhasil diperbarui',
        data: updated,
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Gagal memperbarui metadata shift' });
    }
  };

  public addCapitalContribution = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Tidak terautentikasi' });

      const { shift_id, amount } = req.body;
      const contribution = await this.shiftService.addCapitalContribution(shift_id, req.user.user_id, Number(amount));

      return res.status(201).json({
        message: 'Setoran modal berhasil dicatat ke laci kas bersama',
        data: contribution,
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Gagal menyetor modal' });
    }
  };

  public closeShift = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Tidak terautentikasi' });

      const { shift_id, actual_physical_cash } = req.body;
      const closedShift = await this.shiftService.closeShift(
        shift_id,
        req.user.user_id,
        req.user.role,
        Number(actual_physical_cash)
      );

      // Broadcast SSE event
      sseManager.broadcast('SHIFT_CLOSED', {
        shift_id: closedShift.shift_id,
        timestamp: new Date().toISOString(),
      });

      return res.status(200).json({
        message: 'Shift berhasil ditutup dan rekonsiliasi kas telah dilakukan',
        data: closedShift,
      });
    } catch (error: any) {
      return res.status(403).json({ error: error.message || 'Gagal menutup shift' });
    }
  };

  public returnCapitalContribution = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { contribution_id } = req.body;
      const updated = await this.shiftService.returnCapitalContribution(contribution_id);

      return res.status(200).json({
        message: 'Status modal awal berhasil ditandai dikembalikan',
        data: updated,
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Gagal memproses pengembalian modal' });
    }
  };
}
