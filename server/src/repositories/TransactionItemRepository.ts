import { IRepository } from './interfaces/IRepository';
import { TransactionItemEntity } from '../types/domain';

export class TransactionItemRepository implements IRepository<TransactionItemEntity> {
  private items: TransactionItemEntity[] = [];

  async findAll(): Promise<TransactionItemEntity[]> {
    return [...this.items];
  }

  async findById(transaction_item_id: string): Promise<TransactionItemEntity | null> {
    const item = this.items.find((i) => i.transaction_item_id === transaction_item_id);
    return item ? { ...item } : null;
  }

  async findByTransactionId(transaction_id: string): Promise<TransactionItemEntity[]> {
    return this.items.filter((i) => i.transaction_id === transaction_id);
  }

  async findWhere(predicate: (item: TransactionItemEntity) => boolean): Promise<TransactionItemEntity[]> {
    return this.items.filter(predicate);
  }

  async create(item: TransactionItemEntity): Promise<TransactionItemEntity> {
    this.items.push(item);
    return { ...item };
  }

  async update(transaction_item_id: string, item: Partial<TransactionItemEntity>): Promise<TransactionItemEntity | null> {
    const index = this.items.findIndex((i) => i.transaction_item_id === transaction_item_id);
    if (index === -1) return null;

    this.items[index] = { ...this.items[index], ...item };
    return { ...this.items[index] };
  }
}
