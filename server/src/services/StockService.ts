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
        const etalase = stock.stock_etalase !== undefined ? stock.stock_etalase : Math.min(totalStock, 5);
        const gudang = stock.stock_gudang !== undefined ? stock.stock_gudang : Math.max(0, totalStock - etalase);

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

    // Deduct primarily from etalase, then from gudang
    let etalase = stock.stock_etalase !== undefined ? stock.stock_etalase : Math.min(stock.current_stock, 5);
    let gudang = stock.stock_gudang !== undefined ? stock.stock_gudang : Math.max(0, stock.current_stock - etalase);

    let remainingDeduct = qty;
    if (etalase >= remainingDeduct) {
      etalase -= remainingDeduct;
      remainingDeduct = 0;
    } else {
      remainingDeduct -= etalase;
      etalase = 0;
      gudang = Math.max(0, gudang - remainingDeduct);
    }

    const newStockAmount = gudang + etalase;
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

    let etalase = stock.stock_etalase !== undefined ? stock.stock_etalase : Math.min(stock.current_stock, 5);
    let gudang = stock.stock_gudang !== undefined ? stock.stock_gudang : Math.max(0, stock.current_stock - etalase);
    etalase += qty; // Kembalikan stok ke etalase

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

    let gudang = inputGudang;
    let etalase = inputEtalase;

    if (gudang === undefined || etalase === undefined) {
      etalase = Math.min(newQuantity, 5);
      gudang = Math.max(0, newQuantity - etalase);
    } else {
      newQuantity = gudang + etalase;
    }

    let stock = await this.stockRepository.findByProductId(product_id);
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
