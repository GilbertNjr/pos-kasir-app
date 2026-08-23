import { TransactionRepository } from '../repositories/TransactionRepository';
import { TransactionItemRepository } from '../repositories/TransactionItemRepository';
import { ProductRepository } from '../repositories/ProductRepository';
import { ExpenseRepository } from '../repositories/ExpenseRepository';
import { ShiftRepository } from '../repositories/ShiftRepository';
import { UserRepository } from '../repositories/UserRepository';
import { aiService, BusinessInsightItem } from './AIService';

export interface DashboardFilterDTO {
  period_type?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';
  start_date?: string;
  end_date?: string;
}

export interface TopProductSummary {
  rank: number;
  product_id: string;
  product_name: string;
  business_unit: string;
  qty_sold: number;
  total_revenue: number;
}

export interface SlowMovingProductSummary {
  product_id: string;
  product_name: string;
  business_unit: string;
  qty_sold: number;
  current_stock?: number;
}

export interface RevenueChartPoint {
  label: string;
  omzet: number;
  transaction_count: number;
}

export interface CategoryRevenueSummary {
  category_name: string;
  business_unit: string;
  omzet: number;
}

export interface EmployeeDashboardSummary {
  user_id: string;
  username: string;
  full_name: string;
  role: string;
  is_pj?: boolean;
  transaction_count: number;
  total_sales: number;
  is_active_in_shift: boolean;
}

export interface RecentTransactionSummary {
  transaction_id: string;
  transaction_number: string;
  transaction_time: string;
  created_by_username: string;
  final_total: number;
  payment_method: string;
  status: string;
}

export interface ComprehensiveDashboardMetrics {
  period_info: {
    period_type: string;
    start_date: string;
    end_date: string;
  };
  kpi: {
    total_omzet: number;
    total_expenses: number;
    total_transactions_count: number;
    total_items_sold: number;
    average_order_value: number;
  };
  revenue_chart: RevenueChartPoint[];
  unit_distribution: {
    FC_PRINT: number;
    FNB: number;
  };
  category_distribution: CategoryRevenueSummary[];
  top_selling_products: TopProductSummary[];
  slow_moving_products: SlowMovingProductSummary[];
  employee_performance: EmployeeDashboardSummary[];
  recent_transactions: RecentTransactionSummary[];
  alerts: {
    unresolved_shift_variances: number;
    low_stock_products_count: number;
  };
  business_insights: BusinessInsightItem[];
  last_updated: string;
}

export class DashboardService {
  private transactionRepository: TransactionRepository;
  private itemRepository: TransactionItemRepository;
  private productRepository: ProductRepository;
  private expenseRepository: ExpenseRepository;
  private shiftRepository: ShiftRepository;
  private userRepository: UserRepository;

  constructor(
    transactionRepository: TransactionRepository,
    itemRepository: TransactionItemRepository,
    productRepository: ProductRepository,
    expenseRepository: ExpenseRepository,
    shiftRepository?: ShiftRepository,
    userRepository?: UserRepository
  ) {
    this.transactionRepository = transactionRepository;
    this.itemRepository = itemRepository;
    this.productRepository = productRepository;
    this.expenseRepository = expenseRepository;
    this.shiftRepository = shiftRepository || new ShiftRepository();
    this.userRepository = userRepository || new UserRepository();
  }

  async getDashboardMetrics(filter?: DashboardFilterDTO): Promise<ComprehensiveDashboardMetrics> {
    const period_type = filter?.period_type || 'DAILY';
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date();

    if (period_type === 'DAILY') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (period_type === 'WEEKLY') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period_type === 'MONTHLY') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    } else if (period_type === 'YEARLY') {
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
    } else if (period_type === 'CUSTOM' && filter?.start_date && filter?.end_date) {
      startDate = new Date(filter.start_date);
      endDate = new Date(filter.end_date);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    }

    // Read all base entities concurrently in parallel for ultra-fast performance
    const [
      allTransactions,
      allItems,
      allProducts,
      allExpenses,
      allUsers,
      activeShift,
      allShifts,
    ] = await Promise.all([
      this.transactionRepository.findAll(),
      this.itemRepository.findAll(),
      this.productRepository.findAll(),
      this.expenseRepository.findAll(),
      this.userRepository.findAll(),
      this.shiftRepository.findActiveShift(),
      this.shiftRepository.findAll(),
    ]);

    const userMap = new Map<string, string>();
    for (const u of allUsers) {
      userMap.set(u.user_id, u.username);
    }

    const productMap = new Map<string, any>();
    for (const p of allProducts) {
      productMap.set(p.product_id, p);
    }

    // Filter Completed Transactions by Period
    const periodTransactions = allTransactions.filter((t) => {
      if (t.status !== 'COMPLETED') return false;
      const tTime = new Date(t.transaction_time);
      return tTime >= startDate && tTime <= endDate;
    });

    const periodTxIds = new Set(periodTransactions.map((t) => t.transaction_id));

    // Filter Expenses by Period
    const periodExpenses = allExpenses.filter((e) => {
      const eTime = new Date(e.expense_time);
      return eTime >= startDate && eTime <= endDate;
    });

    // KPI Calculations
    const total_omzet = periodTransactions.reduce((sum, t) => sum + t.final_total, 0);
    const total_expenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
    const total_transactions_count = periodTransactions.length;
    const average_order_value = total_transactions_count > 0 ? Math.round(total_omzet / total_transactions_count) : 0;

    // Filter Items for Period Transactions
    const periodItems = allItems.filter((item) => periodTxIds.has(item.transaction_id));
    const total_items_sold = periodItems.reduce((sum, item) => sum + item.qty, 0);

    // Revenue Chart Grouping
    const revenue_chart: RevenueChartPoint[] = this.buildChartPoints(period_type, startDate, endDate, periodTransactions);

    // Unit & Category Distribution
    const unit_distribution = { FC_PRINT: 0, FNB: 0 };
    const categoryOmzetMap = new Map<string, { category_name: string; business_unit: string; omzet: number }>();

    for (const item of periodItems) {
      const prod = productMap.get(item.product_id);
      if (prod) {
        if (prod.business_unit === 'FC_PRINT') unit_distribution.FC_PRINT += item.subtotal;
        else if (prod.business_unit === 'FNB') unit_distribution.FNB += item.subtotal;

        const catKey = prod.category_id || 'Umum';
        const existingCat = categoryOmzetMap.get(catKey) || { category_name: catKey, business_unit: prod.business_unit, omzet: 0 };
        existingCat.omzet += item.subtotal;
        categoryOmzetMap.set(catKey, existingCat);
      }
    }

    const category_distribution: CategoryRevenueSummary[] = Array.from(categoryOmzetMap.values())
      .sort((a, b) => b.omzet - a.omzet);

    // Top Selling Products & Slow Moving Products
    const prodStatsMap = new Map<string, { qty: number; revenue: number }>();
    for (const p of allProducts) {
      prodStatsMap.set(p.product_id, { qty: 0, revenue: 0 });
    }

    for (const item of periodItems) {
      const stats = prodStatsMap.get(item.product_id) || { qty: 0, revenue: 0 };
      stats.qty += item.qty;
      stats.revenue += item.subtotal;
      prodStatsMap.set(item.product_id, stats);
    }

    const top_selling_products: TopProductSummary[] = allProducts
      .map((p) => {
        const stats = prodStatsMap.get(p.product_id) || { qty: 0, revenue: 0 };
        return {
          rank: 0,
          product_id: p.product_id,
          product_name: p.product_name,
          business_unit: p.business_unit,
          qty_sold: stats.qty,
          total_revenue: stats.revenue,
        };
      })
      .sort((a, b) => b.qty_sold - a.qty_sold)
      .slice(0, 5)
      .map((p, idx) => ({ ...p, rank: idx + 1 }));

    const slow_moving_products: SlowMovingProductSummary[] = allProducts
      .map((p) => {
        const stats = prodStatsMap.get(p.product_id) || { qty: 0, revenue: 0 };
        return {
          product_id: p.product_id,
          product_name: p.product_name,
          business_unit: p.business_unit,
          qty_sold: stats.qty,
        };
      })
      .sort((a, b) => a.qty_sold - b.qty_sold)
      .slice(0, 5);

    // Employee Performance Breakdown
    const activeShiftUserIds = new Set<string>();
    
    // Collect all active shift user IDs and usernames
    const activeShifts = allShifts.filter((s) => s.shift_status === 'ACTIVE');
    for (const s of activeShifts) {
      if (s.opened_by_user_id) activeShiftUserIds.add(s.opened_by_user_id.toLowerCase());
      if (s.shift_leader_user_id) activeShiftUserIds.add(s.shift_leader_user_id.toLowerCase());
      if (s.closed_by_user_id) activeShiftUserIds.add(s.closed_by_user_id.toLowerCase());
    }

    if (activeShift) {
      if (activeShift.opened_by_user_id) activeShiftUserIds.add(activeShift.opened_by_user_id.toLowerCase());
      if (activeShift.shift_leader_user_id) activeShiftUserIds.add(activeShift.shift_leader_user_id.toLowerCase());
    }

    // Also include any user who created a transaction during the active shift / period
    for (const tx of periodTransactions) {
      if (tx.created_by_user_id) {
        activeShiftUserIds.add(tx.created_by_user_id.toLowerCase());
      }
    }

    const empMap = new Map<string, EmployeeDashboardSummary>();
    
    // Always exclude OWNER from cashier & employee metrics
    const nonOwnerUsers = allUsers.filter((u) => u.role !== 'OWNER');

    for (const u of nonOwnerUsers) {
      const uIdLower = u.user_id.toLowerCase();
      const uNameLower = u.username.toLowerCase();
      const uFullNameLower = u.full_name.toLowerCase();

      const isDirectMatch =
        activeShiftUserIds.has(uIdLower) ||
        activeShiftUserIds.has(uNameLower) ||
        activeShiftUserIds.has(uFullNameLower);

      // Active cashier = direct shift match OR user account is ACTIVE and has logged in
      const isActiveInShift = isDirectMatch || (u.status === 'ACTIVE' && u.last_login && u.last_login !== '-');

      empMap.set(u.user_id, {
        user_id: u.user_id,
        username: u.username,
        full_name: u.full_name,
        role: u.role,
        is_pj: Boolean(u.is_pj),
        transaction_count: 0,
        total_sales: 0,
        is_active_in_shift: Boolean(isActiveInShift),
      });
    }

    for (const tx of periodTransactions) {
      const emp = empMap.get(tx.created_by_user_id);
      if (emp) {
        emp.transaction_count += 1;
        emp.total_sales += tx.final_total;
      }
    }

    const employee_performance: EmployeeDashboardSummary[] = Array.from(empMap.values());

    // Recent Transactions (10 Latest overall)
    const sortedAllTx = [...allTransactions].sort(
      (a, b) => new Date(b.transaction_time).getTime() - new Date(a.transaction_time).getTime()
    );

    const recent_transactions: RecentTransactionSummary[] = sortedAllTx.slice(0, 10).map((t) => ({
      transaction_id: t.transaction_id,
      transaction_number: t.transaction_number,
      transaction_time: t.transaction_time,
      created_by_username: userMap.get(t.created_by_user_id) || t.created_by_user_id,
      final_total: t.final_total,
      payment_method: t.payment_method,
      status: t.status,
    }));

    // Alerts (Hanya hitung selisih kas shift yang terjadi pada periode filter yang dipilih)
    const unresolved_shift_variances = allShifts.filter((s) => {
      if (s.reconciliation_status !== 'KURANG') return false;
      const sDateRaw = s.end_time || (s as any).closed_at || s.start_time;
      if (!sDateRaw) return false;
      const sDate = new Date(sDateRaw);
      return sDate >= startDate && sDate <= endDate;
    }).length;
    const low_stock_products_count = 0; // stok alert placeholder

    // AI Business Insights Engine (with 5-Key Fallback & Machine Learning Heuristic Engine)
    const business_insights: BusinessInsightItem[] = await aiService.generateBusinessInsights({
      period_type,
      total_omzet,
      total_expenses,
      total_transactions_count,
      total_items_sold,
      top_selling_products,
      slow_moving_products,
      category_distribution,
    });

    return {
      period_info: {
        period_type,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      },
      kpi: {
        total_omzet,
        total_expenses,
        total_transactions_count,
        total_items_sold,
        average_order_value,
      },
      revenue_chart,
      unit_distribution,
      category_distribution,
      top_selling_products,
      slow_moving_products,
      employee_performance,
      recent_transactions,
      alerts: {
        unresolved_shift_variances,
        low_stock_products_count,
      },
      business_insights,
      last_updated: new Date().toISOString(),
    };
  }

  private buildChartPoints(
    period_type: string,
    startDate: Date,
    endDate: Date,
    transactions: any[]
  ): RevenueChartPoint[] {
    const pointsMap = new Map<string, { omzet: number; count: number }>();

    if (period_type === 'DAILY') {
      for (let h = 0; h < 24; h += 2) {
        const label = `${h.toString().padStart(2, '0')}:00`;
        pointsMap.set(label, { omzet: 0, count: 0 });
      }

      for (const tx of transactions) {
        const h = new Date(tx.transaction_time).getHours();
        const bucket = `${(Math.floor(h / 2) * 2).toString().padStart(2, '0')}:00`;
        const current = pointsMap.get(bucket) || { omzet: 0, count: 0 };
        current.omzet += tx.final_total;
        current.count += 1;
        pointsMap.set(bucket, current);
      }
    } else if (period_type === 'WEEKLY') {
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      for (let i = 1; i <= 6; i++) pointsMap.set(days[i], { omzet: 0, count: 0 });
      pointsMap.set(days[0], { omzet: 0, count: 0 });

      for (const tx of transactions) {
        const d = days[new Date(tx.transaction_time).getDay()];
        const current = pointsMap.get(d) || { omzet: 0, count: 0 };
        current.omzet += tx.final_total;
        current.count += 1;
        pointsMap.set(d, current);
      }
    } else if (period_type === 'MONTHLY') {
      for (let d = 1; d <= 31; d += 3) {
        const label = `Tgl ${d}`;
        pointsMap.set(label, { omzet: 0, count: 0 });
      }

      for (const tx of transactions) {
        const dateNum = new Date(tx.transaction_time).getDate();
        const bucket = `Tgl ${Math.floor((dateNum - 1) / 3) * 3 + 1}`;
        const current = pointsMap.get(bucket) || { omzet: 0, count: 0 };
        current.omzet += tx.final_total;
        current.count += 1;
        pointsMap.set(bucket, current);
      }
    } else {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      for (const m of months) pointsMap.set(m, { omzet: 0, count: 0 });

      for (const tx of transactions) {
        const m = months[new Date(tx.transaction_time).getMonth()];
        const current = pointsMap.get(m) || { omzet: 0, count: 0 };
        current.omzet += tx.final_total;
        current.count += 1;
        pointsMap.set(m, current);
      }
    }

    const result: RevenueChartPoint[] = [];
    pointsMap.forEach((val, key) => {
      result.push({
        label: key,
        omzet: val.omzet,
        transaction_count: val.count,
      });
    });

    return result;
  }
}
