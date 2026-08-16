import { IRepository } from './interfaces/IRepository';
import { TransactionEntity } from '../types/domain';
import { pool } from '../database/db';

export class TransactionRepository implements IRepository<TransactionEntity> {
  private inMemoryTransactions: TransactionEntity[] = [];

  async findAll(): Promise<TransactionEntity[]> {
    try {
      const res = await pool.query(
        `SELECT t.transaction_id, t.transaction_number, t.created_by_user_id, t.shift_id, 
                t.subtotal::float as subtotal_amount, t.discount_amount::float as discount_amount, 
                t.final_total::float as final_total, 
                COALESCE(p.payment_method, 'CASH') as payment_method, 
                t.created_at::text as transaction_time, t.status 
         FROM transactions t 
         LEFT JOIN payments p ON t.transaction_id = p.transaction_id
         ORDER BY t.created_at DESC`
      );
      if (res.rows.length > 0) {
        this.inMemoryTransactions = res.rows;
        return res.rows;
      }
      return [...this.inMemoryTransactions];
    } catch (err) {
      console.warn('[TransactionRepository] Database fetch fallback to memory:', (err as Error).message);
      return [...this.inMemoryTransactions];
    }
  }

  async findById(transaction_id: string): Promise<TransactionEntity | null> {
    try {
      const res = await pool.query(
        `SELECT t.transaction_id, t.transaction_number, t.created_by_user_id, t.shift_id, 
                t.subtotal::float as subtotal_amount, t.discount_amount::float as discount_amount, 
                t.final_total::float as final_total, 
                COALESCE(p.payment_method, 'CASH') as payment_method, 
                t.created_at::text as transaction_time, t.status 
         FROM transactions t 
         LEFT JOIN payments p ON t.transaction_id = p.transaction_id
         WHERE t.transaction_id = $1`,
        [transaction_id]
      );
      if (res.rows.length > 0) return res.rows[0];
      const mem = this.inMemoryTransactions.find((t) => t.transaction_id === transaction_id);
      return mem ? { ...mem } : null;
    } catch {
      const mem = this.inMemoryTransactions.find((t) => t.transaction_id === transaction_id);
      return mem ? { ...mem } : null;
    }
  }

  async findByShiftId(shift_id: string): Promise<TransactionEntity[]> {
    try {
      const res = await pool.query(
        `SELECT t.transaction_id, t.transaction_number, t.created_by_user_id, t.shift_id, 
                t.subtotal::float as subtotal_amount, t.discount_amount::float as discount_amount, 
                t.final_total::float as final_total, 
                COALESCE(p.payment_method, 'CASH') as payment_method, 
                t.created_at::text as transaction_time, t.status 
         FROM transactions t 
         LEFT JOIN payments p ON t.transaction_id = p.transaction_id
         WHERE t.shift_id = $1
         ORDER BY t.created_at DESC`,
        [shift_id]
      );
      if (res.rows.length > 0) return res.rows;
      return this.inMemoryTransactions.filter((t) => t.shift_id === shift_id);
    } catch {
      return this.inMemoryTransactions.filter((t) => t.shift_id === shift_id);
    }
  }

  async findWhere(predicate: (item: TransactionEntity) => boolean): Promise<TransactionEntity[]> {
    const all = await this.findAll();
    return all.filter(predicate);
  }

  async create(transaction: TransactionEntity): Promise<TransactionEntity> {
    try {
      const res = await pool.query(
        `INSERT INTO transactions 
         (transaction_id, transaction_number, shift_id, created_by_user_id, subtotal, discount_amount, final_total, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING transaction_id, transaction_number, shift_id, created_by_user_id, 
                   subtotal::float as subtotal_amount, discount_amount::float as discount_amount, 
                   final_total::float as final_total, status, created_at::text as transaction_time`,
        [
          transaction.transaction_id,
          transaction.transaction_number,
          transaction.shift_id,
          transaction.created_by_user_id,
          transaction.subtotal_amount || transaction.final_total,
          transaction.discount_amount || 0,
          transaction.final_total,
          transaction.status || 'COMPLETED',
          transaction.transaction_time || new Date().toISOString(),
        ]
      );

      // Save Payment detail to payments table
      if (transaction.payment_method) {
        await pool.query(
          `INSERT INTO payments (payment_id, transaction_id, payment_method, amount_paid, payment_time)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (payment_id) DO NOTHING`,
          [
            `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            transaction.transaction_id,
            transaction.payment_method,
            transaction.final_total,
            transaction.transaction_time || new Date().toISOString(),
          ]
        );
      }

      const created = { ...res.rows[0], payment_method: transaction.payment_method || 'CASH' };
      this.inMemoryTransactions.push(created);
      return created;
    } catch (err) {
      console.warn('[TransactionRepository] Database insert fallback to memory:', (err as Error).message);
      this.inMemoryTransactions.push(transaction);
      return { ...transaction };
    }
  }

  async update(transaction_id: string, item: Partial<TransactionEntity>): Promise<TransactionEntity | null> {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (item.status !== undefined) { fields.push(`status = $${idx++}`); values.push(item.status); }
      if (item.discount_amount !== undefined) { fields.push(`discount_amount = $${idx++}`); values.push(item.discount_amount); }
      if (item.final_total !== undefined) { fields.push(`final_total = $${idx++}`); values.push(item.final_total); }

      fields.push(`updated_at = CURRENT_TIMESTAMP`);

      if (fields.length > 1) {
        values.push(transaction_id);
        const queryStr = `UPDATE transactions SET ${fields.join(', ')} WHERE transaction_id = $${idx} 
                          RETURNING transaction_id, transaction_number, shift_id, created_by_user_id, 
                                    subtotal::float as subtotal_amount, discount_amount::float as discount_amount, 
                                    final_total::float as final_total, status, created_at::text as transaction_time`;
        const res = await pool.query(queryStr, values);
        if (res.rows.length > 0) {
          const updated = { ...res.rows[0], payment_method: item.payment_method || 'CASH' };
          const memIdx = this.inMemoryTransactions.findIndex((t) => t.transaction_id === transaction_id);
          if (memIdx !== -1) this.inMemoryTransactions[memIdx] = updated;
          return updated;
        }
      }
    } catch (err) {
      console.warn('[TransactionRepository] Database update fallback to memory:', (err as Error).message);
    }

    const index = this.inMemoryTransactions.findIndex((t) => t.transaction_id === transaction_id);
    if (index === -1) return null;
    this.inMemoryTransactions[index] = { ...this.inMemoryTransactions[index], ...item };
    return { ...this.inMemoryTransactions[index] };
  }
}

