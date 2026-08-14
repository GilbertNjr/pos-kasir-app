import { IRepository } from './interfaces/IRepository';
import { BusinessUnit } from '../types/domain';

export interface CategoryEntity {
  category_id: string;
  category_name: string;
  business_unit: BusinessUnit;
  is_active: boolean;
}

export class CategoryRepository implements IRepository<CategoryEntity> {
  private categories: CategoryEntity[] = [];

  constructor() {
    this.seedCategories();
  }

  private seedCategories() {
    this.categories = [
      // Bidang Usaha FC_PRINT
      { category_id: 'cat-fc-001', category_name: 'ATK (Alat Tulis Kantor)', business_unit: 'FC_PRINT', is_active: true },
      { category_id: 'cat-fc-002', category_name: 'Fotokopi', business_unit: 'FC_PRINT', is_active: true },
      { category_id: 'cat-fc-003', category_name: 'Printing & Cetak', business_unit: 'FC_PRINT', is_active: true },
      { category_id: 'cat-fc-004', category_name: 'Jasa Ketik & Desain', business_unit: 'FC_PRINT', is_active: true },

      // Bidang Usaha FNB
      { category_id: 'cat-fnb-001', category_name: 'Snack & Makanan Ringan', business_unit: 'FNB', is_active: true },
      { category_id: 'cat-fnb-002', category_name: 'Minuman Dingin & Hangat', business_unit: 'FNB', is_active: true },
      { category_id: 'cat-fnb-003', category_name: 'Makanan Olahan (Seblak/Gorengan)', business_unit: 'FNB', is_active: true },
      { category_id: 'cat-fnb-004', category_name: 'Es Krim & Dessert', business_unit: 'FNB', is_active: true },
    ];
  }

  async findAll(): Promise<CategoryEntity[]> {
    return [...this.categories];
  }

  async findById(category_id: string): Promise<CategoryEntity | null> {
    const cat = this.categories.find((c) => c.category_id === category_id);
    return cat ? { ...cat } : null;
  }

  async findWhere(predicate: (item: CategoryEntity) => boolean): Promise<CategoryEntity[]> {
    return this.categories.filter(predicate);
  }

  async create(category: CategoryEntity): Promise<CategoryEntity> {
    this.categories.push(category);
    return { ...category };
  }

  async update(category_id: string, item: Partial<CategoryEntity>): Promise<CategoryEntity | null> {
    const index = this.categories.findIndex((c) => c.category_id === category_id);
    if (index === -1) return null;

    this.categories[index] = { ...this.categories[index], ...item };
    return { ...this.categories[index] };
  }
}
