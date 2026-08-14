import { IRepository } from './interfaces/IRepository';
import { TransactionEntity } from '../types/domain';

export class TransactionRepository implements IRepository<TransactionEntity> {
  private transactions: TransactionEntity[] = [];

  async findAll(): Promise<TransactionEntity[]> {
    return [...this.transactions];
  }

  async findById(transaction_id: string): Promise<TransactionEntity | null> {
    const tx = this.transactions.find((t) => t.transaction_id === transaction_id);
    return tx ? { ...tx } : null;
  }

  async findByShiftId(shift_id: string): Promise<TransactionEntity[]> {
    return this.transactions.filter((t) => t.shift_id === shift_id);
  }

  async findWhere(predicate: (item: TransactionEntity) => boolean): Promise<TransactionEntity[]> {
    return this.transactions.filter(predicate);
  }

  async create(transaction: TransactionEntity): Promise<TransactionEntity> {
    this.transactions.push(transaction);
    return { ...transaction };
  }

  async update(transaction_id: string, item: Partial<TransactionEntity>): Promise<TransactionEntity | null> {
    const index = this.transactions.findIndex((t) => t.transaction_id === transaction_id);
    if (index === -1) return null;

    this.transactions[index] = { ...this.transactions[index], ...item };
    return { ...this.transactions[index] };
  }
}
