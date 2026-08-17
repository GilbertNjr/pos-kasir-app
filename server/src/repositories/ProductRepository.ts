import { IRepository } from './interfaces/IRepository';
import { BusinessUnit } from '../types/domain';
import { pool } from '../database/db';

export interface ProductEntity {
  product_id: string;
  category_id: string;
  unit_id?: string;
  product_name: string;
  sku?: string;
  type?: 'PRODUCT' | 'SERVICE';
  business_unit: BusinessUnit;
  selling_price: number;
  cost_price?: number;
  manage_stock: boolean;
  image_url?: string;
  is_active: boolean;
}

export class ProductRepository implements IRepository<ProductEntity> {
  private inMemoryProducts: ProductEntity[] = [];

  async findAll(): Promise<ProductEntity[]> {
    try {
      const res = await pool.query(
        `SELECT product_id, category_id, unit_id, product_name, sku, type, business_unit, 
                selling_price::float, cost_price::float, manage_stock, image_url, is_active 
         FROM products 
         WHERE is_active = true
         ORDER BY product_name ASC`
      );
      this.inMemoryProducts = res.rows;
      return res.rows;
    } catch (err) {
      console.warn('[ProductRepository] Database fetch fallback to memory:', (err as Error).message);
      return this.inMemoryProducts.filter((p) => p.is_active);
    }
  }

  async findById(product_id: string): Promise<ProductEntity | null> {
    try {
      const res = await pool.query(
        `SELECT product_id, category_id, unit_id, product_name, sku, type, business_unit, 
                selling_price::float, cost_price::float, manage_stock, image_url, is_active 
         FROM products 
         WHERE product_id = $1`,
        [product_id]
      );
      if (res.rows.length > 0) return res.rows[0];
      const mem = this.inMemoryProducts.find((p) => p.product_id === product_id);
      return mem ? { ...mem } : null;
    } catch {
      const mem = this.inMemoryProducts.find((p) => p.product_id === product_id);
      return mem ? { ...mem } : null;
    }
  }

  async findWhere(predicate: (item: ProductEntity) => boolean): Promise<ProductEntity[]> {
    const all = await this.findAll();
    return all.filter(predicate);
  }

  async create(product: ProductEntity): Promise<ProductEntity> {
    try {
      const unitId = product.unit_id || 'unit-pcs';
      const res = await pool.query(
        `INSERT INTO products 
         (product_id, category_id, unit_id, product_name, sku, type, business_unit, selling_price, cost_price, manage_stock, image_url, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING product_id, category_id, unit_id, product_name, sku, type, business_unit, 
                   selling_price::float, cost_price::float, manage_stock, image_url, is_active`,
        [
          product.product_id,
          product.category_id,
          unitId,
          product.product_name,
          product.sku || null,
          product.type || 'PRODUCT',
          product.business_unit,
          product.selling_price,
          product.cost_price || 0,
          product.manage_stock ?? false,
          product.image_url || null,
          product.is_active ?? true,
        ]
      );
      const created = res.rows[0];
      this.inMemoryProducts.push(created);
      return created;
    } catch (err) {
      console.warn('[ProductRepository] Database insert fallback to memory:', (err as Error).message);
      this.inMemoryProducts.push(product);
      return { ...product };
    }
  }

  async update(product_id: string, item: Partial<ProductEntity>): Promise<ProductEntity | null> {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (item.category_id !== undefined) { fields.push(`category_id = $${idx++}`); values.push(item.category_id); }
      if (item.unit_id !== undefined) { fields.push(`unit_id = $${idx++}`); values.push(item.unit_id); }
      if (item.product_name !== undefined) { fields.push(`product_name = $${idx++}`); values.push(item.product_name); }
      if (item.sku !== undefined) { fields.push(`sku = $${idx++}`); values.push(item.sku); }
      if (item.type !== undefined) { fields.push(`type = $${idx++}`); values.push(item.type); }
      if (item.business_unit !== undefined) { fields.push(`business_unit = $${idx++}`); values.push(item.business_unit); }
      if (item.selling_price !== undefined) { fields.push(`selling_price = $${idx++}`); values.push(item.selling_price); }
      if (item.cost_price !== undefined) { fields.push(`cost_price = $${idx++}`); values.push(item.cost_price); }
      if (item.manage_stock !== undefined) { fields.push(`manage_stock = $${idx++}`); values.push(item.manage_stock); }
      if (item.image_url !== undefined) { fields.push(`image_url = $${idx++}`); values.push(item.image_url); }
      if (item.is_active !== undefined) { fields.push(`is_active = $${idx++}`); values.push(item.is_active); }

      fields.push(`updated_at = CURRENT_TIMESTAMP`);

      if (fields.length === 1) return this.findById(product_id);

      values.push(product_id);
      const queryStr = `UPDATE products SET ${fields.join(', ')} WHERE product_id = $${idx} 
                        RETURNING product_id, category_id, unit_id, product_name, sku, type, business_unit, 
                                  selling_price::float, cost_price::float, manage_stock, image_url, is_active`;
      const res = await pool.query(queryStr, values);

      if (res.rows.length > 0) {
        const updated = res.rows[0];
        const memIdx = this.inMemoryProducts.findIndex((p) => p.product_id === product_id);
        if (memIdx !== -1) this.inMemoryProducts[memIdx] = updated;
        return updated;
      }
    } catch (err) {
      console.warn('[ProductRepository] Database update fallback to memory:', (err as Error).message);
    }

    const index = this.inMemoryProducts.findIndex((p) => p.product_id === product_id);
    if (index === -1) return null;
    this.inMemoryProducts[index] = { ...this.inMemoryProducts[index], ...item };
    return { ...this.inMemoryProducts[index] };
  }

  async delete(product_id: string): Promise<boolean> {
    try {
      // 1. Set is_active = false first in database
      await pool.query('UPDATE products SET is_active = false WHERE product_id = $1', [product_id]);

      // 2. Clear stock and relational tables
      await pool.query('DELETE FROM stock_balances WHERE product_id = $1', [product_id]);
      await pool.query('DELETE FROM stock_movements WHERE product_id = $1', [product_id]);
      await pool.query('DELETE FROM stocks WHERE product_id = $1', [product_id]);

      // 3. Try hard delete product row
      await pool.query('DELETE FROM products WHERE product_id = $1', [product_id]);
    } catch (err) {
      console.warn('[ProductRepository] Database delete notice:', (err as Error).message);
    }
    this.inMemoryProducts = this.inMemoryProducts.filter((p) => p.product_id !== product_id);
    return true;
  }
}

