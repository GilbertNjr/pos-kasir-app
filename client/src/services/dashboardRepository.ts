import { apiService } from './api';

export interface DashboardFilterParams {
  period_type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';
  start_date?: string;
  end_date?: string;
}

export interface DashboardMetricsData {
  period_type: string;
  start_date: string;
  end_date: string;
  kpi: {
    total_omzet: number;
    total_expenses: number;
    total_transactions_count: number;
    total_items_sold: number;
    average_order_value: number;
  };
  unit_distribution: {
    FC_PRINT: number;
    FNB: number;
  };
  category_distribution: Array<{
    category_name: string;
    business_unit: 'FC_PRINT' | 'FNB';
    omzet: number;
  }>;
  revenue_chart: Array<{
    label: string;
    omzet: number;
    transaction_count: number;
  }>;
  top_selling_products: Array<{
    rank: number;
    product_id: string;
    product_name: string;
    business_unit: 'FC_PRINT' | 'FNB';
    unit: string;
    qty_sold: number;
    total_revenue: number;
  }>;
  slow_moving_products: Array<{
    product_id: string;
    product_name: string;
    business_unit: 'FC_PRINT' | 'FNB';
    unit: string;
    qty_sold: number;
  }>;
  employee_performance: Array<{
    user_id: string;
    username: string;
    full_name: string;
    role: string;
    transaction_count: number;
    total_sales: number;
    is_active_in_shift: boolean;
  }>;
  recent_transactions: Array<{
    transaction_id: string;
    transaction_number: string;
    created_by_username: string;
    payment_method: string;
    final_total: number;
    status: string;
    transaction_time: string;
  }>;
  business_insights: Array<{
    type: 'POSITIVE' | 'WARNING' | 'NEUTRAL';
    title: string;
    message: string;
  }>;
  alerts: {
    unresolved_shift_variances: number;
    low_stock_products_count: number;
  };
  last_updated: string;
}

/**
 * Dashboard Repository Adapter to separate UI components from raw API calls.
 */
class DashboardRepository {
  public async getDashboardSummary(filter: DashboardFilterParams): Promise<DashboardMetricsData> {
    return await apiService.getDashboardMetrics(filter);
  }
}

export const dashboardRepository = new DashboardRepository();
