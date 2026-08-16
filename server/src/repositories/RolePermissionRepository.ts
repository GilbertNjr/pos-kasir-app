import { UserRole } from '../types/domain';
import { pool } from '../database/db';

export class RolePermissionRepository {
  async getPermissionsForRole(role: UserRole): Promise<string[]> {
    try {
      const query = `
        SELECT p.permission_code
        FROM permissions p
        JOIN role_permissions rp ON p.permission_id = rp.permission_id
        JOIN roles r ON rp.role_id = r.role_id
        WHERE UPPER(r.role_name::text) = UPPER($1)
      `;
      const res = await pool.query(query, [role]);
      if (res.rows && res.rows.length > 0) {
        return res.rows.map((r) => r.permission_code);
      }
    } catch {
      // Fallback default dynamic permissions if DB isn't reached yet
    }

    if (role === 'OWNER') {
      return [
        'dashboard.owner.view', 'dashboard.pj.view', 'dashboard.cashier.view',
        'employee.manage_all', 'employee.view_assigned', 'product.create_update',
        'product.view', 'stock.adjust_manual', 'stock.view_logs', 'transaction.create',
        'transaction.cancel', 'expense.create', 'report.financial_all', 'report.operational',
        'audit.view_logs', 'backup.manage'
      ];
    }

    if (role === 'PENANGGUNG_JAWAB') {
      return [
        'dashboard.pj.view', 'dashboard.cashier.view', 'employee.view_assigned',
        'product.view', 'stock.view_logs', 'transaction.create', 'transaction.cancel',
        'expense.create', 'report.operational'
      ];
    }

    // Default CASHIER / KARYAWAN
    return [
      'dashboard.cashier.view', 'product.view', 'stock.view_logs',
      'transaction.create', 'expense.create'
    ];
  }
}
