import { Response } from 'express';
import { ProductService } from '../services/ProductService';
import { sseManager } from '../utils/sseManager';
import { AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { auditLogRepository, categoryRepository } from '../repositories/sharedRepositories';

export class ProductController {
  private productService: ProductService;

  constructor(productService: ProductService) {
    this.productService = productService;
  }

  public getProducts = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { unit } = req.query;
      const products = await this.productService.getProductsByBusinessUnit(unit as string);
      return res.status(200).json({ data: products });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Gagal mengambil daftar produk' });
    }
  };

  public createProduct = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.user_id || 'usr-system';
      const username = req.user?.username || 'Pegawai';

      const product = await this.productService.createProduct(req.body);

      const initialGudang = req.body.initial_stock_gudang || 0;
      const initialEtalase = req.body.initial_stock_etalase || 0;
      const totalInit = Number(initialGudang) + Number(initialEtalase);
      const stockMsg = product.manage_stock ? ` dengan Stok Awal: +${totalInit} Pcs (Gudang: ${initialGudang}, Etalase: ${initialEtalase})` : '';

      await auditLogRepository.logAction(
        userId,
        username,
        'STOCK_UPDATE',
        product.product_name,
        product.product_id,
        `Penambahan Produk Baru "${product.product_name}" [${product.business_unit}]${stockMsg}`
      );

      sseManager.broadcast('PRODUCT_UPDATED', { action: 'CREATED', data: product });
      sseManager.broadcast('STOCK_UPDATED', { action: 'CREATED', product_id: product.product_id });

      return res.status(201).json({ message: 'Produk berhasil ditambahkan', data: product });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Gagal menambahkan produk' });
    }
  };

  public updateProduct = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.user_id || 'usr-system';
      const username = req.user?.username || 'Pegawai';
      const { id } = req.params;

      const product = await this.productService.updateProduct(id, req.body);
      if (!product) {
        return res.status(404).json({
          error: 'Produk tidak ditemukan',
          message: `Gagal memperbarui produk: Produk ID #${id} tidak ditemukan di sistem database.`,
        });
      }

      // Fetch category details from category repository for server-sent notification
      const catObj = product.category_id ? await categoryRepository.findById(product.category_id) : null;
      const catName = catObj ? catObj.category_name : 'Kategori Terpilih';
      const unitLabel = product.business_unit === 'FNB' ? 'Food & Beverage (FNB)' : 'FC / Printing & ATK';

      const responseMessage = `Produk "${product.product_name}" berhasil diperbarui ke Bidang: ${unitLabel} | Kategori: ${catName}.`;

      await auditLogRepository.logAction(
        userId,
        username,
        'PRODUCT_UPDATE',
        product.product_name,
        id,
        responseMessage
      );

      sseManager.broadcast('PRODUCT_UPDATED', { action: 'UPDATED', product_id: id, data: product, message: responseMessage });

      return res.status(200).json({
        message: responseMessage,
        data: product,
      });
    } catch (error: any) {
      return res.status(400).json({
        error: error.message || 'Gagal memperbarui detail produk',
        message: `Gagal memperbarui produk: ${error.message || 'Terjadi kesalahan sistem di server'}`,
      });
    }
  };

  public deleteProduct = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.user_id || 'usr-system';
      const username = req.user?.username || 'Pegawai';
      const { id } = req.params;

      await this.productService.deleteProduct(id);

      await auditLogRepository.logAction(
        userId,
        username,
        'PRODUCT_DELETE',
        `Produk #${id}`,
        id,
        `Penghapusan produk dan stok fisik ID #${id}`
      );

      sseManager.broadcast('PRODUCT_UPDATED', { action: 'DELETED', product_id: id });
      sseManager.broadcast('STOCK_UPDATED', { action: 'DELETED', product_id: id });
      return res.status(200).json({ message: 'Produk dan stok berhasil dihapus.' });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Gagal menghapus produk' });
    }
  };
}
