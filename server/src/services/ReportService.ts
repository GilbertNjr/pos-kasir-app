import { TransactionRepository } from '../repositories/TransactionRepository';
import { TransactionItemRepository } from '../repositories/TransactionItemRepository';
import { ProductRepository } from '../repositories/ProductRepository';
import { UserRepository } from '../repositories/UserRepository';
import { ExpenseRepository } from '../repositories/ExpenseRepository';
import { TransactionEntity, PaymentMethod, BusinessUnit, ExpenseEntity } from '../types/domain';
import { getWIBDateRange, parseAsWIBDate } from '../utils/timezoneUtils';

export interface SalesReportFilterDTO {
  period_type?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';
  start_date?: string;
  end_date?: string;
  user_id?: string;
  shift_id?: string;
  business_unit?: BusinessUnit | 'ALL';
  payment_method?: PaymentMethod | 'ALL';
}

export interface EmployeePerformanceSummary {
  user_id: string;
  username: string;
  full_name: string;
  role: string;
  transaction_count: number;
  total_sales: number;
  cash_sales: number;
  qris_sales: number;
  transfer_sales: number;
  recorded_expenses_amount: number;
}

export interface SalesReportResult {
  summary: {
    total_transactions: number;
    total_gross_sales: number;
    total_discounts: number;
    total_net_sales: number;
    cash_sales: number;
    qris_sales: number;
    transfer_sales: number;
    total_expenses: number;
  };
  transactions: TransactionEntity[];
  expenses: ExpenseEntity[];
  employee_performance: EmployeePerformanceSummary[];
}

export class ReportService {
  private transactionRepository: TransactionRepository;
  private itemRepository: TransactionItemRepository;
  private productRepository: ProductRepository;
  private userRepository: UserRepository;
  private expenseRepository: ExpenseRepository;

  constructor(
    transactionRepository: TransactionRepository,
    itemRepository: TransactionItemRepository,
    productRepository: ProductRepository,
    userRepository: UserRepository,
    expenseRepository: ExpenseRepository
  ) {
    this.transactionRepository = transactionRepository;
    this.itemRepository = itemRepository;
    this.productRepository = productRepository;
    this.userRepository = userRepository;
    this.expenseRepository = expenseRepository;
  }

  async generateSalesReport(filter: SalesReportFilterDTO): Promise<SalesReportResult> {
    const allTransactions = await this.transactionRepository.findAll();
    const completedTx = allTransactions.filter(
      (t) => (t.status || 'COMPLETED').toUpperCase() !== 'CANCELLED'
    );
    const allUsers = await this.userRepository.findAll();
    const allExpenses = await this.expenseRepository.findAll();
    const allItems = await this.itemRepository.findAll();
    const allProducts = await this.productRepository.findAll();

    const productUnitMap = new Map<string, BusinessUnit>();
    for (const p of allProducts) {
      productUnitMap.set(p.product_id, p.business_unit);
    }

    const txItemUnitMap = new Map<string, Set<BusinessUnit>>();
    for (const item of allItems) {
      const unit = productUnitMap.get(item.product_id);
      if (unit) {
        if (!txItemUnitMap.has(item.transaction_id)) {
          txItemUnitMap.set(item.transaction_id, new Set());
        }
        txItemUnitMap.get(item.transaction_id)!.add(unit);
      }
    }

    // Import WIB Date Range Helper
    const { startDate, endDate } = getWIBDateRange(
      filter.period_type,
      filter.start_date,
      filter.end_date
    );

    const filteredTransactions = completedTx.filter((tx) => {
      const rawDateStr = tx.transaction_time || (tx as any).created_at || (tx as any).date;
      const txTime = parseAsWIBDate(rawDateStr);

      if (txTime && !isNaN(txTime.getTime())) {
        if (startDate && txTime < startDate) return false;
        if (endDate && txTime > endDate) return false;
      }
      if (filter.user_id && tx.created_by_user_id !== filter.user_id) return false;
      if (filter.shift_id && tx.shift_id !== filter.shift_id) return false;
      if (filter.payment_method && filter.payment_method !== 'ALL' && tx.payment_method !== filter.payment_method) {
        return false;
      }

      if (filter.business_unit && filter.business_unit !== 'ALL') {
        const units = txItemUnitMap.get(tx.transaction_id);
        if (!units || !units.has(filter.business_unit)) {
          return false;
        }
      }

      return true;
    });

    const filteredExpenses = allExpenses.filter((exp) => {
      const rawDateStr = exp.expense_time || (exp as any).created_at || (exp as any).date;
      const expTime = parseAsWIBDate(rawDateStr);

      if (expTime && !isNaN(expTime.getTime())) {
        if (startDate && expTime < startDate) return false;
        if (endDate && expTime > endDate) return false;
      }
      if (
        filter.user_id &&
        exp.recorded_by_user_id !== filter.user_id &&
        (exp as any).user_id !== filter.user_id &&
        (exp as any).created_by_user_id !== filter.user_id
      ) {
        return false;
      }
      if (filter.shift_id && exp.shift_id !== filter.shift_id) return false;

      return true;
    });

    let total_expenses = 0;
    for (const exp of filteredExpenses) {
      total_expenses += Number(exp.amount || 0);
    }

    // Summary calculations
    let total_gross_sales = 0;
    let total_discounts = 0;
    let total_net_sales = 0;
    let cash_sales = 0;
    let qris_sales = 0;
    let transfer_sales = 0;

    for (const tx of filteredTransactions) {
      total_gross_sales += tx.subtotal_amount;
      total_discounts += tx.discount_amount;
      total_net_sales += tx.final_total;

      if (tx.payment_method === 'CASH') cash_sales += tx.final_total;
      else if (tx.payment_method === 'QRIS') qris_sales += tx.final_total;
      else if (tx.payment_method === 'TRANSFER') transfer_sales += tx.final_total;
    }

    // Performa Kasir / Karyawan
    const empMap = new Map<string, EmployeePerformanceSummary>();
    for (const u of allUsers) {
      empMap.set(u.user_id, {
        user_id: u.user_id,
        username: u.username,
        full_name: u.full_name,
        role: u.role,
        transaction_count: 0,
        total_sales: 0,
        cash_sales: 0,
        qris_sales: 0,
        transfer_sales: 0,
        recorded_expenses_amount: 0,
      });
    }

    for (const tx of filteredTransactions) {
      const empId = tx.created_by_user_id || (tx as any).created_by || (tx as any).user_id;
      let emp = empMap.get(empId);
      if (!emp && empId) {
        const matchedUser = allUsers.find(
          (u) => u.user_id === empId || u.username === empId || u.full_name.toLowerCase() === String(empId).toLowerCase()
        );
        if (matchedUser) {
          emp = empMap.get(matchedUser.user_id);
        }
      }
      if (emp) {
        emp.transaction_count += 1;
        emp.total_sales += tx.final_total;
        if (tx.payment_method === 'CASH') emp.cash_sales += tx.final_total;
        else if (tx.payment_method === 'QRIS') emp.qris_sales += tx.final_total;
        else if (tx.payment_method === 'TRANSFER') emp.transfer_sales += tx.final_total;
      }
    }

    for (const exp of filteredExpenses) {
      const empId = exp.recorded_by_user_id || (exp as any).user_id || (exp as any).created_by_user_id || (exp as any).recorded_by;
      let emp = empMap.get(empId);
      if (!emp && empId) {
        const matchedUser = allUsers.find(
          (u) => u.user_id === empId || u.username === empId || u.full_name.toLowerCase() === String(empId).toLowerCase()
        );
        if (matchedUser) {
          emp = empMap.get(matchedUser.user_id);
        }
      }
      if (emp) {
        emp.recorded_expenses_amount += Number(exp.amount || 0);
      }
    }

    const productMap = new Map<string, any>();
    for (const p of allProducts) {
      productMap.set(p.product_id, p);
    }

    const itemsByTxMap = new Map<string, any[]>();
    for (const item of allItems) {
      const prod = productMap.get(item.product_id);
      const enrichedItem = {
        ...item,
        product_name: prod ? prod.product_name : 'Produk',
      };
      if (!itemsByTxMap.has(item.transaction_id)) {
        itemsByTxMap.set(item.transaction_id, []);
      }
      itemsByTxMap.get(item.transaction_id)!.push(enrichedItem);
    }

    const enrichedTransactions = filteredTransactions.map((tx) => ({
      ...tx,
      items: itemsByTxMap.get(tx.transaction_id) || [],
    }));

    let employee_performance = Array.from(empMap.values()).filter((e) => {
      if (filter.user_id) return e.user_id === filter.user_id;
      return e.transaction_count > 0 || e.recorded_expenses_amount > 0;
    });

    if (employee_performance.length === 0 && !filter.user_id) {
      employee_performance = Array.from(empMap.values());
    }


    return {
      summary: {
        total_transactions: filteredTransactions.length,
        total_gross_sales,
        total_discounts,
        total_net_sales,
        cash_sales,
        qris_sales,
        transfer_sales,
        total_expenses,
      },
      transactions: enrichedTransactions,
      expenses: filteredExpenses,
      employee_performance,
    };
  }
}

