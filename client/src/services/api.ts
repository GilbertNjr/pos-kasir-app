import { User, Category, Product, BusinessUnit, Shift, ShiftCapitalContribution, Transaction, TransactionItem, PaymentMethod, Expense } from '../types';

const API_BASE = '/api';

export interface LoginResponseData {
  token: string;
  user: User;
}

export interface ActiveShiftDetailsData {
  shift: Shift;
  contributions: ShiftCapitalContribution[];
  usersCount: number;
}

export interface CreateTransactionItemDTO {
  product_id: string;
  qty: number;
  discount_amount?: number;
}

export interface CreateTransactionResultData {
  transaction: Transaction;
  items: TransactionItem[];
  change_due: number;
}

export interface PaymentMethodStats {
  count: number;
  amount: number;
}

export interface PaymentSummaryData {
  total_transactions: number;
  total_revenue: number;
  cash: PaymentMethodStats;
  qris: PaymentMethodStats;
  transfer: PaymentMethodStats;
}

export const apiService = {
  getToken(): string | null {
    return localStorage.getItem('pos_auth_token');
  },

  setAuth(token: string, user: User) {
    localStorage.setItem('pos_auth_token', token);
    localStorage.setItem('pos_auth_user', JSON.stringify(user));
  },

  clearAuth() {
    localStorage.removeItem('pos_auth_token');
    localStorage.removeItem('pos_auth_user');
  },

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('pos_auth_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  async login(username: string, passwordPlain: string): Promise<LoginResponseData> {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: passwordPlain }),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Login gagal');

    this.setAuth(result.data.token, result.data.user);
    return result.data;
  },

  async getProfile(): Promise<User> {
    const token = this.getToken();
    if (!token) throw new Error('Tidak ada sesi login');

    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await response.json();
    if (!response.ok) {
      this.clearAuth();
      throw new Error(result.error || 'Gagal mengambil profil');
    }
    return result.data;
  },

  async getUsers(): Promise<User[]> {
    const token = this.getToken();
    if (!token) throw new Error('Tidak ada sesi login');

    const response = await fetch(`${API_BASE}/auth/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Gagal mengambil daftar pengguna');
    return result.data;
  },

  async getCategories(unit?: BusinessUnit): Promise<Category[]> {
    const token = this.getToken();
    const url = unit ? `${API_BASE}/categories?unit=${unit}` : `${API_BASE}/categories`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Gagal mengambil kategori');
    return result.data;
  },

  async getProducts(unit?: string): Promise<Product[]> {
    const token = this.getToken();
    const url = unit && unit !== 'ALL' ? `${API_BASE}/products?unit=${unit}` : `${API_BASE}/products`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Gagal mengambil daftar produk');
    return result.data;
  },

  async createProduct(productData: Partial<Product>): Promise<Product> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Gagal membuat produk baru');
    return result.data;
  },

  /* SHIFT API SERVICES */
  async getActiveShift(): Promise<ActiveShiftDetailsData | null> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE}/shifts/active`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Gagal mengambil shift aktif');
    return result.data;
  },

  async openShift(initialCash: number): Promise<ActiveShiftDetailsData> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE}/shifts/open`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ initial_cash: initialCash }),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Gagal membuka shift');
    return result.data;
  },

  async addCapitalContribution(shiftId: string, amount: number): Promise<ShiftCapitalContribution> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE}/shifts/capital`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ shift_id: shiftId, amount }),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Gagal menyetor modal');
    return result.data;
  },

  async closeShift(shiftId: string, actualPhysicalCash: number): Promise<Shift> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE}/shifts/close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ shift_id: shiftId, actual_physical_cash: actualPhysicalCash }),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Gagal menutup shift');
    return result.data;
  },

  async returnCapitalContribution(contributionId: string): Promise<ShiftCapitalContribution> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE}/shifts/return-capital`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ contribution_id: contributionId }),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Gagal memproses pengembalian modal');
    return result.data;
  },

  /* TRANSACTION API SERVICES */
  async createTransaction(
    paymentMethod: PaymentMethod,
    items: CreateTransactionItemDTO[],
    cashTendered?: number
  ): Promise<CreateTransactionResultData> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        payment_method: paymentMethod,
        items,
        cash_tendered: cashTendered,
      }),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Gagal memproses transaksi');
    return result.data;
  },

  async getTransactions(shiftId?: string): Promise<Transaction[]> {
    const token = this.getToken();
    const url = shiftId ? `${API_BASE}/transactions?shift_id=${shiftId}` : `${API_BASE}/transactions`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Gagal mengambil transaksi');
    return result.data;
  },

  async getPaymentSummary(shiftId: string): Promise<PaymentSummaryData> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE}/transactions/payment-summary?shift_id=${shiftId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Gagal mengambil rekap pembayaran');
    return result.data;
  },

  /* EXPENSE API SERVICES */
  async createExpense(category: string, description: string, amount: number): Promise<Expense> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ category, description, amount }),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Gagal mencatat pengeluaran');
    return result.data;
  },

  async getExpenses(shiftId?: string): Promise<Expense[]> {
    const token = this.getToken();
    const url = shiftId ? `${API_BASE}/expenses?shift_id=${shiftId}` : `${API_BASE}/expenses`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Gagal mengambil daftar pengeluaran');
    return result.data;
  },

  /* STOCK API SERVICES */
  async getStocks(): Promise<any[]> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE}/stocks`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Gagal mengambil data stok');
    return result.data;
  },

  async updateStock(productId: string, currentStock: number): Promise<any> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE}/stocks/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ product_id: productId, current_stock: currentStock }),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Gagal merestok/menyesuaikan stok');
    return result.data;
  },

  /* DASHBOARD OWNER API SERVICES */
  async getDashboardMetrics(): Promise<any> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE}/dashboard/metrics`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Gagal mengambil metrik dashboard owner');
    return result.data;
  },

  /* REPORTING API SERVICES */
  async getSalesReport(filterParams: Record<string, string>): Promise<any> {
    const token = this.getToken();
    const query = new URLSearchParams(filterParams).toString();
    const response = await fetch(`${API_BASE}/reports/sales?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Gagal generate laporan penjualan');
    return result.data;
  },

  /* BACKUP & RESTORE API SERVICES */
  async exportBackup(): Promise<any> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE}/backup/export`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Gagal membuat backup snapshot');
    return result.data;
  },

  async getBackupHistory(): Promise<any[]> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE}/backup/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Gagal mengambil riwayat backup');
    return result.data;
  },

  async restoreBackup(snapshotData: any): Promise<any> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE}/backup/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ snapshot_data: snapshotData }),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Gagal merestore data snapshot');
    return result.data;
  },

  /* AUDIT LOG API SERVICES */
  async getAuditLogs(): Promise<any[]> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE}/audit-logs`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Gagal mengambil audit log sistem');
    return result.data;
  },

  /* GOOGLE SHEETS INTEGRATION API SERVICES */
  async getGoogleSheetsStatus(): Promise<{ is_connected: boolean; spreadsheet_id: string }> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE}/backup/google-sheets-status`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Gagal mengambil status Google Sheets');
    return result.data;
  },

  async syncGoogleSheets(): Promise<any> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE}/backup/google-sheets-sync`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Gagal menyinkronkan data ke Google Sheets');
    return result.data;
  },
};
