import { Response } from 'express';
import { ExpenseService } from '../services/ExpenseService';
import { AuthenticatedRequest } from '../middlewares/AuthMiddleware';

export class ExpenseController {
  private expenseService: ExpenseService;

  constructor(expenseService: ExpenseService) {
    this.expenseService = expenseService;
  }

  public createExpense = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Tidak terautentikasi' });

      const { category, description, amount } = req.body;
      const expense = await this.expenseService.createExpense({
        user_id: req.user.user_id,
        category,
        description,
        amount: Number(amount),
      });

      return res.status(201).json({
        message: 'Pengeluaran kas berhasil dicatat dan dipotong dari saldo teoritis kas',
        data: expense,
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Gagal mencatat pengeluaran kas' });
    }
  };

  public getExpenses = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { shift_id } = req.query;
      if (shift_id) {
        const list = await this.expenseService.getExpensesByShift(shift_id as string);
        return res.status(200).json({ data: list });
      }
      const list = await this.expenseService.getAllExpenses();
      return res.status(200).json({ data: list });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Gagal mengambil riwayat pengeluaran kas' });
    }
  };

  public deleteExpense = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Tidak terautentikasi' });
      const { expenseId } = req.params;
      await this.expenseService.deleteExpense(expenseId);
      return res.status(200).json({ message: 'Catatan pengeluaran kas berhasil dihapus' });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Gagal menghapus catatan pengeluaran kas' });
    }
  };
}
