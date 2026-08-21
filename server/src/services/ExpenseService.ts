import { ExpenseRepository } from '../repositories/ExpenseRepository';
import { ShiftRepository } from '../repositories/ShiftRepository';
import { ExpenseEntity } from '../types/domain';

export interface CreateExpenseDTO {
  user_id: string;
  category: string;
  description: string;
  amount: number;
}

export class ExpenseService {
  private expenseRepository: ExpenseRepository;
  private shiftRepository: ShiftRepository;

  constructor(expenseRepository: ExpenseRepository, shiftRepository: ShiftRepository) {
    this.expenseRepository = expenseRepository;
    this.shiftRepository = shiftRepository;
  }

  async createExpense(dto: CreateExpenseDTO): Promise<ExpenseEntity> {
    // 1. Validasi Shift Aktif
    const activeShift = await this.shiftRepository.findActiveShift();
    if (!activeShift) {
      throw new Error('Pencatatan pengeluaran ditolak. Tidak ada sesi shift yang aktif (ACTIVE).');
    }

    if (!dto.category || !dto.category.trim()) {
      throw new Error('Kategori pengeluaran wajib dipilih.');
    }

    if (!dto.description || !dto.description.trim()) {
      throw new Error('Keterangan pengeluaran wajib diisi.');
    }

    if (dto.amount <= 0) {
      throw new Error('Nominal pengeluaran harus lebih besar dari Rp 0.');
    }

    const expense_id = `exp-${Date.now()}`;
    const nowIso = new Date().toISOString();

    // 2. Buat Entitas Expense Baru
    const newExpense: ExpenseEntity = {
      expense_id,
      shift_id: activeShift.shift_id,
      recorded_by_user_id: dto.user_id,
      category: dto.category,
      description: dto.description.trim(),
      amount: dto.amount,
      expense_time: nowIso,
    };

    await this.expenseRepository.create(newExpense);

    // 3. Akumulasikan total_cash_expenses & perbarui theoretical_cash pada Sesi Shift Aktif
    const updatedTotalExpenses = activeShift.total_cash_expenses + dto.amount;
    const updatedTheoreticalCash = activeShift.total_initial_cash + activeShift.net_cash_sales - updatedTotalExpenses;

    await this.shiftRepository.update(activeShift.shift_id, {
      total_cash_expenses: updatedTotalExpenses,
      theoretical_cash: updatedTheoreticalCash,
    });

    return newExpense;
  }

  async getExpensesByShift(shift_id: string): Promise<ExpenseEntity[]> {
    return this.expenseRepository.findByShiftId(shift_id);
  }

  async getAllExpenses(): Promise<ExpenseEntity[]> {
    return this.expenseRepository.findAll();
  }

  async deleteExpense(expense_id: string): Promise<boolean> {
    const expense = await this.expenseRepository.findById(expense_id);
    if (!expense) {
      throw new Error('Catatan pengeluaran tidak ditemukan.');
    }

    // Restore shift cash balance if the expense was part of a shift
    if (expense.shift_id) {
      const shift = await this.shiftRepository.findById(expense.shift_id);
      if (shift && shift.shift_status === 'ACTIVE') {
        const updatedTotalExpenses = Math.max(0, shift.total_cash_expenses - expense.amount);
        const updatedTheoreticalCash = shift.total_initial_cash + shift.net_cash_sales - updatedTotalExpenses;
        await this.shiftRepository.update(shift.shift_id, {
          total_cash_expenses: updatedTotalExpenses,
          theoretical_cash: updatedTheoreticalCash,
        });
      }
    }

    return this.expenseRepository.delete(expense_id);
  }
}
