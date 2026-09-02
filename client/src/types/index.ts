/* Domain Types matching DATABASE.md v0.2.0 - Frontend Client */

export type UserRole = 'OWNER' | 'PENANGGUNG_JAWAB' | 'KARYAWAN';
export type UserStatus = 'PENDING_ACTIVATION' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';

export interface User {
  user_id: string;
  username: string;
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
  permissions?: string[];
  assigned_employees?: User[];
  supervisor?: User;
}

export interface ActivationToken {
  token_id: string;
  user_id: string;
  activation_code_display: string;
  status: 'PENDING' | 'USED' | 'EXPIRED';
  expires_at: string;
}

export interface EmployeeAssignment {
  assignment_id: string;
  supervisor_user_id: string;
  employee_user_id: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

export type BusinessUnit = 'FC_PRINT' | 'FNB';

export interface Category {
  category_id: string;
  category_name: string;
  business_unit: BusinessUnit;
  is_active: boolean;
}

export interface Product {
  product_id: string;
  category_id: string;
  product_name: string;
  business_unit: BusinessUnit;
  selling_price: number;
  manage_stock: boolean;
  stock?: number;
  is_active: boolean;
}

export interface Stock {
  stock_id: string;
  product_id: string;
  current_stock: number;
  last_updated: string;
}

export type ShiftStatus = 'ACTIVE' | 'CLOSED';
export type ReconciliationStatus = 'PAS' | 'LEBIH' | 'KURANG';

export interface Shift {
  shift_id: string;
  opened_by_user_id: string;
  shift_leader_user_id: string;
  closed_by_user_id?: string;
  start_time: string;
  end_time?: string;
  total_initial_cash: number;
  net_cash_sales: number;
  total_qris_sales: number;
  total_transfer_sales: number;
  total_cash_expenses: number;
  theoretical_cash: number;
  actual_physical_cash?: number;
  cash_variance?: number;
  reconciliation_status?: ReconciliationStatus;
  shift_status: ShiftStatus;
  duty_staff_names?: string;
  shift_category?: string;
  shift_metadata?: Record<string, any>;
}

export interface ShiftUser {
  shift_user_id: string;
  shift_id: string;
  user_id: string;
  is_shift_leader: boolean;
  joined_at: string;
}

export type CapitalStatus = 'HELD' | 'RETURNED';

export interface ShiftCapitalContribution {
  contribution_id: string;
  shift_id: string;
  user_id: string;
  amount: number;
  contribution_time: string;
  returned_amount?: number;
  returned_at?: string;
  status: CapitalStatus;
}

// Metode pembayaran yang didukung sistem
export type PaymentMethod = 'CASH' | 'QRIS' | 'TRANSFER';
export type TransactionStatus = 'COMPLETED' | 'CANCELLED';

export interface TransactionItem {
  transaction_item_id: string;
  transaction_id: string;
  product_id: string;
  unit_price: number;
  qty: number;
  subtotal: number;
  discount_amount: number;
}

export interface Transaction {
  transaction_id: string;
  transaction_number: string;
  shift_id: string;
  created_by_user_id: string;
  created_by_user_name?: string;
  subtotal_amount: number;
  discount_amount: number;
  final_total: number;
  payment_method: PaymentMethod;
  transaction_time: string;
  status: TransactionStatus;
}

export interface Expense {
  expense_id: string;
  shift_id: string;
  recorded_by_user_id: string;
  category: string;
  description: string;
  amount: number;
  expense_time: string;
}

export interface AuditLog {
  audit_id: string;
  user_id: string;
  action_type: string;
  entity_name: string;
  entity_id?: string;
  details?: string;
  timestamp: string;
}
