import { Request, Response } from 'express';
import { ProductService } from '../services/ProductService';

export class ProductController {
  private productService: ProductService;

  constructor(productService: ProductService) {
    this.productService = productService;
  }

  public getProducts = async (req: Request, res: Response) => {
    try {
      const { unit } = req.query;
      const products = await this.productService.getProductsByBusinessUnit(unit as string);
      return res.status(200).json({ data: products });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Gagal mengambil daftar produk' });
    }
  };

  public createProduct = async (req: Request, res: Response) => {
    try {
      const product = await this.productService.createProduct(req.body);
      return res.status(201).json({ message: 'Produk berhasil ditambahkan', data: product });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Gagal menambahkan produk' });
    }
  };
}
