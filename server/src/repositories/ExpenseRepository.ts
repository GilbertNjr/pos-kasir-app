import { IRepository } from './interfaces/IRepository';
import { ExpenseEntity } from '../types/domain';
import { pool } from '../database/db';

export class ExpenseRepository implements IRepository<ExpenseEntity> {
  private inMemoryExpenses: ExpenseEntity[] = [];

  async findAll(): Promise<ExpenseEntity[]> {
    try {
      const res = await pool.query(
        `SELECT expense_id, shift_id, recorded_by_user_id, category, description, 
                amount::float, expense_time::text 
         FROM expenses 
         ORDER BY expense_time DESC`
      );
      if (res.rows.length > 0) {
        this.inMemoryExpenses = res.rows;
        return res.rows;
      }
      return [...this.inMemoryExpenses];
    } catch (err) {
      console.warn('[ExpenseRepository] Database fetch fallback to memory:', (err as Error).message);
      return [...this.inMemoryExpenses];
    }
  }

  async findById(expense_id: string): Promise<ExpenseEntity | null> {
    try {
      const res = await pool.query(
        `SELECT expense_id, shift_id, recorded_by_user_id, category, description, 
                amount::float, expense_time::text 
         FROM expenses 
         WHERE expense_id = $1`,
        [expense_id]
      );
      if (res.rows.length > 0) return res.rows[0];
      const mem = this.inMemoryExpenses.find((e) => e.expense_id === expense_id);
      return mem ? { ...mem } : null;
    } catch {
      const mem = this.inMemoryExpenses.find((e) => e.expense_id === expense_id);
      return mem ? { ...mem } : null;
    }
  }

  async findByShiftId(shift_id: string): Promise<ExpenseEntity[]> {
    try {
      const res = await pool.query(
        `SELECT expense_id, shift_id, recorded_by_user_id, category, description, 
                amount::float, expense_time::text 
         FROM expenses 
         WHERE shift_id = $1
         ORDER BY expense_time DESC`,
        [shift_id]
      );
      if (res.rows.length > 0) return res.rows;
      return this.inMemoryExpenses.filter((e) => e.shift_id === shift_id);
    } catch {
      return this.inMemoryExpenses.filter((e) => e.shift_id === shift_id);
    }
  }

  async findWhere(predicate: (item: ExpenseEntity) => boolean): Promise<ExpenseEntity[]> {
    const all = await this.findAll();
    return all.filter(predicate);
  }

  async create(expense: ExpenseEntity): Promise<ExpenseEntity> {
    try {
      const res = await pool.query(
        `INSERT INTO expenses 
         (expense_id, shift_id, recorded_by_user_id, category, description, amount, expense_time)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING expense_id, shift_id, recorded_by_user_id, category, description, 
                   amount::float, expense_time::text`,
        [
          expense.expense_id,
          expense.shift_id,
          expense.recorded_by_user_id,
          expense.category,
          expense.description,
          expense.amount,
          expense.expense_time || new Date().toISOString(),
        ]
      );
      const created = res.rows[0];
      this.inMemoryExpenses.push(created);
      return created;
    } catch (err) {
      console.warn('[ExpenseRepository] Database insert fallback to memory:', (err as Error).message);
      this.inMemoryExpenses.push(expense);
      return { ...expense };
    }
  }

  async update(expense_id: string, item: Partial<ExpenseEntity>): Promise<ExpenseEntity | null> {
    const index = this.inMemoryExpenses.findIndex((e) => e.expense_id === expense_id);
    if (index === -1) return null;

    this.inMemoryExpenses[index] = { ...this.inMemoryExpenses[index], ...item };
    return { ...this.inMemoryExpenses[index] };
  }
}

