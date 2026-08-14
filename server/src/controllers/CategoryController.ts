import { Request, Response } from 'express';
import { CategoryService } from '../services/CategoryService';

export class CategoryController {
  private categoryService: CategoryService;

  constructor(categoryService: CategoryService) {
    this.categoryService = categoryService;
  }

  public getCategories = async (req: Request, res: Response) => {
    try {
      const { unit } = req.query;
      if (unit === 'FC_PRINT' || unit === 'FNB') {
        const categories = await this.categoryService.getCategoriesByBusinessUnit(unit);
        return res.status(200).json({ data: categories });
      }
      const categories = await this.categoryService.getAllCategories();
      return res.status(200).json({ data: categories });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Gagal mengambil kategori' });
    }
  };

  public createCategory = async (req: Request, res: Response) => {
    try {
      const category = await this.categoryService.createCategory(req.body);
      return res.status(201).json({ message: 'Kategori berhasil dibuat', data: category });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Gagal membuat kategori' });
    }
  };
}
