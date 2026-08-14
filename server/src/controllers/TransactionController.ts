import { Response } from 'express';
import { TransactionService } from '../services/TransactionService';
import { AuthenticatedRequest } from '../middlewares/AuthMiddleware';

export class TransactionController {
  private transactionService: TransactionService;

  constructor(transactionService: TransactionService) {
    this.transactionService = transactionService;
  }

  public createTransaction = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Tidak terautentikasi' });

      const { payment_method, items, cash_tendered } = req.body;
      const result = await this.transactionService.createTransaction({
        user_id: req.user.user_id,
        payment_method: payment_method || 'CASH',
        items: items || [],
        cash_tendered: cash_tendered ? Number(cash_tendered) : undefined,
      });

      return res.status(201).json({
        message: 'Transaksi POS berhasil diproses',
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Gagal memproses transaksi' });
    }
  };

  public getTransactions = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { shift_id } = req.query;
      if (shift_id) {
        const list = await this.transactionService.getTransactionsByShift(shift_id as string);
        return res.status(200).json({ data: list });
      }
      const list = await this.transactionService.getAllTransactions();
      return res.status(200).json({ data: list });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Gagal mengambil riwayat transaksi' });
    }
  };

  public getPaymentSummary = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { shift_id } = req.query;
      if (!shift_id) {
        return res.status(400).json({ error: 'Parameter shift_id wajib disertakan.' });
      }
      const summary = await this.transactionService.getPaymentSummaryByShift(shift_id as string);
      return res.status(200).json({ data: summary });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Gagal mengambil rekap pembayaran' });
    }
  };
}
