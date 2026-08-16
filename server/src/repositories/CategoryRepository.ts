import { IRepository } from './interfaces/IRepository';
import { BusinessUnit } from '../types/domain';
import { pool } from '../database/db';

export interface CategoryEntity {
  category_id: string;
  category_name: string;
  business_unit: BusinessUnit;
  is_active: boolean;
}

export class CategoryRepository implements IRepository<CategoryEntity> {
  private inMemoryCategories: CategoryEntity[] = [];

  constructor() {
    this.seedFallbackCategories();
  }

  private seedFallbackCategories() {
    this.inMemoryCategories = [
      { category_id: 'cat-atk', category_name: 'ATK & Perlengkapan', business_unit: 'FC_PRINT', is_active: true },
      { category_id: 'cat-fotokopi', category_name: 'Fotokopi', business_unit: 'FC_PRINT', is_active: true },
      { category_id: 'cat-printing', category_name: 'Printing & Cetak', business_unit: 'FC_PRINT', is_active: true },
      { category_id: 'cat-jasa', category_name: 'Jasa Ketik & Desain', business_unit: 'FC_PRINT', is_active: true },
      { category_id: 'cat-snack', category_name: 'Snack & Camilan', business_unit: 'FNB', is_active: true },
      { category_id: 'cat-minuman', category_name: 'Minuman & Kopi', business_unit: 'FNB', is_active: true },
      { category_id: 'cat-makanan', category_name: 'Makanan Utama', business_unit: 'FNB', is_active: true },
      { category_id: 'cat-gorengan', category_name: 'Gorengan', business_unit: 'FNB', is_active: true },
      { category_id: 'cat-eskrim', category_name: 'Es Krim', business_unit: 'FNB', is_active: true },
    ];
  }

  async findAll(): Promise<CategoryEntity[]> {
    try {
      const res = await pool.query(
        'SELECT category_id, category_name, business_unit, is_active FROM categories ORDER BY category_name ASC'
      );
      if (res.rows.length > 0) {
        this.inMemoryCategories = res.rows;
        return res.rows;
      }
      return [...this.inMemoryCategories];
    } catch (err) {
      console.warn('[CategoryRepository] Database fetch fallback to memory:', (err as Error).message);
      return [...this.inMemoryCategories];
    }
  }

  async findById(category_id: string): Promise<CategoryEntity | null> {
    try {
      const res = await pool.query(
        'SELECT category_id, category_name, business_unit, is_active FROM categories WHERE category_id = $1',
        [category_id]
      );
      if (res.rows.length > 0) return res.rows[0];
      const mem = this.inMemoryCategories.find((c) => c.category_id === category_id);
      return mem ? { ...mem } : null;
    } catch {
      const mem = this.inMemoryCategories.find((c) => c.category_id === category_id);
      return mem ? { ...mem } : null;
    }
  }

  async findWhere(predicate: (item: CategoryEntity) => boolean): Promise<CategoryEntity[]> {
    const all = await this.findAll();
    return all.filter(predicate);
  }

  async create(category: CategoryEntity): Promise<CategoryEntity> {
    try {
      const res = await pool.query(
        `INSERT INTO categories (category_id, category_name, business_unit, is_active)
         VALUES ($1, $2, $3, $4)
         RETURNING category_id, category_name, business_unit, is_active`,
        [category.category_id, category.category_name, category.business_unit, category.is_active ?? true]
      );
      const created = res.rows[0];
      this.inMemoryCategories.push(created);
      return created;
    } catch (err) {
      console.warn('[CategoryRepository] Database insert fallback to memory:', (err as Error).message);
      this.inMemoryCategories.push(category);
      return { ...category };
    }
  }

  async update(category_id: string, item: Partial<CategoryEntity>): Promise<CategoryEntity | null> {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (item.category_name !== undefined) {
        fields.push(`category_name = $${idx++}`);
        values.push(item.category_name);
      }
      if (item.business_unit !== undefined) {
        fields.push(`business_unit = $${idx++}`);
        values.push(item.business_unit);
      }
      if (item.is_active !== undefined) {
        fields.push(`is_active = $${idx++}`);
        values.push(item.is_active);
      }

      if (fields.length === 0) return this.findById(category_id);

      values.push(category_id);
      const queryStr = `UPDATE categories SET ${fields.join(', ')} WHERE category_id = $${idx} RETURNING category_id, category_name, business_unit, is_active`;
      const res = await pool.query(queryStr, values);

      if (res.rows.length > 0) {
        const updated = res.rows[0];
        const memIdx = this.inMemoryCategories.findIndex((c) => c.category_id === category_id);
        if (memIdx !== -1) this.inMemoryCategories[memIdx] = updated;
        return updated;
      }
    } catch (err) {
      console.warn('[CategoryRepository] Database update fallback to memory:', (err as Error).message);
    }

    const index = this.inMemoryCategories.findIndex((c) => c.category_id === category_id);
    if (index === -1) return null;
    this.inMemoryCategories[index] = { ...this.inMemoryCategories[index], ...item };
    return { ...this.inMemoryCategories[index] };
  }
}

