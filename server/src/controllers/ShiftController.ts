import { Response } from 'express';
import { ShiftService } from '../services/ShiftService';
import { AuthenticatedRequest } from '../middlewares/AuthMiddleware';

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

  public openShift = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Tidak terautentikasi' });

      const { initial_cash } = req.body;
      const initialCashNum = Number(initial_cash ?? 0);

      const result = await this.shiftService.openShift(req.user.user_id, initialCashNum);
      return res.status(201).json({
        message: 'Shift berhasil dibuka. Anda adalah Penanggung Jawab Shift ini.',
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Gagal membuka shift' });
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
