import { IRepository } from './interfaces/IRepository';
import { StockEntity } from '../types/domain';
import { pool } from '../database/db';

export class StockRepository implements IRepository<StockEntity> {
  private inMemoryStocks: StockEntity[] = [];

  async findAll(): Promise<StockEntity[]> {
    try {
      const res = await pool.query(
        `SELECT s.stock_id, s.product_id, s.current_stock::float, 
                COALESCE(s.stock_gudang, 0)::float as stock_gudang, 
                COALESCE(s.stock_etalase, 0)::float as stock_etalase, 
                s.last_updated::text 
         FROM stocks s
         JOIN products p ON s.product_id = p.product_id
         WHERE p.is_active = true
         ORDER BY s.last_updated DESC`
      );
      this.inMemoryStocks = res.rows;
      return res.rows;
    } catch (err) {
      console.warn('[StockRepository] Database fetch fallback to memory:', (err as Error).message);
      return [...this.inMemoryStocks];
    }
  }

  async findById(stock_id: string): Promise<StockEntity | null> {
    try {
      const res = await pool.query(
        `SELECT stock_id, product_id, current_stock::float, 
                COALESCE(stock_gudang, 0)::float as stock_gudang, 
                COALESCE(stock_etalase, 0)::float as stock_etalase, 
                last_updated::text 
         FROM stocks 
         WHERE stock_id = $1`,
        [stock_id]
      );
      if (res.rows.length > 0) return res.rows[0];
      const mem = this.inMemoryStocks.find((s) => s.stock_id === stock_id);
      return mem ? { ...mem } : null;
    } catch {
      const mem = this.inMemoryStocks.find((s) => s.stock_id === stock_id);
      return mem ? { ...mem } : null;
    }
  }

  async findByProductId(product_id: string): Promise<StockEntity | null> {
    try {
      const res = await pool.query(
        `SELECT stock_id, product_id, current_stock::float, 
                COALESCE(stock_gudang, 0)::float as stock_gudang, 
                COALESCE(stock_etalase, 0)::float as stock_etalase, 
                last_updated::text 
         FROM stocks 
         WHERE product_id = $1`,
        [product_id]
      );
      if (res.rows.length > 0) return res.rows[0];
      const mem = this.inMemoryStocks.find((s) => s.product_id === product_id);
      return mem ? { ...mem } : null;
    } catch {
      const mem = this.inMemoryStocks.find((s) => s.product_id === product_id);
      return mem ? { ...mem } : null;
    }
  }

  async findWhere(predicate: (item: StockEntity) => boolean): Promise<StockEntity[]> {
    const all = await this.findAll();
    return all.filter(predicate);
  }

  async create(stock: StockEntity): Promise<StockEntity> {
    try {
      const res = await pool.query(
        `INSERT INTO stocks (stock_id, product_id, current_stock, stock_gudang, stock_etalase, last_updated)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (product_id) DO UPDATE 
         SET current_stock = EXCLUDED.current_stock, 
             stock_gudang = EXCLUDED.stock_gudang, 
             stock_etalase = EXCLUDED.stock_etalase, 
             last_updated = EXCLUDED.last_updated
         RETURNING stock_id, product_id, current_stock::float, COALESCE(stock_gudang, 0)::float as stock_gudang, COALESCE(stock_etalase, 0)::float as stock_etalase, last_updated::text`,
        [stock.stock_id, stock.product_id, stock.current_stock, stock.stock_gudang ?? 0, stock.stock_etalase ?? 0, stock.last_updated || new Date().toISOString()]
      );
      const created = res.rows[0];
      const memIdx = this.inMemoryStocks.findIndex((s) => s.product_id === stock.product_id);
      if (memIdx !== -1) this.inMemoryStocks[memIdx] = created;
      else this.inMemoryStocks.push(created);
      return created;
    } catch (err) {
      console.warn('[StockRepository] Database insert fallback to memory:', (err as Error).message);
      this.inMemoryStocks.push(stock);
      return { ...stock };
    }
  }

  async update(stock_id: string, item: Partial<StockEntity>): Promise<StockEntity | null> {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (item.current_stock !== undefined) { fields.push(`current_stock = $${idx++}`); values.push(item.current_stock); }
      if (item.stock_gudang !== undefined) { fields.push(`stock_gudang = $${idx++}`); values.push(item.stock_gudang); }
      if (item.stock_etalase !== undefined) { fields.push(`stock_etalase = $${idx++}`); values.push(item.stock_etalase); }
      fields.push(`last_updated = CURRENT_TIMESTAMP`);

      values.push(stock_id);
      const queryStr = `UPDATE stocks SET ${fields.join(', ')} WHERE stock_id = $${idx} 
                        RETURNING stock_id, product_id, current_stock::float, COALESCE(stock_gudang, 0)::float as stock_gudang, COALESCE(stock_etalase, 0)::float as stock_etalase, last_updated::text`;
      const res = await pool.query(queryStr, values);

      if (res.rows.length > 0) {
        const updated = res.rows[0];
        const memIdx = this.inMemoryStocks.findIndex((s) => s.stock_id === stock_id);
        if (memIdx !== -1) this.inMemoryStocks[memIdx] = updated;
        return updated;
      }
    } catch (err) {
      console.warn('[StockRepository] Database update fallback to memory:', (err as Error).message);
    }

    const index = this.inMemoryStocks.findIndex((s) => s.stock_id === stock_id);
    if (index === -1) return null;
    this.inMemoryStocks[index] = { ...this.inMemoryStocks[index], ...item, last_updated: new Date().toISOString() };
    return { ...this.inMemoryStocks[index] };
  }

  async deleteByProductId(product_id: string): Promise<boolean> {
    try {
      await pool.query('DELETE FROM stocks WHERE product_id = $1', [product_id]);
    } catch (err) {
      console.warn('[StockRepository] Database delete fallback to memory:', (err as Error).message);
    }
    this.inMemoryStocks = this.inMemoryStocks.filter((s) => s.product_id !== product_id);
    return true;
  }

  async deductStockAtomic(product_id: string, qty: number): Promise<StockEntity | null> {
    try {
      const queryStr = `
        UPDATE stocks 
        SET 
          current_stock = GREATEST(0, current_stock - $1),
          stock_etalase = GREATEST(0, COALESCE(stock_etalase, 0) - $1),
          stock_gudang = GREATEST(0, COALESCE(stock_gudang, 0) - GREATEST(0, $1 - COALESCE(stock_etalase, 0))),
          last_updated = CURRENT_TIMESTAMP
        WHERE product_id = $2
        RETURNING stock_id, product_id, current_stock::float, COALESCE(stock_gudang, 0)::float as stock_gudang, COALESCE(stock_etalase, 0)::float as stock_etalase, last_updated::text
      `;
      const res = await pool.query(queryStr, [qty, product_id]);
      if (res.rows.length > 0) {
        const updated = res.rows[0];
        const memIdx = this.inMemoryStocks.findIndex((s) => s.product_id === product_id);
        if (memIdx !== -1) this.inMemoryStocks[memIdx] = updated;
        return updated;
      }
    } catch (err) {
      console.warn('[StockRepository] Database atomic deduct fallback to memory:', (err as Error).message);
    }
    return null;
  }
}

