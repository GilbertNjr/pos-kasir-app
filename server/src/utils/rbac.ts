import { UserRole } from '../types/domain';

/**
 * Matriks Notasi Permission Eksplisit (RBAC.md v0.4.0)
 * C = Create | R = Read | U = Update | D = Delete | A = Approve/Override | X = Denied
 */
export type PermissionAction =
  | 'MANAGE_USERS'          // Owner Only
  | 'MANAGE_PRODUCTS'       // Owner Only (CRUD Master)
  | 'READ_PRODUCTS'         // Owner & Karyawan
  | 'OPEN_SHIFT'            // PJ Shift / Owner
  | 'CLOSE_SHIFT'           // PJ Shift / Owner
  | 'TRANSACT'              // Owner & Karyawan
  | 'RECORD_EXPENSE'        // Owner & Karyawan
  | 'MANAGE_STOCK_MANUAL'   // Owner Only
  | 'READ_STOCK_LOGS'       // Owner & Karyawan
  | 'READ_AUDIT_LOGS'       // Owner Only
  | 'VIEW_OWNER_DASHBOARD'  // Owner Only
  | 'VIEW_FINANCIAL_REPORTS'// Owner Only
  | 'BACKUP_RESTORE';       // Owner Only

export const hasPermission = (role: UserRole, action: PermissionAction): boolean => {
  if (role === 'OWNER') {
    return true; // Owner memiliki akses penuh terhadap seluruh fitur
  }

  // Aturan Akses Role KARYAWAN
  switch (action) {
    case 'READ_PRODUCTS':
    case 'OPEN_SHIFT':
    case 'CLOSE_SHIFT':
    case 'TRANSACT':
    case 'RECORD_EXPENSE':
    case 'READ_STOCK_LOGS':
      return true;

    case 'MANAGE_USERS':
    case 'MANAGE_PRODUCTS':
    case 'MANAGE_STOCK_MANUAL':
    case 'READ_AUDIT_LOGS':
    case 'VIEW_OWNER_DASHBOARD':
    case 'VIEW_FINANCIAL_REPORTS':
    case 'BACKUP_RESTORE':
    default:
      return false;
  }
};
