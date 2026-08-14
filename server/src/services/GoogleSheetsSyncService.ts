import { GoogleSheetsClient } from '../config/googleSheets';

export class GoogleSheetsSyncService {
  private client: GoogleSheetsClient;

  constructor() {
    this.client = GoogleSheetsClient.getInstance();
  }

  public getStatus(): { is_connected: boolean; spreadsheet_id: string } {
    return {
      is_connected: this.client.isReady(),
      spreadsheet_id: this.client.getSpreadsheetId() || 'Belum dikonfigurasi di .env',
    };
  }

  /**
   * Menulis/menimpa data snapshot lengkap ke Google Spreadsheet
   */
  public async syncSnapshotToSheets(snapshotData: any): Promise<{ success: boolean; synced_tabs: string[] }> {
    if (!this.client.isReady()) {
      throw new Error('Google Sheets API belum dikonfigurasi di .env (GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY)');
    }

    const sheets = this.client.getApi();
    const spreadsheetId = this.client.getSpreadsheetId();
    const syncedTabs: string[] = [];

    // Mapping tab & data formatter
    const tabsMapping: { tab: string; headers: string[]; rows: any[][] }[] = [
      {
        tab: 'Users',
        headers: ['User ID', 'Username', 'Role'],
        rows: (snapshotData.users || []).map((u: any) => [u.user_id, u.username, u.role]),
      },
      {
        tab: 'Categories',
        headers: ['Category ID', 'Category Name', 'Business Unit'],
        rows: (snapshotData.categories || []).map((c: any) => [c.category_id, c.category_name, c.business_unit]),
      },
      {
        tab: 'Products',
        headers: ['Product ID', 'Category ID', 'Product Name', 'Business Unit', 'Selling Price', 'Manage Stock', 'Is Active'],
        rows: (snapshotData.products || []).map((p: any) => [
          p.product_id,
          p.category_id,
          p.product_name,
          p.business_unit,
          p.selling_price,
          p.manage_stock ? 'YA' : 'TIDAK',
          p.is_active ? 'AKTIF' : 'NON-AKTIF',
        ]),
      },
      {
        tab: 'Shifts',
        headers: ['Shift ID', 'Shift Leader ID', 'Start Time', 'End Time', 'Initial Cash', 'Status', 'Net Cash Sales', 'Total Cash Expenses', 'Expected Cash Drawer'],
        rows: (snapshotData.shifts || []).map((s: any) => [
          s.shift_id,
          s.shift_leader_user_id,
          s.start_time,
          s.end_time || '-',
          s.initial_cash,
          s.status,
          s.net_cash_sales || 0,
          s.total_cash_expenses || 0,
          s.expected_cash_drawer || s.initial_cash,
        ]),
      },
      {
        tab: 'Transactions',
        headers: ['Transaction ID', 'Receipt Number', 'User ID', 'Shift ID', 'Total Amount', 'Payment Method', 'Cash Amount', 'Change Amount', 'Status', 'Transaction Time'],
        rows: (snapshotData.transactions || []).map((t: any) => [
          t.transaction_id,
          t.receipt_number,
          t.user_id,
          t.shift_id,
          t.total_amount,
          t.payment_method,
          t.cash_amount || 0,
          t.change_amount || 0,
          t.status,
          t.transaction_time,
        ]),
      },
      {
        tab: 'Expenses',
        headers: ['Expense ID', 'Shift ID', 'Recorded By User ID', 'Category', 'Description', 'Amount', 'Expense Time'],
        rows: (snapshotData.expenses || []).map((e: any) => [
          e.expense_id,
          e.shift_id,
          e.recorded_by_user_id,
          e.category,
          e.description,
          e.amount,
          e.expense_time,
        ]),
      },
      {
        tab: 'Stocks',
        headers: ['Stock ID', 'Product ID', 'Current Stock', 'Last Updated'],
        rows: (snapshotData.stocks || []).map((st: any) => [
          st.stock_id,
          st.product_id,
          st.current_stock,
          st.last_updated,
        ]),
      },
      {
        tab: 'AuditLogs',
        headers: ['Audit ID', 'User ID', 'Username', 'Action', 'Affected Entity', 'Entity ID', 'Details', 'Timestamp'],
        rows: (snapshotData.audit_logs || []).map((a: any) => [
          a.audit_id,
          a.user_id,
          a.username,
          a.action,
          a.affected_entity,
          a.entity_id,
          a.details,
          a.timestamp,
        ]),
      },
    ];

    for (const item of tabsMapping) {
      try {
        const values = [item.headers, ...item.rows];
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${item.tab}!A1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values },
        });
        syncedTabs.push(item.tab);
      } catch (err: any) {
        console.warn(`[GoogleSheetsSyncService] Skip tab '${item.tab}':`, err.message);
      }
    }

    return { success: true, synced_tabs: syncedTabs };
  }
}
