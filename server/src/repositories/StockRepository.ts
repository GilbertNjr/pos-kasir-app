import { IRepository } from './interfaces/IRepository';
import { StockEntity } from '../types/domain';

export class StockRepository implements IRepository<StockEntity> {
  private stocks: StockEntity[] = [
    // Seed data stok awal untuk produk fisik bawaan
    { stock_id: 'stk-1', product_id: 'prod-1', current_stock: 100, last_updated: new Date().toISOString() }, // Pulpen Gel Black 0.5mm
    { stock_id: 'stk-2', product_id: 'prod-2', current_stock: 50, last_updated: new Date().toISOString() },  // Buku Tulis Sidu 38 Lembar
    { stock_id: 'stk-3', product_id: 'prod-5', current_stock: 40, last_updated: new Date().toISOString() },  // Seblak Spesial Komplit
    { stock_id: 'stk-4', product_id: 'prod-6', current_stock: 80, last_updated: new Date().toISOString() },  // Es Teh Manis Jumbo
  ];

  async findAll(): Promise<StockEntity[]> {
    return [...this.stocks];
  }

  async findById(stock_id: string): Promise<StockEntity | null> {
    const stock = this.stocks.find((s) => s.stock_id === stock_id);
    return stock ? { ...stock } : null;
  }

  async findByProductId(product_id: string): Promise<StockEntity | null> {
    const stock = this.stocks.find((s) => s.product_id === product_id);
    return stock ? { ...stock } : null;
  }

  async findWhere(predicate: (item: StockEntity) => boolean): Promise<StockEntity[]> {
    return this.stocks.filter(predicate);
  }

  async create(stock: StockEntity): Promise<StockEntity> {
    this.stocks.push(stock);
    return { ...stock };
  }

  async update(stock_id: string, item: Partial<StockEntity>): Promise<StockEntity | null> {
    const index = this.stocks.findIndex((s) => s.stock_id === stock_id);
    if (index === -1) return null;

    this.stocks[index] = { ...this.stocks[index], ...item, last_updated: new Date().toISOString() };
    return { ...this.stocks[index] };
  }
}
