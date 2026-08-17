import { ProductRepository, ProductEntity } from '../repositories/ProductRepository';
import { stockRepository } from '../repositories/sharedRepositories';

export class ProductService {
  private productRepository: ProductRepository;

  constructor(productRepository: ProductRepository) {
    this.productRepository = productRepository;
  }

  async getAllProducts(): Promise<ProductEntity[]> {
    return this.productRepository.findAll();
  }

  async getProductsByBusinessUnit(unit?: string): Promise<ProductEntity[]> {
    if (!unit || unit === 'ALL') {
      return this.productRepository.findWhere((p) => p.is_active);
    }
    return this.productRepository.findWhere((p) => p.business_unit === unit && p.is_active);
  }

  async createProduct(data: Partial<ProductEntity>): Promise<ProductEntity> {
    if (!data.product_name || !data.category_id || !data.business_unit || data.selling_price === undefined) {
      throw new Error('Nama produk, kategori, bidang usaha, dan harga jual wajib diisi.');
    }

    if (data.selling_price <= 0) {
      throw new Error('Harga jual produk harus lebih besar dari Rp 0.');
    }

    const newProduct: ProductEntity = {
      product_id: `prd-${Date.now()}`,
      category_id: data.category_id,
      product_name: data.product_name,
      business_unit: data.business_unit,
      selling_price: data.selling_price,
      manage_stock: data.manage_stock ?? true,
      is_active: data.is_active ?? true,
    };

    return this.productRepository.create(newProduct);
  }

  async updateProduct(product_id: string, data: Partial<ProductEntity>): Promise<ProductEntity> {
    const existing = await this.productRepository.findById(product_id);
    if (!existing) {
      throw new Error('Produk tidak ditemukan.');
    }

    if (data.selling_price !== undefined && data.selling_price <= 0) {
      throw new Error('Harga jual produk harus lebih besar dari Rp 0.');
    }

    const updated = await this.productRepository.update(product_id, data);
    return updated!;
  }

  async deleteProduct(product_id: string): Promise<boolean> {
    const existing = await this.productRepository.findById(product_id);
    if (!existing) {
      throw new Error('Produk tidak ditemukan.');
    }
    await stockRepository.deleteByProductId(product_id);
    return this.productRepository.delete(product_id);
  }
}
