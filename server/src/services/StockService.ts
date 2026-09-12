import { StockRepository } from '../repositories/StockRepository';
import { ProductRepository } from '../repositories/ProductRepository';
import { StockEntity, ProductEntity } from '../types/domain';

export interface StockWithProductDetails extends StockEntity {
  product_name: string;
  business_unit: string;
  manage_stock: boolean;
  is_linked?: boolean;
  linked_product_id?: string | null;
  linked_product_name?: string;
  linked_qty_multiplier?: number;
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

    const productMap = new Map<string, ProductEntity>();
    for (const prod of products) {
      productMap.set(prod.product_id, prod);
    }

    const stockMap = new Map<string, StockEntity>();
    for (const stock of stocks) {
      stockMap.set(stock.product_id, stock);
    }

    const result: StockWithProductDetails[] = [];

    for (const prod of products) {
      if (prod.manage_stock) {
        if (prod.linked_product_id) {
          // Produk terhubung: mencerminkan stok fisik produk induk
          const parentProd = productMap.get(prod.linked_product_id);
          let parentStock = stockMap.get(prod.linked_product_id);

          if (!parentStock && parentProd) {
            parentStock = await this.stockRepository.create({
              stock_id: `stk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              product_id: parentProd.product_id,
              current_stock: 0,
              stock_gudang: 0,
              stock_etalase: 0,
              last_updated: new Date().toISOString(),
            });
            stockMap.set(parentProd.product_id, parentStock);
          }

          const totalStock = parentStock ? Number(parentStock.current_stock) || 0 : 0;
          const gudang = parentStock && parentStock.stock_gudang !== undefined && parentStock.stock_gudang !== null
            ? Number(parentStock.stock_gudang)
            : 0;
          const etalase = parentStock && parentStock.stock_etalase !== undefined && parentStock.stock_etalase !== null
            ? Number(parentStock.stock_etalase)
            : Math.max(0, totalStock - gudang);

          result.push({
            stock_id: `stk-linked-${prod.product_id}`,
            product_id: prod.product_id,
            current_stock: totalStock,
            stock_gudang: gudang,
            stock_etalase: etalase,
            last_updated: parentStock ? parentStock.last_updated : new Date().toISOString(),
            product_name: prod.product_name,
            business_unit: prod.business_unit,
            manage_stock: true,
            is_linked: true,
            linked_product_id: prod.linked_product_id,
            linked_product_name: parentProd?.product_name || 'Produk Induk',
            linked_qty_multiplier: prod.linked_qty_multiplier || 1.0,
          });
          continue;
        }

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
          stockMap.set(prod.product_id, stock);
        }

        const totalStock = Number(stock.current_stock) || 0;
        const gudang = stock.stock_gudang !== undefined && stock.stock_gudang !== null ? Number(stock.stock_gudang) : 0;
        const etalase = stock.stock_etalase !== undefined && stock.stock_etalase !== null ? Number(stock.stock_etalase) : Math.max(0, totalStock - gudang);

        result.push({
          ...stock,
          current_stock: totalStock,
          stock_gudang: gudang,
          stock_etalase: etalase,
          product_name: prod.product_name,
          business_unit: prod.business_unit,
          manage_stock: prod.manage_stock,
          is_linked: false,
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

    // Jika produk terhubung ke produk induk, alihkan pemotongan ke produk induk
    if (product.linked_product_id) {
      const multiplier = product.linked_qty_multiplier && Number(product.linked_qty_multiplier) > 0
        ? Number(product.linked_qty_multiplier)
        : 1.0;
      return this.deductStock(product.linked_product_id, qty * multiplier);
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

    const etalase = stock.stock_etalase !== undefined && stock.stock_etalase !== null ? Number(stock.stock_etalase) : 0;
    const gudang = stock.stock_gudang !== undefined && stock.stock_gudang !== null ? Number(stock.stock_gudang) : 0;

    // CEGAH TRANSAKSI JIKA STOK ETALASE TIDAK MENCUKUPI (JANGAN SEDOT GUDANG OTOMATIS)
    if (etalase < qty) {
      throw new Error(
        `Stok di etalase toko untuk "${product.product_name}" tidak mencukupi (Tersedia di etalase: ${etalase} pcs, di gudang: ${gudang} pcs). Silakan lakukan pemindahan stok dari gudang ke etalase terlebih dahulu.`
      );
    }

    // Coba pengurangan atomic langsung di PostgreSQL untuk menjamin race-condition protection (Hanya potong etalase)
    const atomicUpdated = await this.stockRepository.deductStockAtomic(product_id, qty);
    if (atomicUpdated) {
      return atomicUpdated;
    }

    // Fallback in-memory: HANYA kurangi etalase, gudang tetap utuh
    const newEtalase = Math.max(0, etalase - qty);
    const newStockAmount = gudang + newEtalase;
    return this.stockRepository.update(stock.stock_id, {
      current_stock: newStockAmount,
      stock_gudang: gudang,
      stock_etalase: newEtalase,
    });
  }

  async restoreStock(product_id: string, qty: number): Promise<StockEntity | null> {
    const product = await this.productRepository.findById(product_id);
    if (!product || !product.manage_stock) {
      return null;
    }

    // Jika produk terhubung ke produk induk, alihkan pengembalian stok ke produk induk
    if (product.linked_product_id) {
      const multiplier = product.linked_qty_multiplier && Number(product.linked_qty_multiplier) > 0
        ? Number(product.linked_qty_multiplier)
        : 1.0;
      return this.restoreStock(product.linked_product_id, qty * multiplier);
    }

    let stock = await this.stockRepository.findByProductId(product_id);
    if (!stock) return null;

    let etalase = stock.stock_etalase !== undefined && stock.stock_etalase !== null ? Number(stock.stock_etalase) : 0;
    let gudang = stock.stock_gudang !== undefined && stock.stock_gudang !== null ? Number(stock.stock_gudang) : 0;
    
    // Kembalikan stok yang dibatalkan langsung ke etalase toko
    etalase += qty;

    const newStockAmount = gudang + etalase;
    return this.stockRepository.update(stock.stock_id, {
      current_stock: newStockAmount,
      stock_gudang: gudang,
      stock_etalase: etalase,
    });
  }

  async transferStock(product_id: string, qty: number): Promise<StockEntity> {
    if (qty <= 0) {
      throw new Error('Jumlah stok yang dipindahkan harus lebih dari 0.');
    }

    const product = await this.productRepository.findById(product_id);
    if (!product || !product.manage_stock) {
      throw new Error('Produk ini tidak dikonfigurasi untuk mengelola stok fisik.');
    }

    // Jika produk terhubung, pemindahan stok berlaku untuk produk induk
    if (product.linked_product_id) {
      return this.transferStock(product.linked_product_id, qty);
    }

    const stock = await this.stockRepository.findByProductId(product_id);
    if (!stock) {
      throw new Error('Data stok produk tidak ditemukan.');
    }

    const gudang = stock.stock_gudang !== undefined && stock.stock_gudang !== null ? Number(stock.stock_gudang) : 0;
    if (gudang < qty) {
      throw new Error(`Stok di gudang tidak mencukupi untuk dipindahkan (Tersedia di gudang: ${gudang} pcs).`);
    }

    const updated = await this.stockRepository.transferStock(product_id, qty);
    if (!updated) {
      throw new Error('Gagal memproses pemindahan stok di database.');
    }

    return updated;
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
      const currentGudang = stock.stock_gudang !== undefined && stock.stock_gudang !== null ? Number(stock.stock_gudang) : 0;
      
      const diff = newQuantity - (currentGudang + currentEtalase);
      if (diff >= 0) {
        // Jika ada penambahan total tanpa rincian, alokasikan ke Etalase (stok aktif jual)
        etalase = currentEtalase + diff;
        gudang = currentGudang;
      } else {
        // Jika ada pengurangan total, kurangi dari Etalase dulu lalu Gudang
        let remainingReduce = Math.abs(diff);
        if (currentEtalase >= remainingReduce) {
          etalase = currentEtalase - remainingReduce;
          gudang = currentGudang;
        } else {
          remainingReduce -= currentEtalase;
          etalase = 0;
          gudang = Math.max(0, currentGudang - remainingReduce);
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
