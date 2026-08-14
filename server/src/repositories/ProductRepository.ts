import { IRepository } from './interfaces/IRepository';
import { BusinessUnit } from '../types/domain';

export interface ProductEntity {
  product_id: string;
  category_id: string;
  product_name: string;
  business_unit: BusinessUnit;
  selling_price: number;
  manage_stock: boolean;
  is_active: boolean;
}

export class ProductRepository implements IRepository<ProductEntity> {
  private products: ProductEntity[] = [];

  constructor() {
    this.seedProducts();
  }

  private seedProducts() {
    this.products = [
      // FC_PRINT Barang Fisik (manage_stock = true)
      { product_id: 'prd-fc-001', category_id: 'cat-fc-001', product_name: 'Pulpen Standard Hitam', business_unit: 'FC_PRINT', selling_price: 3000, manage_stock: true, is_active: true },
      { product_id: 'prd-fc-002', category_id: 'cat-fc-001', product_name: 'Buku Tulis Sidu 38 Lembar', business_unit: 'FC_PRINT', selling_price: 4500, manage_stock: true, is_active: true },
      { product_id: 'prd-fc-003', category_id: 'cat-fc-001', product_name: 'Map Kertas Stopmap', business_unit: 'FC_PRINT', selling_price: 2000, manage_stock: true, is_active: true },

      // FC_PRINT Jasa & Cetak (manage_stock = false)
      { product_id: 'prd-fc-004', category_id: 'cat-fc-002', product_name: 'Fotokopi A4 70gr (per Lembar)', business_unit: 'FC_PRINT', selling_price: 350, manage_stock: false, is_active: true },
      { product_id: 'prd-fc-005', category_id: 'cat-fc-003', product_name: 'Print Dokumen Warna A4', business_unit: 'FC_PRINT', selling_price: 1000, manage_stock: false, is_active: true },
      { product_id: 'prd-fc-006', category_id: 'cat-fc-004', product_name: 'Jasa Ketik Dokumen (per Halaman)', business_unit: 'FC_PRINT', selling_price: 5000, manage_stock: false, is_active: true },

      // FNB Barang Fisik (manage_stock = true)
      { product_id: 'prd-fnb-001', category_id: 'cat-fnb-002', product_name: 'Es Teh Manis Jumbo', business_unit: 'FNB', selling_price: 5000, manage_stock: true, is_active: true },
      { product_id: 'prd-fnb-002', category_id: 'cat-fnb-003', product_name: 'Seblak Spesial Komplit', business_unit: 'FNB', selling_price: 12000, manage_stock: true, is_active: true },
      { product_id: 'prd-fnb-003', category_id: 'cat-fnb-003', product_name: 'Gorengan Bakwan / Tahu (3 Pcs)', business_unit: 'FNB', selling_price: 5000, manage_stock: true, is_active: true },
      { product_id: 'prd-fnb-004', category_id: 'cat-fnb-004', product_name: 'Es Krim Cone Vanilla', business_unit: 'FNB', selling_price: 8000, manage_stock: true, is_active: true },
    ];
  }

  async findAll(): Promise<ProductEntity[]> {
    return [...this.products];
  }

  async findById(product_id: string): Promise<ProductEntity | null> {
    const prd = this.products.find((p) => p.product_id === product_id);
    return prd ? { ...prd } : null;
  }

  async findWhere(predicate: (item: ProductEntity) => boolean): Promise<ProductEntity[]> {
    return this.products.filter(predicate);
  }

  async create(product: ProductEntity): Promise<ProductEntity> {
    this.products.push(product);
    return { ...product };
  }

  async update(product_id: string, item: Partial<ProductEntity>): Promise<ProductEntity | null> {
    const index = this.products.findIndex((p) => p.product_id === product_id);
    if (index === -1) return null;

    this.products[index] = { ...this.products[index], ...item };
    return { ...this.products[index] };
  }
}
