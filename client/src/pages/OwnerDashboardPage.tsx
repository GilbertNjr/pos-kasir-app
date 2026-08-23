import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Package,
  Layers,
  Users,
  RefreshCw,
  Clock,
  AlertCircle,
  Lightbulb,
  ArrowUpRight,
  FileText,
  Settings,
  Headphones,
  Sparkles,
  CheckCircle2,
  Inbox,
  PackageX,
} from 'lucide-react';
import { formatRupiah, formatWaktuIndo } from '../utils/formatters';
import { PeriodFilterBar } from '../components/dashboard/PeriodFilterBar';
import { RevenuePerformanceChart } from '../components/dashboard/RevenuePerformanceChart';
import { EmployeePerformanceModal, EmployeeSummary } from '../components/dashboard/EmployeePerformanceModal';
import { CategoryDonutChartCard } from '../components/dashboard/CategoryDonutChartCard';
import { PeriodSummaryCard } from '../components/dashboard/PeriodSummaryCard';
import { DashboardSkeleton } from '../components/dashboard/DashboardSkeleton';
import { DashboardErrorState } from '../components/dashboard/DashboardErrorState';
import { useDashboard } from '../hooks/useDashboard';
import { getCashierColor } from '../components/common/CashierBadge';
import { APP_VERSION } from '../config/version';

interface OwnerDashboardPageProps {
  onTriggerToast?: (type: 'success' | 'danger' | 'info' | 'warning', title: string, message: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const OwnerDashboardPage: React.FC<OwnerDashboardPageProps> = ({ onTriggerToast, onNavigateTab }) => {
  const { filter, setFilter, data: metrics, loading, error, isSseConnected, lastUpdated, refresh } = useDashboard({
    period_type: 'DAILY',
  });

  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSummary | null>(null);

  if (loading && !metrics) {
    return <DashboardSkeleton />;
  }

  if (error && !metrics) {
    return <DashboardErrorState message={error} onRetry={refresh} />;
  }

  const kpi = metrics?.kpi || {
    total_omzet: 0,
    total_expenses: 0,
    total_transactions_count: 0,
    total_items_sold: 0,
    average_order_value: 0,
  };

  const activeCashiersCount = metrics?.employee_performance?.filter((emp: EmployeeSummary) => emp.is_active_in_shift)?.length || 0;
  const totalCashiersCount = metrics?.employee_performance?.length || 0;

  // Maximum items sold for relative progress bar calculation
  const maxTopQty = Math.max(...(metrics?.top_selling_products?.map((p: any) => p.qty_sold) || [1]), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', paddingBottom: '3.5rem' }}>
      {/* 1. UNIFIED RESPONSIVE CONTROL TOOLBAR CARD FOR OWNER DASHBOARD */}
      <div className="owner-control-bar">
        {/* Left Side: Realtime Active Badge & Last Updated Timestamp */}
        <div className="owner-status-group">
          {/* Realtime Pulse Indicator */}
          <div
            className="owner-status-badge"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.35rem 0.85rem',
              borderRadius: '20px',
              background: isSseConnected ? '#ecfdf5' : '#fef2f2',
              border: `1px solid ${isSseConnected ? '#a7f3d0' : '#fecaca'}`,
              fontSize: '0.78rem',
              fontWeight: 800,
              color: isSseConnected ? '#047857' : '#dc2626',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isSseConnected ? '#10b981' : '#ef4444',
                boxShadow: isSseConnected ? '0 0 10px #10b981' : 'none',
                flexShrink: 0,
              }}
            />
            <span>{isSseConnected ? 'REALTIME AKTIF' : 'TERPUTUS'}</span>
          </div>

          {/* Last Updated Time */}
          <div
            className="owner-status-badge"
            style={{
              fontSize: '0.78rem',
              color: '#475569',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#f8fafc',
              padding: '0.35rem 0.85rem',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              whiteSpace: 'nowrap',
            }}
          >
            <Clock size={15} color="#64748b" style={{ flexShrink: 0 }} />
            <span>Pembaruan: <strong style={{ color: '#0f172a' }}>{lastUpdated ? formatWaktuIndo(lastUpdated) : '-'}</strong></span>
          </div>

          {/* App Version Badge */}
          <div
            className="owner-status-badge header-hide-mobile"
            style={{
              fontSize: '0.78rem',
              color: '#1e40af',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#eff6ff',
              padding: '0.35rem 0.85rem',
              borderRadius: '12px',
              border: '1px solid #bfdbfe',
              whiteSpace: 'nowrap',
            }}
          >
            <Sparkles size={14} color="#2563eb" style={{ flexShrink: 0 }} />
            <span>v{APP_VERSION}</span>
          </div>
        </div>

        {/* Right Side: Refresh Data Button */}
        <button
          onClick={() => {
            refresh();
            if (onTriggerToast) onTriggerToast('success', 'Sinkronisasi Berhasil', 'Data analitik owner telah diperbarui.');
          }}
          disabled={loading}
          className="owner-refresh-btn"
          style={{
            padding: '0.55rem 1.15rem',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.825rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            whiteSpace: 'nowrap',
            boxShadow: '0 3px 10px rgba(15, 23, 42, 0.25)',
            transition: 'all 0.15s ease',
          }}
        >
          <RefreshCw size={15} className={loading ? 'spinning' : ''} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* 2. QUICK ACTION SHORTCUT CARDS */}
      <div className="responsive-shortcut-grid">
        <div
          onClick={() => onNavigateTab && onNavigateTab('STOCKS')}
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            padding: '1.35rem',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(37,99,235,0.12)' }}>
              <Package size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.975rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Kelola Stok Barang</h3>
              <p style={{ fontSize: '0.76rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>Restock & Penyesuaian</p>
            </div>
          </div>
          <ArrowUpRight size={19} color="#94a3b8" />
        </div>

        <div
          onClick={() => onNavigateTab && onNavigateTab('TRANSAKSI')}
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            padding: '1.35rem',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(5,150,105,0.12)' }}>
              <ShoppingBag size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.975rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Register POS</h3>
              <p style={{ fontSize: '0.76rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>Checkout & Transaksi</p>
            </div>
          </div>
          <ArrowUpRight size={19} color="#94a3b8" />
        </div>

        <div
          onClick={() => onNavigateTab && onNavigateTab('REPORTS')}
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            padding: '1.35rem',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(217,119,6,0.12)' }}>
              <FileText size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.975rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Laporan PDF</h3>
              <p style={{ fontSize: '0.76rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>Ekspor Omzet Penjualan</p>
            </div>
          </div>
          <ArrowUpRight size={19} color="#94a3b8" />
        </div>

        <div
          onClick={() => onNavigateTab && onNavigateTab('BACKUP')}
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            padding: '1.35rem',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(124,58,237,0.12)' }}>
              <Settings size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.975rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Sync & Backup</h3>
              <p style={{ fontSize: '0.76rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>Google Sheets Cloud</p>
            </div>
          </div>
          <ArrowUpRight size={19} color="#94a3b8" />
        </div>
      </div>

      {/* 3. UNIFIED PERIOD FILTER BAR */}
      <PeriodFilterBar currentFilter={filter} onFilterChange={setFilter} />

      {/* 4. EXECUTIVE FINANCIAL KPI METRICS (5 CARDS) */}
      <div className="kpi-metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem' }}>
        {/* KPI 1: Total Omzet */}
        <div className="kpi-metric-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '22px', padding: '1.5rem', boxShadow: '0 10px 25px -5px rgba(37,99,235,0.06)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)' }} />
          <div className="kpi-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <span className="kpi-card-title" style={{ fontSize: '0.76rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>TOTAL OMZET</span>
            <div className="kpi-card-icon-box" style={{ width: '42px', height: '42px', borderRadius: '14px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(37,99,235,0.12)', flexShrink: 0 }}>
              <TrendingUp size={21} />
            </div>
          </div>
          <div className="kpi-card-value" style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1d4ed8', letterSpacing: '-0.03em' }}>
            {formatRupiah(kpi.total_omzet)}
          </div>
          <div className="kpi-card-badge" style={{ fontSize: '0.78rem', color: kpi.total_omzet > 0 ? '#047857' : '#64748b', marginTop: '0.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.35rem', background: kpi.total_omzet > 0 ? '#ecfdf5' : '#f8fafc', padding: '0.2rem 0.55rem', borderRadius: '12px', width: 'fit-content', border: `1px solid ${kpi.total_omzet > 0 ? '#a7f3d0' : '#e2e8f0'}` }}>
            <span>{kpi.total_omzet > 0 ? '▲ Omzet Terisi Periode Ini' : '● Rp 0 (Belum ada omzet)'}</span>
          </div>
        </div>

        {/* KPI 2: Total Pengeluaran Kas */}
        <div className="kpi-metric-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '22px', padding: '1.5rem', boxShadow: '0 10px 25px -5px rgba(239,68,68,0.06)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #f87171, #ef4444)' }} />
          <div className="kpi-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <span className="kpi-card-title" style={{ fontSize: '0.76rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>PENGELUARAN KAS</span>
            <div className="kpi-card-icon-box" style={{ width: '42px', height: '42px', borderRadius: '14px', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(239,68,68,0.12)', flexShrink: 0 }}>
              <DollarSign size={21} />
            </div>
          </div>
          <div className="kpi-card-value" style={{ fontSize: '1.75rem', fontWeight: 900, color: '#ef4444', letterSpacing: '-0.03em' }}>
            {formatRupiah(kpi.total_expenses)}
          </div>
          <div className="kpi-card-badge" style={{ fontSize: '0.78rem', color: kpi.total_expenses > 0 ? '#dc2626' : '#64748b', marginTop: '0.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.35rem', background: kpi.total_expenses > 0 ? '#fef2f2' : '#f8fafc', padding: '0.2rem 0.55rem', borderRadius: '12px', width: 'fit-content', border: `1px solid ${kpi.total_expenses > 0 ? '#fecaca' : '#e2e8f0'}` }}>
            <span>{kpi.total_expenses > 0 ? '▼ Pengeluaran Kas Dicatat' : '● Rp 0 (Nol pengeluaran)'}</span>
          </div>
        </div>

        {/* KPI 3: Total Transaksi Nota */}
        <div className="kpi-metric-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '22px', padding: '1.5rem', boxShadow: '0 10px 25px -5px rgba(16,185,129,0.06)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #34d399, #10b981)' }} />
          <div className="kpi-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <span className="kpi-card-title" style={{ fontSize: '0.76rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>TOTAL TRANSAKSI</span>
            <div className="kpi-card-icon-box" style={{ width: '42px', height: '42px', borderRadius: '14px', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(16,185,129,0.12)', flexShrink: 0 }}>
              <ShoppingBag size={21} />
            </div>
          </div>
          <div className="kpi-card-value" style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>
            {kpi.total_transactions_count} <span style={{ fontSize: '1.05rem', color: '#94a3b8', fontWeight: 700 }}>Nota</span>
          </div>
          <div className="kpi-card-badge" style={{ fontSize: '0.78rem', color: kpi.total_transactions_count > 0 ? '#047857' : '#64748b', marginTop: '0.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.35rem', background: kpi.total_transactions_count > 0 ? '#ecfdf5' : '#f8fafc', padding: '0.2rem 0.55rem', borderRadius: '12px', width: 'fit-content', border: `1px solid ${kpi.total_transactions_count > 0 ? '#a7f3d0' : '#e2e8f0'}` }}>
            <span>{kpi.total_transactions_count > 0 ? `▲ ${kpi.total_transactions_count} Nota terbit` : '● 0 Nota (Belum ada transaksi)'}</span>
          </div>
        </div>

        {/* KPI 4: Total Qty Unit Terjual */}
        <div className="kpi-metric-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '22px', padding: '1.5rem', boxShadow: '0 10px 25px -5px rgba(245,158,11,0.06)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #fbbf24, #f59e0b)' }} />
          <div className="kpi-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <span className="kpi-card-title" style={{ fontSize: '0.76rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>ITEM TERJUAL</span>
            <div className="kpi-card-icon-box" style={{ width: '42px', height: '42px', borderRadius: '14px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(245,158,11,0.12)', flexShrink: 0 }}>
              <Package size={21} />
            </div>
          </div>
          <div className="kpi-card-value" style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>
            {kpi.total_items_sold} <span style={{ fontSize: '1.05rem', color: '#94a3b8', fontWeight: 700 }}>Unit</span>
          </div>
          <div className="kpi-card-badge" style={{ fontSize: '0.78rem', color: kpi.total_items_sold > 0 ? '#b45309' : '#64748b', marginTop: '0.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.35rem', background: kpi.total_items_sold > 0 ? '#fffbeb' : '#f8fafc', padding: '0.2rem 0.55rem', borderRadius: '12px', width: 'fit-content', border: `1px solid ${kpi.total_items_sold > 0 ? '#fde68a' : '#e2e8f0'}` }}>
            <span>{kpi.total_items_sold > 0 ? `▲ ${kpi.total_items_sold} Unit terjual` : '● 0 Unit (Nol item terjual)'}</span>
          </div>
        </div>

        {/* KPI 5: Kasir Aktif */}
        <div className="kpi-metric-card kpi-card-full-mobile" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '22px', padding: '1.5rem', boxShadow: '0 10px 25px -5px rgba(244,63,94,0.08)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #fb7185, #e11d48)' }} />
          <div className="kpi-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <span className="kpi-card-title" style={{ fontSize: '0.76rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>KASIR AKTIF</span>
            <div className="kpi-card-icon-box" style={{ width: '42px', height: '42px', borderRadius: '14px', background: '#ffe4e6', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(225,29,72,0.12)', flexShrink: 0 }}>
              <Headphones size={21} />
            </div>
          </div>
          <div className="kpi-card-value" style={{ fontSize: '1.85rem', fontWeight: 900, color: '#e11d48', letterSpacing: '-0.03em' }}>
            {activeCashiersCount} <span style={{ fontSize: '1.1rem', color: '#94a3b8', fontWeight: 700 }}>/ {totalCashiersCount || (activeCashiersCount > 0 ? activeCashiersCount : 0)}</span>
          </div>
          <div className="kpi-card-badge" style={{ fontSize: '0.78rem', color: activeCashiersCount > 0 ? '#be123c' : '#64748b', marginTop: '0.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.35rem', background: activeCashiersCount > 0 ? '#ffe4e6' : '#f8fafc', padding: '0.2rem 0.55rem', borderRadius: '12px', width: 'fit-content', border: `1px solid ${activeCashiersCount > 0 ? '#fecdd3' : '#e2e8f0'}` }}>
            <span>{activeCashiersCount > 0 ? `● ${activeCashiersCount} Kasir Logged In / Aktif` : '○ 0 Kasir Logged In'}</span>
          </div>
        </div>
      </div>

      {/* 5. OPERATIONAL ALERTS NOTICE */}
      {metrics?.alerts && (metrics.alerts.unresolved_shift_variances > 0 || metrics.alerts.low_stock_products_count > 0) && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '20px', padding: '1.25rem 1.5rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '1.15rem', boxShadow: '0 4px 14px rgba(245,158,11,0.08)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertCircle size={24} color="#d97706" />
          </div>
          <div style={{ fontSize: '0.88rem', lineHeight: 1.45 }}>
            <strong style={{ color: '#b45309', fontWeight: 900 }}>PERHATIAN OPERASIONAL TOKO:</strong>{' '}
            {metrics.alerts.unresolved_shift_variances > 0 && (
              <span>Terdeteksi <strong>{metrics.alerts.unresolved_shift_variances} sesi shift</strong> dengan selisih kas yang belum terselesaikan. Harap periksa di menu laporan shift kasir. </span>
            )}
            {metrics.alerts.low_stock_products_count > 0 && (
              <span>Terdeteksi <strong>{metrics.alerts.low_stock_products_count} produk</strong> dengan stok menipis.</span>
            )}
          </div>
        </div>
      )}

      {/* 6. REVENUE PERFORMANCE CHART */}
      <div style={{ minHeight: '350px' }}>
        <RevenuePerformanceChart data={metrics?.revenue_chart || []} periodType={filter.period_type} />
      </div>

      {/* 7. DIAGRAM KATEGORI PRODUK TERLARIS & RINGKASAN PERIODE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.6rem' }}>
        {/* Card 1: Kategori Produk Terlaris (Donut Chart SVG & Legend) */}
        <CategoryDonutChartCard categories={metrics?.category_distribution} />

        {/* Card 2: Ringkasan Periode Ini (Metrik Persentase Panah Hijau/Merah) */}
        <PeriodSummaryCard
          kpi={kpi}
          activeCashiersCount={activeCashiersCount}
          totalCashiersCount={totalCashiersCount}
          periodType={filter.period_type}
          onNavigateTab={onNavigateTab}
        />
      </div>

      {/* 8. TOP PRODUCTS & LOW SELLING PRODUCTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.6rem' }}>
        {/* Top Selling Products Card */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '1.6rem', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a', margin: 0 }}>
              <Layers size={20} color="#047857" />
              Produk Terlaris (Top 5 Qty)
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, background: '#f1f5f9', padding: '0.25rem 0.65rem', borderRadius: '10px' }}>
              Volume Penjualan
            </span>
          </div>

          {(() => {
            const activeTopProducts = (metrics?.top_selling_products || []).filter((p: any) => (p.qty_sold || 0) > 0);
            if (activeTopProducts.length === 0) {
              return (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                  <Inbox size={32} color="#cbd5e1" style={{ marginBottom: '0.5rem' }} />
                  <div style={{ fontWeight: 800, color: '#64748b', fontSize: '0.9rem' }}>Belum Ada Produk Terjual</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Data produk terlaris akan muncul secara otomatis saat terjadi transaksi.</div>
                </div>
              );
            }
            return (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <th style={{ padding: '0.75rem 0.25rem' }}>#</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Produk / Jasa</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Qty</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Omzet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeTopProducts.map((p: any, idx: number) => {
                      const rank = idx + 1;
                      const pct = Math.round((p.qty_sold / (maxTopQty || 1)) * 100);
                      const isGold = rank === 1;
                      const isSilver = rank === 2;
                      const isBronze = rank === 3;

                      return (
                        <tr key={p.product_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.85rem 0.25rem' }}>
                            <span
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 900,
                                background: isGold ? '#fef3c7' : isSilver ? '#f1f5f9' : isBronze ? '#fff7ed' : '#f8fafc',
                                color: isGold ? '#b45309' : isSilver ? '#475569' : isBronze ? '#c2410c' : '#64748b',
                                border: `1px solid ${isGold ? '#fde68a' : isSilver ? '#cbd5e1' : isBronze ? '#ffedd5' : '#e2e8f0'}`,
                              }}
                            >
                              {rank}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 0.5rem' }}>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{p.product_name}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                              <span style={{
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                padding: '0.15rem 0.5rem',
                                borderRadius: '6px',
                                background: p.business_unit === 'FC_PRINT' ? '#eff6ff' : '#ecfdf5',
                                color: p.business_unit === 'FC_PRINT' ? '#1d4ed8' : '#047857',
                              }}>
                                {p.business_unit}
                              </span>
                              <div style={{ width: '80px', height: '5px', borderRadius: '3px', background: '#e2e8f0', overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: isGold ? '#f59e0b' : '#2563eb', borderRadius: '3px' }} />
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '0.85rem 0.5rem', textAlign: 'center', fontWeight: 900, color: '#0f172a' }}>
                            {p.qty_sold} {p.unit || 'pcs'}
                          </td>
                          <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right', fontWeight: 900, color: '#047857' }}>
                            {formatRupiah(p.total_revenue)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>

        {/* Low Selling Products Card (Slow Moving) */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '1.6rem', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a', margin: 0 }}>
              <AlertCircle size={20} color="#ef4444" />
              Produk Penjualan Rendah (Slow Moving)
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: 700, background: '#fef2f2', padding: '0.25rem 0.65rem', borderRadius: '10px' }}>
              Perhatian Stok
            </span>
          </div>

          {(() => {
            const hasTotalSales = (kpi?.total_items_sold || 0) > 0;
            const slowMovingList = metrics?.slow_moving_products || [];
            if (!hasTotalSales || slowMovingList.length === 0) {
              return (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                  <PackageX size={32} color="#cbd5e1" style={{ marginBottom: '0.5rem' }} />
                  <div style={{ fontWeight: 800, color: '#64748b', fontSize: '0.9rem' }}>Belum Ada Perputaran Stok</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Lakukan transaksi penjualan terlebih dahulu untuk menganalisis produk slow moving.</div>
                </div>
              );
            }
            return (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Produk / Jasa</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Qty Terjual</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Status Perputaran</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slowMovingList.map((p: any) => (
                      <tr key={p.product_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.85rem 0.5rem' }}>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>{p.product_name}</div>
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '6px',
                            background: p.business_unit === 'FC_PRINT' ? '#eff6ff' : '#ecfdf5',
                            color: p.business_unit === 'FC_PRINT' ? '#1d4ed8' : '#047857',
                          }}>
                            {p.business_unit}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 0.5rem', textAlign: 'center', fontWeight: 900, color: '#ef4444' }}>
                          {p.qty_sold} {p.unit || 'pcs'}
                        </td>
                        <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right', fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>
                          {p.qty_sold === 0 ? (
                            <span style={{ color: '#dc2626', background: '#fef2f2', padding: '0.2rem 0.55rem', borderRadius: '8px', border: '1px solid #fecaca' }}>
                              ⚠️ Nol Penjualan
                            </span>
                          ) : (
                            <span style={{ color: '#d97706', background: '#fffbeb', padding: '0.2rem 0.55rem', borderRadius: '8px', border: '1px solid #fde68a' }}>
                              🐢 Slow Moving
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      </div>

      {/* 9. KASIR & PEGAWAI PERFORMANCE PERMANENT SECTION */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '1.75rem', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.03)' }}>
        {(() => {
          const employeeList = (metrics?.employee_performance || []).filter((emp: EmployeeSummary) => emp.role !== 'OWNER');
          return (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.35rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a', margin: 0 }}>
                    <Users size={22} color="#4f46e5" />
                    Performa & Aktivitas Kasir / Pegawai
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
                    Klik kartu kasir di bawah ini untuk melihat rincian detail nota & pengeluaran kas per karyawan
                  </p>
                </div>
                <span style={{ fontSize: '0.78rem', color: '#4f46e5', fontWeight: 800, background: '#eef2ff', padding: '0.3rem 0.75rem', borderRadius: '12px', border: '1px solid #c7d2fe' }}>
                  {employeeList.length} Karyawan Terdaftar
                </span>
              </div>

              {employeeList.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                  <Users size={32} color="#cbd5e1" style={{ marginBottom: '0.5rem' }} />
                  <div style={{ fontWeight: 800, color: '#64748b', fontSize: '0.9rem' }}>Belum Ada Karyawan Terdaftar</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Tambahkan akun karyawan di menu Manajemen Pengguna.</div>
                </div>
              ) : (
                <div className="employee-performance-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.15rem' }}>
                  {employeeList.map((emp: EmployeeSummary) => {
                    const cashierColor = getCashierColor(emp.full_name || emp.username);
                    return (
                      <div
                        key={emp.user_id}
                        onClick={() => setSelectedEmployee(emp)}
                        className="employee-card-item"
                        style={{
                          padding: '1.15rem',
                          border: `1px solid ${cashierColor.border}`,
                          borderRadius: '20px',
                          background: cashierColor.bg,
                          cursor: 'pointer',
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: `0 6px 18px ${cashierColor.bg}`,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div className="emp-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: 1 }}>
                            <div
                              className="emp-card-avatar"
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                background: cashierColor.avatarBg,
                                color: cashierColor.avatarText,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 900,
                                fontSize: '1rem',
                                boxShadow: `0 3px 8px ${cashierColor.border}`,
                                flexShrink: 0,
                                overflow: 'hidden',
                              }}
                            >
                              {emp.avatar_url ? (
                                <img src={emp.avatar_url} alt={emp.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                emp.full_name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <h4
                                className="emp-card-name"
                                style={{
                                  fontSize: '0.9rem',
                                  fontWeight: 900,
                                  margin: 0,
                                  color: cashierColor.text,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {emp.full_name}
                              </h4>
                              <span
                                className="emp-card-role"
                                style={{
                                  fontSize: '0.72rem',
                                  color: '#64748b',
                                  fontWeight: 700,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: 'block',
                                }}
                              >
                                Role: {emp.is_pj || emp.role === 'PENANGGUNG_JAWAB' ? 'PJ' : emp.role === 'OWNER' ? 'Owner' : 'Kasir Operasional'}
                              </span>
                            </div>
                          </div>

                          {emp.is_active_in_shift && (
                            <span
                              className="emp-card-shift-badge"
                              style={{
                                padding: '0.2rem 0.55rem',
                                borderRadius: '10px',
                                background: '#ecfdf5',
                                color: '#047857',
                                border: '1px solid #a7f3d0',
                                fontSize: '0.68rem',
                                fontWeight: 900,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                flexShrink: 0,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                              Shift Aktif
                            </span>
                          )}
                        </div>

                        <div
                          className="emp-card-footer"
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.8rem',
                            marginTop: '0.75rem',
                            borderTop: `1px dashed ${cashierColor.border}`,
                            paddingTop: '0.65rem',
                            gap: '0.4rem',
                          }}
                        >
                          <span style={{ color: '#64748b', fontWeight: 700, whiteSpace: 'nowrap' }}>{emp.transaction_count} Nota</span>
                          <span style={{ fontWeight: 900, color: cashierColor.text, whiteSpace: 'nowrap' }}>{formatRupiah(emp.total_sales)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* 10. REKOMENDASI INSIGHTS BISNIS OTOMATIS (REALTIME DYNAMIC STOK & OPERASIONAL) */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '1.75rem', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Lightbulb size={22} color="#d97706" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
              Rekomendasi Insights Bisnis Otomatis
            </h3>
            <p style={{ fontSize: '0.825rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>
              Analisis cerdas pola penjualan & peluang peningkatan margin omzet toko
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {metrics?.business_insights?.map((item: any, idx: number) => {
            const isPositive = item.type === 'POSITIVE';
            const isWarning = item.type === 'WARNING';
            const isTip = item.type === 'TIP';

            const borderLeftColor = isPositive ? '#10b981' : isWarning ? '#f59e0b' : isTip ? '#8b5cf6' : '#3b82f6';
            const itemBgColor = isPositive ? '#f0fdf4' : isWarning ? '#fffbeb' : isTip ? '#f5f3ff' : '#f0f6ff';

            return (
              <div
                key={idx}
                style={{
                  padding: '1.25rem 1.5rem',
                  borderRadius: '18px',
                  background: itemBgColor,
                  borderLeft: `4px solid ${borderLeftColor}`,
                  borderTop: '1px solid rgba(0,0,0,0.02)',
                  borderRight: '1px solid rgba(0,0,0,0.02)',
                  borderBottom: '1px solid rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                }}
              >
                <div style={{ fontWeight: 900, fontSize: '0.975rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {isPositive && <CheckCircle2 size={18} color="#10b981" />}
                  {isWarning && <AlertCircle size={18} color="#f59e0b" />}
                  {isTip && <Sparkles size={18} color="#8b5cf6" />}
                  {!isPositive && !isWarning && !isTip && <Lightbulb size={18} color="#3b82f6" />}
                  {item.title}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.55 }}>{item.message}</div>

                {item.action_recommendation && (
                  <div
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '12px',
                      background: '#ffffff',
                      border: `1px solid ${borderLeftColor}30`,
                      fontSize: '0.78rem',
                      color: '#0f172a',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <span style={{ color: borderLeftColor }}>💡</span>
                    <span><strong>Saran AI:</strong> {item.action_recommendation}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Detail Performa Kasir */}
      <EmployeePerformanceModal employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />
    </div>
  );
};
