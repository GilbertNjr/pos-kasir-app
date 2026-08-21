import { UserRepository } from '../repositories/UserRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { ProductRepository } from '../repositories/ProductRepository';
import { ShiftRepository } from '../repositories/ShiftRepository';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { TransactionItemRepository } from '../repositories/TransactionItemRepository';
import { ExpenseRepository } from '../repositories/ExpenseRepository';
import { StockRepository } from '../repositories/StockRepository';
import { GoogleSheetsSyncService } from './GoogleSheetsSyncService';

export interface BackupPayload {
  backup_id: string;
  created_at: string;
  created_by_user_id: string;
  system_version: string;
  data: {
    users: any[];
    categories: any[];
    products: any[];
    shifts: any[];
    transactions: any[];
    transaction_items: any[];
    expenses: any[];
    stocks: any[];
  };
}

export interface BackupHistoryLog {
  backup_id: string;
  created_at: string;
  created_by_user_id: string;
  size_bytes: number;
}

export class BackupService {
  private userRepository: UserRepository;
  private categoryRepository: CategoryRepository;
  private productRepository: ProductRepository;
  private shiftRepository: ShiftRepository;
  private transactionRepository: TransactionRepository;
  private itemRepository: TransactionItemRepository;
  private expenseRepository: ExpenseRepository;
  private stockRepository: StockRepository;

  private backupHistoryLogs: BackupHistoryLog[] = [];

  constructor(
    userRepository: UserRepository,
    categoryRepository: CategoryRepository,
    productRepository: ProductRepository,
    shiftRepository: ShiftRepository,
    transactionRepository: TransactionRepository,
    itemRepository: TransactionItemRepository,
    expenseRepository: ExpenseRepository,
    stockRepository: StockRepository
  ) {
    this.userRepository = userRepository;
    this.categoryRepository = categoryRepository;
    this.productRepository = productRepository;
    this.shiftRepository = shiftRepository;
    this.transactionRepository = transactionRepository;
    this.itemRepository = itemRepository;
    this.expenseRepository = expenseRepository;
    this.stockRepository = stockRepository;
  }

  async createBackupSnapshot(userId: string): Promise<BackupPayload> {
    const users = await this.userRepository.findAll();
    // Hilangkan password hash sensitif dari backup snapshot
    const safeUsers = users.map(({ password_hash, ...u }) => u);

    const categories = await this.categoryRepository.findAll();
    const products = await this.productRepository.findAll();
    const shifts = await this.shiftRepository.findAll();
    const transactions = await this.transactionRepository.findAll();
    const transaction_items = await this.itemRepository.findAll();
    const expenses = await this.expenseRepository.findAll();
    const stocks = await this.stockRepository.findAll();

    const backupId = `bkp-${Date.now()}`;
    const createdAt = new Date().toISOString();

    const snapshot: BackupPayload = {
      backup_id: backupId,
      created_at: createdAt,
      created_by_user_id: userId,
      system_version: 'v1.0.0-pos',
      data: {
        users: safeUsers,
        categories,
        products,
        shifts,
        transactions,
        transaction_items,
        expenses,
        stocks,
      },
    };

    const sizeBytes = Buffer.byteLength(JSON.stringify(snapshot));
    this.backupHistoryLogs.unshift({
      backup_id: backupId,
      created_at: createdAt,
      created_by_user_id: userId,
      size_bytes: sizeBytes,
    });

    return snapshot;
  }

  async getBackupHistory(): Promise<BackupHistoryLog[]> {
    return [...this.backupHistoryLogs];
  }

  async deleteBackupHistory(backupId: string): Promise<boolean> {
    const index = this.backupHistoryLogs.findIndex((log) => log.backup_id === backupId);
    if (index !== -1) {
      this.backupHistoryLogs.splice(index, 1);
    }
    return true;
  }

  async restoreFromSnapshot(snapshotData: any, userId: string): Promise<{ restored_counts: Record<string, number> }> {
    if (!snapshotData || !snapshotData.data) {
      throw new Error('Format snapshot backup tidak valid.');
    }

    const { products, categories, expenses, stocks } = snapshotData.data;

    let restoredProductsCount = 0;
    if (Array.isArray(products)) {
      for (const prod of products) {
        const existing = await this.productRepository.findById(prod.product_id);
        if (!existing) {
          await this.productRepository.create(prod);
          restoredProductsCount++;
        }
      }
    }

    let restoredStocksCount = 0;
    if (Array.isArray(stocks)) {
      for (const stk of stocks) {
        const existing = await this.stockRepository.findById(stk.stock_id);
        if (!existing) {
          await this.stockRepository.create(stk);
          restoredStocksCount++;
        }
      }
    }

    return {
      restored_counts: {
        products: restoredProductsCount,
        stocks: restoredStocksCount,
      },
    };
  }

  async syncToGoogleSheets(userId: string) {
    const snapshot = await this.createBackupSnapshot(userId);
    const syncService = new GoogleSheetsSyncService();
    return await syncService.syncSnapshotToSheets(snapshot.data);
  }

  async getGoogleSheetsStatus() {
    const syncService = new GoogleSheetsSyncService();
    return syncService.getStatus();
  }
}
