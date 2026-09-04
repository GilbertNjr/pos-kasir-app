import { StockRepository } from '../repositories/StockRepository';
import { ProductRepository } from '../repositories/ProductRepository';
import { StockEntity, ProductEntity } from '../types/domain';

export interface StockWithProductDetails extends StockEntity {
  product_name: string;
  business_unit: string;
  manage_stock: boolean;
}

export class StockService {
  private stockRepository: StockRepository;
  private productRepository: ProductRepository;

  constructor(stockRepository: StockRepository, productRepository: ProductRepository) {
    this.stockRepository = stockRepository;
    this.productRepository = productRepository;
  }

  async getAllStocksWithProducts(): Promise<StockWithProductDetails[]> {
    const products = await this.productRepository.findAll();
    const stocks = await this.stockRepository.findAll();

    const stockMap = new Map<string, StockEntity>();
    for (const stock of stocks) {
      stockMap.set(stock.product_id, stock);
    }

    const result: StockWithProductDetails[] = [];

    for (const prod of products) {
      if (prod.manage_stock) {
        let stock = stockMap.get(prod.product_id);
        if (!stock) {
          // Buat entri stok default 0 jika belum ada
          stock = await this.stockRepository.create({
            stock_id: `stk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            product_id: prod.product_id,
            current_stock: 0,
            stock_gudang: 0,
            stock_etalase: 0,
            last_updated: new Date().toISOString(),
          });
        }

        const totalStock = stock.current_stock;
        const etalase = stock.stock_etalase !== undefined && stock.stock_etalase !== null ? stock.stock_etalase : 0;
        const gudang = stock.stock_gudang !== undefined && stock.stock_gudang !== null ? stock.stock_gudang : Math.max(0, totalStock - etalase);

        result.push({
          ...stock,
          current_stock: totalStock,
          stock_gudang: gudang,
          stock_etalase: etalase,
          product_name: prod.product_name,
          business_unit: prod.business_unit,
          manage_stock: prod.manage_stock,
        });
      }
    }

    return result;
  }

  async deductStock(product_id: string, qty: number): Promise<StockEntity | null> {
    const product = await this.productRepository.findById(product_id);
    if (!product || !product.manage_stock) {
      // Jasa atau item tanpa kelola stok tidak mengurangi stok
      return null;
    }

    // Coba pengurangan atomic langsung di PostgreSQL untuk menjamin race-condition protection
    const atomicUpdated = await this.stockRepository.deductStockAtomic(product_id, qty);
    if (atomicUpdated) {
      return atomicUpdated;
    }

    let stock = await this.stockRepository.findByProductId(product_id);
    if (!stock) {
      stock = await this.stockRepository.create({
        stock_id: `stk-${Date.now()}`,
        product_id,
        current_stock: 0,
        stock_gudang: 0,
        stock_etalase: 0,
        last_updated: new Date().toISOString(),
      });
    }

    // Pengurangan stok prioritas utama dari etalase, sisanya dari gudang
    let etalase = stock.stock_etalase !== undefined && stock.stock_etalase !== null ? Number(stock.stock_etalase) : 0;
    let gudang = stock.stock_gudang !== undefined && stock.stock_gudang !== null ? Number(stock.stock_gudang) : Math.max(0, Number(stock.current_stock) - etalase);

    let remainingDeduct = qty;
    if (etalase >= remainingDeduct) {
      etalase -= remainingDeduct;
      remainingDeduct = 0;
    } else {
      remainingDeduct -= etalase;
      etalase = 0;
      gudang = Math.max(0, gudang - remainingDeduct);
    }

    const newStockAmount = Math.max(0, gudang + etalase);
    return this.stockRepository.update(stock.stock_id, {
      current_stock: newStockAmount,
      stock_gudang: gudang,
      stock_etalase: etalase,
    });
  }

  async restoreStock(product_id: string, qty: number): Promise<StockEntity | null> {
    const product = await this.productRepository.findById(product_id);
    if (!product || !product.manage_stock) {
      return null;
    }

    let stock = await this.stockRepository.findByProductId(product_id);
    if (!stock) return null;

    let etalase = stock.stock_etalase !== undefined && stock.stock_etalase !== null ? Number(stock.stock_etalase) : 0;
    let gudang = stock.stock_gudang !== undefined && stock.stock_gudang !== null ? Number(stock.stock_gudang) : Math.max(0, Number(stock.current_stock) - etalase);
    
    // Kembalikan stok ke etalase toko
    etalase += qty;

    const newStockAmount = gudang + etalase;
    return this.stockRepository.update(stock.stock_id, {
      current_stock: newStockAmount,
      stock_gudang: gudang,
      stock_etalase: etalase,
    });
  }

  async updateStockQuantity(product_id: string, newQuantity: number, inputGudang?: number, inputEtalase?: number): Promise<StockEntity> {
    if (newQuantity < 0) {
      throw new Error('Jumlah stok tidak boleh kurang dari 0.');
    }

    const product = await this.productRepository.findById(product_id);
    if (!product || !product.manage_stock) {
      throw new Error('Item ini tidak dikonfigurasi untuk mengelola stok fisik.');
    }

    let stock = await this.stockRepository.findByProductId(product_id);

    let gudang: number;
    let etalase: number;

    if (inputGudang !== undefined && inputEtalase !== undefined) {
      // 1. Input eksplisit dari UI (Gudang & Etalase ditentukan pasti oleh pengguna)
      gudang = Math.max(0, Number(inputGudang));
      etalase = Math.max(0, Number(inputEtalase));
      newQuantity = gudang + etalase;
    } else if (inputGudang !== undefined) {
      gudang = Math.max(0, Number(inputGudang));
      const currentEtalase = stock ? (stock.stock_etalase ?? 0) : 0;
      etalase = Math.max(0, currentEtalase);
      newQuantity = gudang + etalase;
    } else if (inputEtalase !== undefined) {
      etalase = Math.max(0, Number(inputEtalase));
      const currentGudang = stock ? (stock.stock_gudang ?? 0) : 0;
      gudang = Math.max(0, currentGudang);
      newQuantity = gudang + etalase;
    } else if (stock) {
      // 2. Koreksi total stok tanpa merusak alokasi gudang/etalase yang sudah ada
      const currentEtalase = stock.stock_etalase !== undefined && stock.stock_etalase !== null ? Number(stock.stock_etalase) : 0;
      const currentGudang = stock.stock_gudang !== undefined && stock.stock_gudang !== null ? Number(stock.stock_gudang) : Math.max(0, Number(stock.current_stock) - currentEtalase);
      
      const diff = newQuantity - (currentGudang + currentEtalase);
      if (diff >= 0) {
        // Jika ada penambahan total, tambahkan ke Gudang secara aman
        gudang = currentGudang + diff;
        etalase = currentEtalase;
      } else {
        // Jika ada pengurangan total, kurangi dari Gudang dulu lalu Etalase
        let remainingReduce = Math.abs(diff);
        if (currentGudang >= remainingReduce) {
          gudang = currentGudang - remainingReduce;
          etalase = currentEtalase;
        } else {
          remainingReduce -= currentGudang;
          gudang = 0;
          etalase = Math.max(0, currentEtalase - remainingReduce);
        }
      }
    } else {
      // Entri baru pertama kali
      etalase = newQuantity;
      gudang = 0;
    }

    if (!stock) {
      return this.stockRepository.create({
        stock_id: `stk-${Date.now()}`,
        product_id,
        current_stock: newQuantity,
        stock_gudang: gudang,
        stock_etalase: etalase,
        last_updated: new Date().toISOString(),
      });
    }

    const updated = await this.stockRepository.update(stock.stock_id, {
      current_stock: newQuantity,
      stock_gudang: gudang,
      stock_etalase: etalase,
    });

    return updated!;
  }
}
