import { ProductRepository, ProductEntity } from '../repositories/ProductRepository';
import { stockRepository, transactionItemRepository } from '../repositories/sharedRepositories';

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

    let linkedProductId: string | null = null;
    let linkedMultiplier = 1.0;

    if (data.linked_product_id) {
      const parent = await this.productRepository.findById(data.linked_product_id);
      if (!parent) {
        throw new Error('Produk induk sumber stok tidak ditemukan.');
      }
      if (parent.linked_product_id) {
        throw new Error('Produk sumber stok tidak boleh berupa produk yang sudah menautkan stoknya ke produk lain.');
      }
      linkedProductId = data.linked_product_id;
      linkedMultiplier = Number(data.linked_qty_multiplier) > 0 ? Number(data.linked_qty_multiplier) : 1.0;
    }

    const newProduct: ProductEntity = {
      product_id: `prd-${Date.now()}`,
      category_id: data.category_id,
      product_name: data.product_name,
      business_unit: data.business_unit,
      selling_price: data.selling_price,
      manage_stock: linkedProductId ? true : (data.manage_stock ?? true),
      linked_product_id: linkedProductId,
      linked_qty_multiplier: linkedMultiplier,
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

    if (data.linked_product_id !== undefined) {
      if (data.linked_product_id === product_id) {
        throw new Error('Produk tidak boleh menautkan stok ke dirinya sendiri.');
      }
      if (data.linked_product_id) {
        const parent = await this.productRepository.findById(data.linked_product_id);
        if (!parent) {
          throw new Error('Produk induk sumber stok tidak ditemukan.');
        }
        if (parent.linked_product_id) {
          throw new Error('Produk sumber stok tidak boleh berupa produk yang sudah menautkan stoknya ke produk lain.');
        }
      }
    }

    const updated = await this.productRepository.update(product_id, data);
    return updated!;
  }

  async deleteProduct(product_id: string): Promise<boolean> {
    const existing = await this.productRepository.findById(product_id);
    if (!existing) {
      throw new Error('Produk tidak ditemukan.');
    }

    // Cek apakah ada produk lain yang menautkan stoknya ke produk ini
    const allProducts = await this.productRepository.findAll();
    const dependents = allProducts.filter((p) => p.linked_product_id === product_id && p.is_active);
    if (dependents.length > 0) {
      const depNames = dependents.map((p) => `"${p.product_name}"`).join(', ');
      throw new Error(
        `Produk "${existing.product_name}" tidak dapat dihapus karena menjadi sumber stok bagi: ${depNames}. Silakan ubah atau hapus produk turunan tersebut terlebih dahulu.`
      );
    }

    // 1. Cek apakah produk memiliki riwayat transaksi di masa lalu
    const hasHistory = await transactionItemRepository.hasTransactions(product_id);
    if (hasHistory) {
      // Soft-delete safeguard: Ubah status menjadi non-aktif agar laporan historis tidak corrupt
      await this.productRepository.update(product_id, { is_active: false });
      return true;
    }

    // 2. Jika belum pernah bertransaksi sama sekali, aman untuk dihapus permanen
    await stockRepository.deleteByProductId(product_id);
    return this.productRepository.delete(product_id);
  }
}
