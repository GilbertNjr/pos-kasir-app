/* Backend Domain Interfaces matching DATABASE.md v0.2.0 */

export type UserRole = 'OWNER' | 'PENANGGUNG_JAWAB' | 'KARYAWAN';
export type UserStatus = 'PENDING_ACTIVATION' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface UserEntity {
  user_id: string;
  username: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  is_pj?: boolean;
  shift?: string;
  status: UserStatus;
  avatar_url?: string;
  last_login?: string;
  invited_by_user_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface RoleEntity {
  role_id: string;
  role_name: UserRole;
  description?: string;
  created_at?: string;
}

export interface PermissionEntity {
  permission_id: string;
  permission_code: string;
  permission_name: string;
  module: string;
  created_at?: string;
}

export interface ActivationTokenEntity {
  token_id: string;
  user_id: string;
  token_hash: string;
  activation_code_display: string;
  status: 'PENDING' | 'USED' | 'EXPIRED';
  expires_at: string;
  used_at?: string;
  created_at: string;
}

export interface EmployeeAssignmentEntity {
  assignment_id: string;
  supervisor_user_id: string;
  employee_user_id: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at?: string;
}

export type ShiftStatus = 'ACTIVE' | 'CLOSED';
export type ReconciliationStatus = 'PAS' | 'LEBIH' | 'KURANG';

export interface ShiftEntity {
  shift_id: string;
  opened_by_user_id: string;
  shift_leader_user_id: string;
  closed_by_user_id?: string;
  start_time: string;
  end_time?: string;
  total_initial_cash: number;
  net_cash_sales: number;           // Hanya transaksi CASH
  total_qris_sales: number;         // Rekap penjualan QRIS non-tunai
  total_transfer_sales: number;     // Rekap penjualan Transfer Bank
  total_cash_expenses: number;
  theoretical_cash: number;
  actual_physical_cash?: number;
  cash_variance?: number;
  reconciliation_status?: ReconciliationStatus;
  shift_status: ShiftStatus;
}

export interface ShiftUserEntity {
  shift_user_id: string;
  shift_id: string;
  user_id: string;
  is_shift_leader: boolean;
  joined_at: string;
}

export type CapitalStatus = 'HELD' | 'RETURNED';

export interface ShiftCapitalContributionEntity {
  contribution_id: string;
  shift_id: string;
  user_id: string;
  amount: number;
  contribution_time: string;
  returned_amount?: number;
  returned_at?: string;
  status: CapitalStatus;
}

export type BusinessUnit = 'FC_PRINT' | 'FNB';

export type PaymentMethod = 'CASH' | 'QRIS' | 'TRANSFER';

export type TransactionStatus = 'COMPLETED' | 'CANCELLED';

export interface TransactionEntity {
  transaction_id: string;
  transaction_number: string;
  created_by_user_id: string;
  shift_id: string;
  subtotal_amount: number;
  discount_amount: number;
  final_total: number;
  payment_method: PaymentMethod;
  transaction_time: string;
  status: TransactionStatus;
}

export interface TransactionItemEntity {
  transaction_item_id: string;
  transaction_id: string;
  product_id: string;
  unit_price: number;
  qty: number;
  subtotal: number;
  discount_amount: number;
}

export interface ProductEntity {
  product_id: string;
  category_id: string;
  product_name: string;
  business_unit: BusinessUnit;
  selling_price: number;
  manage_stock: boolean;
  is_active: boolean;
}

export interface StockEntity {
  stock_id: string;
  product_id: string;
  current_stock: number;
  stock_gudang?: number;
  stock_etalase?: number;
  last_updated: string;
}

export interface ExpenseCategory {
  value: string;
  label: string;
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { value: 'BAHAN_BAKU', label: 'Pembelian Bahan Baku' },
  { value: 'OPERASIONAL', label: 'Biaya Operasional Toko' },
  { value: 'ATK', label: 'Pembelian ATK & Perlengkapan' },
  { value: 'LAIN_LAIN', label: 'Pengeluaran Lain-lain' },
];

export interface ExpenseEntity {
  expense_id: string;
  shift_id: string;
  recorded_by_user_id: string;
  category: string;
  description: string;
  amount: number;
  expense_time: string;
}

export interface AuditLogEntity {
  audit_id: string;
  user_id: string;
  username: string;
  action: string;
  affected_entity: string;
  entity_id: string;
  details: string;
  timestamp: string;
}
