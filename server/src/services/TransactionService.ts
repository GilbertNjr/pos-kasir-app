import { TransactionRepository } from '../repositories/TransactionRepository';
import { TransactionItemRepository } from '../repositories/TransactionItemRepository';
import { ShiftRepository } from '../repositories/ShiftRepository';
import { ProductRepository } from '../repositories/ProductRepository';
import { StockService } from './StockService';
import { TransactionEntity, TransactionItemEntity, PaymentMethod, ShiftEntity } from '../types/domain';

export interface CreateTransactionItemDTO {
  product_id: string;
  qty: number;
  discount_amount?: number;
}

export interface CreateTransactionDTO {
  user_id: string;
  payment_method: PaymentMethod;
  items: CreateTransactionItemDTO[];
  cash_tendered?: number; // Nominal uang tunai yang diserahkan pembeli
}

export interface TransactionDetailsResult {
  transaction: TransactionEntity;
  items: TransactionItemEntity[];
  change_due: number;
}

export class TransactionService {
  private transactionRepository: TransactionRepository;
  private itemRepository: TransactionItemRepository;
  private shiftRepository: ShiftRepository;
  private productRepository: ProductRepository;
  private stockService?: StockService;

  constructor(
    transactionRepository: TransactionRepository,
    itemRepository: TransactionItemRepository,
    shiftRepository: ShiftRepository,
    productRepository: ProductRepository,
    stockService?: StockService
  ) {
    this.transactionRepository = transactionRepository;
    this.itemRepository = itemRepository;
    this.shiftRepository = shiftRepository;
    this.productRepository = productRepository;
    this.stockService = stockService;
  }

  async createTransaction(dto: CreateTransactionDTO): Promise<TransactionDetailsResult> {
    // 1. Validasi Sesi Shift Aktif
    const activeShift = await this.shiftRepository.findActiveShift();
    if (!activeShift) {
      throw new Error('Transaksi ditolak. Tidak ada sesi shift yang aktif (ACTIVE). Harap buka shift terlebih dahulu.');
    }

    if (!dto.items || dto.items.length === 0) {
      throw new Error('Keranjang belanja transaksi tidak boleh kosong.');
    }

    const nowIso = new Date().toISOString();
    const transaction_id = `tx-${Date.now()}`;
    const transaction_number = `TRX-${Date.now().toString().slice(-6)}`;

    let calculatedSubtotal = 0;
    let calculatedDiscount = 0;
    const itemEntities: TransactionItemEntity[] = [];

    // 2. Iterasi & Validasi Setiap Item Keranjang Belanja
    for (const itemDto of dto.items) {
      const product = await this.productRepository.findById(itemDto.product_id);
      if (!product || !product.is_active) {
        throw new Error(`Produk dengan ID ${itemDto.product_id} tidak ditemukan atau tidak aktif.`);
      }

      if (itemDto.qty <= 0) {
        throw new Error(`Jumlah kuantitas (qty) untuk ${product.product_name} harus minimal 1.`);
      }

      const unitPrice = product.selling_price;
      const itemDiscount = itemDto.discount_amount ?? 0;
      const subtotal = unitPrice * itemDto.qty - itemDiscount;

      calculatedSubtotal += unitPrice * itemDto.qty;
      calculatedDiscount += itemDiscount;

      itemEntities.push({
        transaction_item_id: `txi-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        transaction_id,
        product_id: product.product_id,
        unit_price: unitPrice,
        qty: itemDto.qty,
        subtotal,
        discount_amount: itemDiscount,
      });
    }

    const finalTotal = calculatedSubtotal - calculatedDiscount;
    const cashTendered = dto.payment_method === 'CASH' ? Number(dto.cash_tendered ?? finalTotal) : finalTotal;

    if (dto.payment_method === 'CASH' && cashTendered < finalTotal) {
      throw new Error(`Uang tunai yang diserahkan (Rp ${cashTendered.toLocaleString()}) kurang dari total tagihan (Rp ${finalTotal.toLocaleString()}).`);
    }

    const changeDue = dto.payment_method === 'CASH' ? cashTendered - finalTotal : 0;

    // 3. Buat Header Entitas Transaksi
    const newTransaction: TransactionEntity = {
      transaction_id,
      transaction_number,
      created_by_user_id: dto.user_id,
      shift_id: activeShift.shift_id,
      subtotal_amount: calculatedSubtotal,
      discount_amount: calculatedDiscount,
      final_total: finalTotal,
      payment_method: dto.payment_method,
      transaction_time: nowIso,
      status: 'COMPLETED',
    };

    await this.transactionRepository.create(newTransaction);

    // 4. Simpan Item Detail Transaksi & Potong Stok Produk Fisik
    for (const itemEntity of itemEntities) {
      await this.itemRepository.create(itemEntity);
      if (this.stockService) {
        await this.stockService.deductStock(itemEntity.product_id, itemEntity.qty);
      }
    }

    // 5. Update rekap pembayaran per metode pada Sesi Shift Aktif
    const shiftUpdates: Partial<ShiftEntity> = {};

    if (dto.payment_method === 'CASH') {
      const updatedNetCashSales = activeShift.net_cash_sales + finalTotal;
      shiftUpdates.net_cash_sales = updatedNetCashSales;
      shiftUpdates.theoretical_cash =
        activeShift.total_initial_cash + updatedNetCashSales - activeShift.total_cash_expenses;
    } else if (dto.payment_method === 'QRIS') {
      shiftUpdates.total_qris_sales = (activeShift.total_qris_sales ?? 0) + finalTotal;
    } else if (dto.payment_method === 'TRANSFER') {
      shiftUpdates.total_transfer_sales = (activeShift.total_transfer_sales ?? 0) + finalTotal;
    }

    await this.shiftRepository.update(activeShift.shift_id, shiftUpdates);

    return {
      transaction: newTransaction,
      items: itemEntities,
      change_due: changeDue,
    };
  }

  async getAllTransactions(): Promise<TransactionEntity[]> {
    return this.transactionRepository.findAll();
  }

  async getTransactionsByShift(shift_id: string): Promise<TransactionEntity[]> {
    return this.transactionRepository.findByShiftId(shift_id);
  }

  async getPaymentSummaryByShift(shift_id: string): Promise<PaymentSummary> {
    const transactions = await this.transactionRepository.findWhere(
      (t) => t.shift_id === shift_id && t.status === 'COMPLETED'
    );

    const summary: PaymentSummary = {
      total_transactions: transactions.length,
      total_revenue: 0,
      cash: { count: 0, amount: 0 },
      qris: { count: 0, amount: 0 },
      transfer: { count: 0, amount: 0 },
    };

    for (const tx of transactions) {
      summary.total_revenue += tx.final_total;
      if (tx.payment_method === 'CASH') {
        summary.cash.count += 1;
        summary.cash.amount += tx.final_total;
      } else if (tx.payment_method === 'QRIS') {
        summary.qris.count += 1;
        summary.qris.amount += tx.final_total;
      } else if (tx.payment_method === 'TRANSFER') {
        summary.transfer.count += 1;
        summary.transfer.amount += tx.final_total;
      }
    }

    return summary;
  }
}

export interface PaymentMethodStats {
  count: number;
  amount: number;
}

export interface PaymentSummary {
  total_transactions: number;
  total_revenue: number;
  cash: PaymentMethodStats;
  qris: PaymentMethodStats;
  transfer: PaymentMethodStats;
}
