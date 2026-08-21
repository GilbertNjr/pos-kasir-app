import { UserRepository } from '../repositories/UserRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { ProductRepository } from '../repositories/ProductRepository';
import { ShiftRepository } from '../repositories/ShiftRepository';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { TransactionItemRepository } from '../repositories/TransactionItemRepository';
import { ExpenseRepository } from '../repositories/ExpenseRepository';
import { StockRepository } from '../repositories/StockRepository';
import { GoogleSheetsSyncService } from './GoogleSheetsSyncService';
import { pool } from '../database/db';

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
  type?: string;
  location?: string;
  description?: string;
  status?: string;
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
    const logItem: BackupHistoryLog = {
      backup_id: backupId,
      created_at: createdAt,
      created_by_user_id: userId,
      size_bytes: sizeBytes,
    };

    this.backupHistoryLogs.unshift(logItem);

    try {
      await pool.query(
        `INSERT INTO backups (backup_id, created_by_user_id, backup_type, size_bytes, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [backupId, userId || 'SYSTEM', 'MANUAL_SNAPSHOT', sizeBytes, createdAt]
      );
    } catch (err: any) {
      console.warn('[BackupService] DB insert log fallback to memory:', err.message);
    }

    return snapshot;
  }

  async getBackupHistory(): Promise<BackupHistoryLog[]> {
    try {
      const res = await pool.query(
        `SELECT backup_id, created_at::text, created_by_user_id, size_bytes::bigint
         FROM backups
         ORDER BY created_at DESC`
      );
      if (res.rows.length > 0) {
        return res.rows.map((r) => ({
          backup_id: r.backup_id,
          created_at: r.created_at,
          created_by_user_id: r.created_by_user_id,
          size_bytes: Number(r.size_bytes || 0),
        }));
      }
    } catch (err: any) {
      console.warn('[BackupService] DB fetch failed, returning memory history:', err.message);
    }
    return [...this.backupHistoryLogs];
  }

  async deleteBackupHistory(backupId: string): Promise<boolean> {
    this.backupHistoryLogs = this.backupHistoryLogs.filter((log) => log.backup_id !== backupId);
    try {
      await pool.query(`DELETE FROM backups WHERE backup_id = $1`, [backupId]);
    } catch (err: any) {
      console.warn('[BackupService] DB delete log fallback:', err.message);
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
