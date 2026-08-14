import { IRepository } from './interfaces/IRepository';
import { ExpenseEntity } from '../types/domain';

export class ExpenseRepository implements IRepository<ExpenseEntity> {
  private expenses: ExpenseEntity[] = [];

  async findAll(): Promise<ExpenseEntity[]> {
    return [...this.expenses];
  }

  async findById(expense_id: string): Promise<ExpenseEntity | null> {
    const expense = this.expenses.find((e) => e.expense_id === expense_id);
    return expense ? { ...expense } : null;
  }

  async findByShiftId(shift_id: string): Promise<ExpenseEntity[]> {
    return this.expenses.filter((e) => e.shift_id === shift_id);
  }

  async findWhere(predicate: (item: ExpenseEntity) => boolean): Promise<ExpenseEntity[]> {
    return this.expenses.filter(predicate);
  }

  async create(expense: ExpenseEntity): Promise<ExpenseEntity> {
    this.expenses.push(expense);
    return { ...expense };
  }

  async update(expense_id: string, item: Partial<ExpenseEntity>): Promise<ExpenseEntity | null> {
    const index = this.expenses.findIndex((e) => e.expense_id === expense_id);
    if (index === -1) return null;

    this.expenses[index] = { ...this.expenses[index], ...item };
    return { ...this.expenses[index] };
  }
}
