import { CategoryRepository, CategoryEntity } from '../repositories/CategoryRepository';

export class CategoryService {
  private categoryRepository: CategoryRepository;

  constructor(categoryRepository: CategoryRepository) {
    this.categoryRepository = categoryRepository;
  }

  async getAllCategories(): Promise<CategoryEntity[]> {
    return this.categoryRepository.findAll();
  }

  async getCategoriesByBusinessUnit(unit: 'FC_PRINT' | 'FNB'): Promise<CategoryEntity[]> {
    return this.categoryRepository.findWhere((c) => c.business_unit === unit && c.is_active);
  }

  async createCategory(data: Partial<CategoryEntity>): Promise<CategoryEntity> {
    if (!data.category_name || !data.business_unit) {
      throw new Error('Nama kategori dan bidang usaha wajib diisi.');
    }

    const newCategory: CategoryEntity = {
      category_id: `cat-${Date.now()}`,
      category_name: data.category_name,
      business_unit: data.business_unit,
      is_active: data.is_active ?? true,
    };

    return this.categoryRepository.create(newCategory);
  }
}
