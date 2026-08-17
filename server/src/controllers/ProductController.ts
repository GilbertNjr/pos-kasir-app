import { Request, Response } from 'express';
import { ProductService } from '../services/ProductService';
import { sseManager } from '../utils/sseManager';

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
      sseManager.broadcast('PRODUCT_UPDATED', { action: 'CREATED', data: product });
      return res.status(201).json({ message: 'Produk berhasil ditambahkan', data: product });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Gagal menambahkan produk' });
    }
  };

  public updateProduct = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const product = await this.productService.updateProduct(id, req.body);
      sseManager.broadcast('PRODUCT_UPDATED', { action: 'UPDATED', product_id: id, data: product });
      return res.status(200).json({ message: 'Detail produk berhasil diperbarui', data: product });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Gagal memperbarui detail produk' });
    }
  };

  public deleteProduct = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.productService.deleteProduct(id);
      sseManager.broadcast('PRODUCT_UPDATED', { action: 'DELETED', product_id: id });
      sseManager.broadcast('STOCK_UPDATED', { action: 'DELETED', product_id: id });
      return res.status(200).json({ message: 'Produk dan stok berhasil dihapus.' });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Gagal menghapus produk' });
    }
  };
}
