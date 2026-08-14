import { TransactionRepository } from '../repositories/TransactionRepository';
import { TransactionItemRepository } from '../repositories/TransactionItemRepository';
import { ProductRepository } from '../repositories/ProductRepository';
import { ExpenseRepository } from '../repositories/ExpenseRepository';
import { TransactionEntity, TransactionItemEntity, ProductEntity, ExpenseEntity } from '../types/domain';

export interface TopProductSummary {
  product_id: string;
  product_name: string;
  business_unit: string;
  qty_sold: number;
  total_revenue: number;
}

export interface DashboardMetrics {
  omzet_today: number;
  omzet_this_week: number;
  omzet_this_month: number;
  omzet_this_year: number;
  total_transactions_count: number;
  total_expenses: number;
  net_profit_estimate: number;
  revenue_by_unit: {
    FC_PRINT: number;
    FNB: number;
  };
  revenue_by_method: {
    CASH: number;
    QRIS: number;
    TRANSFER: number;
  };
  top_selling_products: TopProductSummary[];
  slow_moving_products: TopProductSummary[];
}

export class DashboardService {
  private transactionRepository: TransactionRepository;
  private itemRepository: TransactionItemRepository;
  private productRepository: ProductRepository;
  private expenseRepository: ExpenseRepository;

  constructor(
    transactionRepository: TransactionRepository,
    itemRepository: TransactionItemRepository,
    productRepository: ProductRepository,
    expenseRepository: ExpenseRepository
  ) {
    this.transactionRepository = transactionRepository;
    this.itemRepository = itemRepository;
    this.productRepository = productRepository;
    this.expenseRepository = expenseRepository;
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const transactions = await this.transactionRepository.findAll();
    const completedTx = transactions.filter((t) => t.status === 'COMPLETED');

    const allItems = await this.itemRepository.findAll();
    const allProducts = await this.productRepository.findAll();
    const allExpenses = await this.expenseRepository.findAll();

    const productMap = new Map<string, ProductEntity>();
    for (const p of allProducts) {
      productMap.set(p.product_id, p);
    }

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    // Hitung tanggal 7 hari lalu, awal bulan, awal tahun
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    let omzet_today = 0;
    let omzet_this_week = 0;
    let omzet_this_month = 0;
    let omzet_this_year = 0;

    const revenue_by_method = { CASH: 0, QRIS: 0, TRANSFER: 0 };
    const completedTxIds = new Set(completedTx.map((t) => t.transaction_id));

    for (const tx of completedTx) {
      const txDate = new Date(tx.transaction_time);
      const txDateStr = tx.transaction_time.slice(0, 10);

      // Metrik Omzet Waktu
      if (txDateStr === todayStr) omzet_today += tx.final_total;
      if (txDate >= sevenDaysAgo) omzet_this_week += tx.final_total;
      if (txDate >= startOfMonth) omzet_this_month += tx.final_total;
      if (txDate >= startOfYear) omzet_this_year += tx.final_total;

      // Metrik Metode Bayar
      if (tx.payment_method === 'CASH') revenue_by_method.CASH += tx.final_total;
      else if (tx.payment_method === 'QRIS') revenue_by_method.QRIS += tx.final_total;
      else if (tx.payment_method === 'TRANSFER') revenue_by_method.TRANSFER += tx.final_total;
    }

    // Hitung Total Pengeluaran
    const total_expenses = allExpenses.reduce((sum, e) => sum + e.amount, 0);
    const net_profit_estimate = omzet_this_year - total_expenses;

    // Metrik Per Produk (Top Selling & Slow Moving)
    const productStatsMap = new Map<string, { qty: number; revenue: number }>();
    for (const prod of allProducts) {
      productStatsMap.set(prod.product_id, { qty: 0, revenue: 0 });
    }

    const revenue_by_unit = { FC_PRINT: 0, FNB: 0 };

    for (const item of allItems) {
      if (completedTxIds.has(item.transaction_id)) {
        const prod = productMap.get(item.product_id);
        if (prod) {
          if (prod.business_unit === 'FC_PRINT') revenue_by_unit.FC_PRINT += item.subtotal;
          else if (prod.business_unit === 'FNB') revenue_by_unit.FNB += item.subtotal;

          const stats = productStatsMap.get(item.product_id) || { qty: 0, revenue: 0 };
          stats.qty += item.qty;
          stats.revenue += item.subtotal;
          productStatsMap.set(item.product_id, stats);
        }
      }
    }

    const productSummaries: TopProductSummary[] = [];
    for (const prod of allProducts) {
      const stats = productStatsMap.get(prod.product_id) || { qty: 0, revenue: 0 };
      productSummaries.push({
        product_id: prod.product_id,
        product_name: prod.product_name,
        business_unit: prod.business_unit,
        qty_sold: stats.qty,
        total_revenue: stats.revenue,
      });
    }

    // Urutkan untuk Produk Terlaris (Qty terbanyak)
    const top_selling_products = [...productSummaries]
      .sort((a, b) => b.qty_sold - a.qty_sold)
      .slice(0, 5);

    // Urutkan untuk Produk Penjualan Rendah / Slow Moving (Qty terendah)
    const slow_moving_products = [...productSummaries]
      .sort((a, b) => a.qty_sold - b.qty_sold)
      .slice(0, 5);

    return {
      omzet_today,
      omzet_this_week,
      omzet_this_month,
      omzet_this_year,
      total_transactions_count: completedTx.length,
      total_expenses,
      net_profit_estimate,
      revenue_by_unit,
      revenue_by_method,
      top_selling_products,
      slow_moving_products,
    };
  }
}
