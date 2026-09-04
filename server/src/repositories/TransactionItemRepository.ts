import { IRepository } from './interfaces/IRepository';
import { TransactionItemEntity } from '../types/domain';
import { pool } from '../database/db';

export class TransactionItemRepository implements IRepository<TransactionItemEntity> {
  private inMemoryItems: TransactionItemEntity[] = [];

  async findAll(): Promise<TransactionItemEntity[]> {
    try {
      const res = await pool.query(
        `SELECT ti.item_id as transaction_item_id, ti.transaction_id, ti.product_id, 
                COALESCE(p.product_name, ti.product_name_snapshot, 'Produk POS') as product_name,
                ti.unit_price::float, ti.quantity::float as qty, ti.subtotal::float, ti.discount_amount::float
         FROM transaction_items ti
         LEFT JOIN products p ON ti.product_id = p.product_id`
      );
      if (res.rows.length > 0) {
        this.inMemoryItems = res.rows;
        return res.rows;
      }
      return [...this.inMemoryItems];
    } catch (err) {
      console.warn('[TransactionItemRepository] Database fetch fallback to memory:', (err as Error).message);
      return [...this.inMemoryItems];
    }
  }

  async findById(transaction_item_id: string): Promise<TransactionItemEntity | null> {
    try {
      const res = await pool.query(
        `SELECT ti.item_id as transaction_item_id, ti.transaction_id, ti.product_id, 
                COALESCE(p.product_name, ti.product_name_snapshot, 'Produk POS') as product_name,
                ti.unit_price::float, ti.quantity::float as qty, ti.subtotal::float, ti.discount_amount::float
         FROM transaction_items ti
         LEFT JOIN products p ON ti.product_id = p.product_id
         WHERE ti.item_id = $1`,
        [transaction_item_id]
      );
      if (res.rows.length > 0) return res.rows[0];
      const mem = this.inMemoryItems.find((i) => i.transaction_item_id === transaction_item_id);
      return mem ? { ...mem } : null;
    } catch {
      const mem = this.inMemoryItems.find((i) => i.transaction_item_id === transaction_item_id);
      return mem ? { ...mem } : null;
    }
  }

  async findByTransactionId(transaction_id: string): Promise<TransactionItemEntity[]> {
    try {
      const res = await pool.query(
        `SELECT ti.item_id as transaction_item_id, ti.transaction_id, ti.product_id, 
                COALESCE(p.product_name, ti.product_name_snapshot, 'Produk POS') as product_name,
                ti.unit_price::float, ti.quantity::float as qty, ti.subtotal::float, ti.discount_amount::float
         FROM transaction_items ti
         LEFT JOIN products p ON ti.product_id = p.product_id
         WHERE ti.transaction_id = $1`,
        [transaction_id]
      );
      if (res.rows.length > 0) return res.rows;
      return this.inMemoryItems.filter((i) => i.transaction_id === transaction_id);
    } catch {
      return this.inMemoryItems.filter((i) => i.transaction_id === transaction_id);
    }
  }

  async findWhere(predicate: (item: TransactionItemEntity) => boolean): Promise<TransactionItemEntity[]> {
    const all = await this.findAll();
    return all.filter(predicate);
  }

  async create(item: TransactionItemEntity): Promise<TransactionItemEntity> {
    try {
      const res = await pool.query(
        `INSERT INTO transaction_items 
         (item_id, transaction_id, product_id, product_name_snapshot, unit_name_snapshot, unit_price, quantity, discount_amount, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING item_id as transaction_item_id, transaction_id, product_id, 
                   unit_price::float, quantity::float as qty, subtotal::float, discount_amount::float`,
        [
          item.transaction_item_id,
          item.transaction_id,
          item.product_id,
          'Produk POS',
          'PCS',
          item.unit_price,
          item.qty,
          item.discount_amount || 0,
          item.subtotal,
        ]
      );
      const created = res.rows[0];
      this.inMemoryItems.push(created);
      return created;
    } catch (err) {
      console.warn('[TransactionItemRepository] Database insert fallback to memory:', (err as Error).message);
      this.inMemoryItems.push(item);
      return { ...item };
    }
  }

  async update(transaction_item_id: string, item: Partial<TransactionItemEntity>): Promise<TransactionItemEntity | null> {
    const index = this.inMemoryItems.findIndex((i) => i.transaction_item_id === transaction_item_id);
    if (index === -1) return null;

    this.inMemoryItems[index] = { ...this.inMemoryItems[index], ...item };
    return { ...this.inMemoryItems[index] };
  }

  async hasTransactions(product_id: string): Promise<boolean> {
    try {
      const res = await pool.query('SELECT 1 FROM transaction_items WHERE product_id = $1 LIMIT 1', [product_id]);
      if (res.rows.length > 0) return true;
    } catch (err) {
      console.warn('[TransactionItemRepository] Database check hasTransactions fallback to memory:', (err as Error).message);
    }
    return this.inMemoryItems.some((i) => i.product_id === product_id);
  }
}

