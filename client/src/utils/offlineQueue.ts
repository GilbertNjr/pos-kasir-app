import { PaymentMethod } from '../types';
import { CreateTransactionItemDTO } from '../services/api';

export interface OfflineTransaction {
  id: string;
  idempotency_key: string;
  paymentMethod: PaymentMethod;
  items: CreateTransactionItemDTO[];
  cashTendered: number;
  total_amount: number;
  created_at: string;
  status: 'PENDING' | 'SYNCING';
}

const STORAGE_KEY = 'pos_offline_transactions';

export const offlineQueue = {
  getQueue(): OfflineTransaction[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveQueue(queue: OfflineTransaction[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
      window.dispatchEvent(new Event('pos_offline_queue_updated'));
    } catch (e) {
      console.error('[OfflineQueue] Failed to save queue to localStorage:', e);
    }
  },

  enqueue(
    paymentMethod: PaymentMethod,
    items: CreateTransactionItemDTO[],
    cashTendered: number,
    totalAmount: number
  ): OfflineTransaction {
    const queue = this.getQueue();
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const id = `offtx_${timestamp}_${randomStr}`;
    const idempotencyKey = `idemp_${id}`;

    const newTx: OfflineTransaction = {
      id,
      idempotency_key: idempotencyKey,
      paymentMethod,
      items,
      cashTendered,
      total_amount: totalAmount,
      created_at: new Date().toISOString(),
      status: 'PENDING',
    };

    queue.push(newTx);
    this.saveQueue(queue);
    return newTx;
  },

  remove(id: string): void {
    const queue = this.getQueue().filter((tx) => tx.id !== id);
    this.saveQueue(queue);
  },

  count(): number {
    return this.getQueue().length;
  },

  async syncAll(
    apiService: any,
    onSuccessItem?: (tx: OfflineTransaction) => void
  ): Promise<{ syncedCount: number; failedCount: number }> {
    const queue = this.getQueue();
    if (queue.length === 0) return { syncedCount: 0, failedCount: 0 };

    let syncedCount = 0;
    let failedCount = 0;

    const token = apiService.getToken();
    if (!token) return { syncedCount: 0, failedCount: queue.length };

    for (const tx of queue) {
      try {
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'X-Idempotency-Key': tx.idempotency_key,
          },
          body: JSON.stringify({
            payment_method: tx.paymentMethod,
            items: tx.items,
            cash_tendered: tx.cashTendered,
          }),
        });

        if (response.ok || response.status === 409) {
          // Success or already processed via idempotency key
          this.remove(tx.id);
          syncedCount++;
          if (onSuccessItem) onSuccessItem(tx);
        } else {
          failedCount++;
        }
      } catch (err) {
        console.warn('[OfflineQueue] Sync failed for tx:', tx.id, err);
        failedCount++;
      }
    }

    return { syncedCount, failedCount };
  },
};
