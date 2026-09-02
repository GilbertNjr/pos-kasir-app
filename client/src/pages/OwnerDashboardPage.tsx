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
  History,
  ArrowRight,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
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
    period_type: 'ALL',
  });

  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSummary | null>(null);
  const [showTopProductsModal, setShowTopProductsModal] = useState(false);
  const [showSlowMovingModal, setShowSlowMovingModal] = useState(false);

  // Search, filter & pagination states for modals
  const [topProductSearch, setTopProductSearch] = useState('');
  const [topProductCategory, setTopProductCategory] = useState<'ALL' | 'FC_PRINT' | 'FNB'>('ALL');
  const [topProductPage, setTopProductPage] = useState(1);

  const [slowMovingSearch, setSlowMovingSearch] = useState('');
  const [slowMovingCategory, setSlowMovingCategory] = useState<'ALL' | 'FC_PRINT' | 'FNB'>('ALL');
  const [slowMovingPage, setSlowMovingPage] = useState(1);

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

      {/* 8. TOP PRODUCTS & LOW SELLING PRODUCTS WITH ALL MOVEMENTS NAVIGATION */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        {/* Section Action Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', padding: '0 0.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={22} color="#047857" />
              Perputaran & Pergerakan Produk Toko
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>
              Analisis produk paling cepat & paling lambat terjual periode ini
            </p>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('STOCKS')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: '#047857',
                color: '#ffffff',
                border: 'none',
                padding: '0.55rem 1.15rem',
                borderRadius: '12px',
                fontSize: '0.825rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(4, 120, 87, 0.2)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#065f46')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#047857')}
            >
              <History size={16} />
              <span>Lihat Semua Pergerakan Stok</span>
              <ArrowUpRight size={16} />
            </button>
          )}
        </div>

        {/* 2-Card Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.6rem' }}>
          {/* Top Selling Products Card */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '1.6rem', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
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
                const top5Preview = activeTopProducts.slice(0, 5);
                return (
                  <>
                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                      <table style={{ width: '100%', minWidth: '340px', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            <th style={{ padding: '0.75rem 0.25rem' }}>#</th>
                            <th style={{ padding: '0.75rem 0.5rem' }}>Produk / Jasa</th>
                            <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Qty</th>
                            <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Omzet</th>
                          </tr>
                        </thead>
                        <tbody>
                          {top5Preview.map((p: any, idx: number) => {
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

                    <div style={{ marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: '1px solid #f1f5f9' }}>
                      <button
                        onClick={() => setShowTopProductsModal(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          fontSize: '0.825rem',
                          fontWeight: 800,
                          color: '#2563eb',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        Lihat Semua Produk ({activeTopProducts.length}) <ArrowRight size={15} />
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Low Selling Products Card (Slow Moving) */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '1.6rem', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
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
                const slowMovingList = metrics?.slow_moving_products || [];
                if (slowMovingList.length === 0) {
                  return (
                    <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                      <PackageX size={32} color="#cbd5e1" style={{ marginBottom: '0.5rem' }} />
                      <div style={{ fontWeight: 800, color: '#64748b', fontSize: '0.9rem' }}>Belum Ada Perputaran Stok</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Lakukan transaksi penjualan terlebih dahulu untuk menganalisis produk slow moving.</div>
                    </div>
                  );
                }
                const slow5Preview = slowMovingList.slice(0, 5);
                return (
                  <>
                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                      <table style={{ width: '100%', minWidth: '340px', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            <th style={{ padding: '0.75rem 0.5rem' }}>Produk / Jasa</th>
                            <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Qty Terjual</th>
                            <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Status Perputaran</th>
                          </tr>
                        </thead>
                        <tbody>
                          {slow5Preview.map((p: any) => (
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

                    <div style={{ marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: '1px solid #f1f5f9' }}>
                      <button
                        onClick={() => setShowSlowMovingModal(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          fontSize: '0.825rem',
                          fontWeight: 800,
                          color: '#2563eb',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        Lihat Semua Produk Slow Moving ({slowMovingList.length}) <ArrowRight size={15} />
                      </button>
                    </div>
                  </>
                );
              })()}
          </div>
        </div>
      </div>

        {/* Card Footer Action Banner */}
        {onNavigateTab && (
          <div
            style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              border: '1px dashed #cbd5e1',
              borderRadius: '18px',
              padding: '0.95rem 1.35rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <History size={18} color="#047857" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#0f172a' }}>
                  Ingin melihat seluruh riwayat pergerakan & log mutasi stok toko?
                </div>
                <div style={{ fontSize: '0.775rem', color: '#64748b' }}>
                  Akses audit log real-time, sisa kuantitas gudang, serta pencarian mutasi seluruh item.
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('STOCKS')}
              style={{
                background: '#ffffff',
                color: '#047857',
                border: '1.5px solid #047857',
                padding: '0.45rem 0.95rem',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#047857';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.color = '#047857';
              }}
            >
              <span>Buka Log Pergerakan Stok Lengkap</span>
              <ArrowRight size={15} />
            </button>
          </div>
        )}
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
                                Role: {emp.is_pj || emp.role === 'PENANGGUNG_JAWAB' ? 'PJ' : emp.role === 'OWNER' ? 'Owner' : 'Kasir'}
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
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '1.75rem', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.04)' }}>
        {/* Sleek AI Header Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
            borderRadius: '20px',
            padding: '1.25rem 1.5rem',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.15)',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Sparkles size={24} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#ffffff', margin: 0, letterSpacing: '-0.01em' }}>
                Rekomendasi Insights Bisnis Otomatis
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
                Analisis cerdas pola penjualan & peluang peningkatan margin omzet toko
              </p>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              padding: '0.4rem 0.85rem',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
            AI Engine Active
          </div>
        </div>

        {/* Insight Cards Container (Responsive Grid) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {metrics?.business_insights?.map((item: any, idx: number) => {
            const isPositive = item.type === 'POSITIVE';
            const isWarning = item.type === 'WARNING';
            const isTip = item.type === 'TIP';

            const accentColor = isPositive ? '#10b981' : isWarning ? '#f59e0b' : isTip ? '#8b5cf6' : '#3b82f6';
            const itemBgColor = isPositive ? '#f0fdf4' : isWarning ? '#fffbeb' : isTip ? '#f5f3ff' : '#f0f6ff';
            const borderColor = isPositive ? '#bbf7d0' : isWarning ? '#fde68a' : isTip ? '#ddd6fe' : '#bfdbfe';
            const badgeBg = isPositive ? '#dcfce7' : isWarning ? '#fef3c7' : isTip ? '#ede9fe' : '#dbeafe';
            const badgeText = isPositive ? '#166534' : isWarning ? '#92400e' : isTip ? '#5b21b6' : '#1e40af';
            const badgeLabel = isPositive ? 'PERFORMA UNGGUL' : isWarning ? 'PERHATIAN STOK' : isTip ? 'SARAN STRATEGIS' : 'ANALISIS SISTEM';

            // Function to render product items inside brackets as styled tag chips
            const renderMessageWithTags = (msg: string) => {
              if (!msg) return null;
              const match = msg.match(/^(.*?)\((.*?)\)(.*)$/);
              if (match) {
                const prefix = match[1];
                const itemsStr = match[2];
                const suffix = match[3];
                const items = itemsStr.split(',').map((s) => s.trim()).filter(Boolean);

                return (
                  <div style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.65 }}>
                    {prefix}
                    <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.3rem', margin: '0 0.35rem', verticalAlign: 'middle' }}>
                      {items.map((it, i) => (
                        <span
                          key={i}
                          style={{
                            background: '#ffffff',
                            border: `1px solid ${borderColor}`,
                            padding: '0.15rem 0.55rem',
                            borderRadius: '8px',
                            fontSize: '0.775rem',
                            fontWeight: 800,
                            color: '#0f172a',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                          }}
                        >
                          {it}
                        </span>
                      ))}
                    </span>
                    {suffix}
                  </div>
                );
              }
              return <div style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.65 }}>{msg}</div>;
            };

            return (
              <div
                key={idx}
                style={{
                  padding: '1.35rem 1.5rem',
                  borderRadius: '20px',
                  background: itemBgColor,
                  border: `1.5px solid ${borderColor}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.85rem',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.02)',
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: badgeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isPositive && <CheckCircle2 size={18} color={accentColor} />}
                      {isWarning && <AlertCircle size={18} color={accentColor} />}
                      {isTip && <Sparkles size={18} color={accentColor} />}
                      {!isPositive && !isWarning && !isTip && <Lightbulb size={18} color={accentColor} />}
                    </div>
                    <h4 style={{ fontWeight: 900, fontSize: '1.025rem', color: '#0f172a', margin: 0 }}>
                      {item.title}
                    </h4>
                  </div>

                  <span style={{ padding: '0.25rem 0.65rem', borderRadius: '8px', background: badgeBg, color: badgeText, fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.03em' }}>
                    {badgeLabel}
                  </span>
                </div>

                {/* Message Body */}
                {renderMessageWithTags(item.message)}

                {/* Action Recommendation Box ("Saran AI") */}
                {item.action_recommendation && (
                  <div
                    style={{
                      marginTop: '0.25rem',
                      padding: '0.85rem 1.15rem',
                      borderRadius: '14px',
                      background: '#ffffff',
                      border: `1px solid ${borderColor}`,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: badgeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.1rem' }}>
                      <Lightbulb size={16} color={accentColor} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.725rem', fontWeight: 900, color: badgeText, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                        💡 Rekomendasi Tindakan AI
                      </span>
                      <div style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 700, marginTop: '0.2rem', lineHeight: 1.5 }}>
                        {item.action_recommendation}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Detail Performa Kasir */}
      <EmployeePerformanceModal employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />

      {/* Modal 1: Peringkat Produk Terjual (Semua Produk) */}
      {showTopProductsModal && (() => {
        const ITEMS_PER_PAGE = 8;
        const allTopActive = (metrics?.top_selling_products || []).filter((p: any) => (p.qty_sold || 0) > 0);
        const filteredList = allTopActive.filter((p: any) => {
          const matchCat = topProductCategory === 'ALL' || p.business_unit === topProductCategory;
          const matchSearch = !topProductSearch || p.product_name.toLowerCase().includes(topProductSearch.toLowerCase());
          return matchCat && matchSearch;
        });
        const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE) || 1;
        const currentPage = Math.min(topProductPage, totalPages);
        const paginated = filteredList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10050,
              padding: 'clamp(0.4rem, 2vw, 1rem)',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowTopProductsModal(false);
              }
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#ffffff',
                width: '100%',
                maxWidth: '680px',
                borderRadius: '24px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                border: '1px solid #cbd5e1',
                overflow: 'hidden',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                animation: 'scaleUp 0.2s ease-out',
                boxSizing: 'border-box',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '1.25rem 1.5rem',
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  background: '#ffffff',
                  gap: '1rem',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
                    Peringkat Produk Terjual ({allTopActive.length})
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
                    Daftar item produk & jasa yang paling sering dibeli pelanggan
                  </p>
                </div>
                <button
                  onClick={() => setShowTopProductsModal(false)}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '50%',
                    width: '34px',
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#64748b',
                    flexShrink: 0,
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search & Filter Toolbar */}
              <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
                <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '160px' }}>
                  <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Cari nama produk..."
                    value={topProductSearch}
                    onChange={(e) => {
                      setTopProductSearch(e.target.value);
                      setTopProductPage(1);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.75rem 0.45rem 2.2rem',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.825rem',
                      outline: 'none',
                      background: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {[
                    { id: 'ALL', label: 'Semua' },
                    { id: 'FC_PRINT', label: 'FC & Print' },
                    { id: 'FNB', label: 'F&B' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setTopProductCategory(cat.id as any);
                        setTopProductPage(1);
                      }}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        border: 'none',
                        cursor: 'pointer',
                        background: topProductCategory === cat.id ? '#047857' : '#e2e8f0',
                        color: topProductCategory === cat.id ? '#ffffff' : '#475569',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Content List */}
              <div style={{ padding: '0.85rem clamp(0.5rem, 2vw, 1.25rem)', overflowY: 'auto', flex: 1 }}>
                {paginated.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    Tidak ada produk terlaris yang sesuai pencarian/filter.
                  </div>
                ) : (
                  <div style={{ borderRadius: '16px', border: '1px solid #e2e8f0', overflowX: 'auto', WebkitOverflowScrolling: 'touch', background: '#ffffff' }}>
                    <table style={{ width: '100%', minWidth: '440px', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', color: '#64748b', textAlign: 'left', borderBottom: '1px solid #e2e8f0', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          <th style={{ padding: '0.75rem 0.6rem 0.75rem 1rem', width: '60px' }}>Rank</th>
                          <th style={{ padding: '0.75rem 0.75rem' }}>Nama Produk / Jasa</th>
                          <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center', width: '110px' }}>Terjual</th>
                          <th style={{ padding: '0.75rem 1rem 0.75rem 0.75rem', textAlign: 'right', width: '140px' }}>Total Omzet</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginated.map((p: any) => {
                          const rank = p.rank || (allTopActive.findIndex((x: any) => x.product_id === p.product_id) + 1);
                          const isGold = rank === 1;
                          const isSilver = rank === 2;
                          const isBronze = rank === 3;

                          return (
                            <tr key={p.product_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '0.75rem 0.6rem 0.75rem 1rem' }}>
                                <span
                                  style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.78rem',
                                    fontWeight: 900,
                                    background: isGold ? '#fef3c7' : isSilver ? '#f1f5f9' : isBronze ? '#fff7ed' : '#f8fafc',
                                    color: isGold ? '#b45309' : isSilver ? '#475569' : isBronze ? '#c2410c' : '#64748b',
                                    border: `1px solid ${isGold ? '#fde68a' : isSilver ? '#cbd5e1' : isBronze ? '#ffedd5' : '#e2e8f0'}`,
                                  }}
                                >
                                  #{rank}
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem 0.75rem' }}>
                                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.875rem' }}>{p.product_name}</div>
                                <span
                                  style={{
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    padding: '0.12rem 0.45rem',
                                    borderRadius: '6px',
                                    background: p.business_unit === 'FC_PRINT' ? '#eff6ff' : '#ecfdf5',
                                    color: p.business_unit === 'FC_PRINT' ? '#1d4ed8' : '#047857',
                                    display: 'inline-block',
                                    marginTop: '0.2rem',
                                  }}
                                >
                                  {p.business_unit}
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center', fontWeight: 900, color: '#0f172a' }}>
                                {p.qty_sold} {p.unit || 'pcs'}
                              </td>
                              <td style={{ padding: '0.75rem 1rem 0.75rem 0.75rem', textAlign: 'right', fontWeight: 900, color: '#2563eb', whiteSpace: 'nowrap' }}>
                                {formatRupiah(p.total_revenue)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Modal Pagination Footer */}
              <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>
                  Item {filteredList.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredList.length)} dari {filteredList.length}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setTopProductPage((p) => Math.max(p - 1, 1))}
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: currentPage <= 1 ? '#f1f5f9' : '#ffffff',
                      color: currentPage <= 1 ? '#94a3b8' : '#0f172a',
                      cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                    }}
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>

                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a' }}>
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setTopProductPage((p) => Math.min(p + 1, totalPages))}
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: currentPage >= totalPages ? '#f1f5f9' : '#ffffff',
                      color: currentPage >= totalPages ? '#94a3b8' : '#0f172a',
                      cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                    }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal 2: Produk Penjualan Rendah / Slow Moving */}
      {showSlowMovingModal && (() => {
        const ITEMS_PER_PAGE = 8;
        const allSlowList = metrics?.slow_moving_products || [];
        const filteredList = allSlowList.filter((p: any) => {
          const matchCat = slowMovingCategory === 'ALL' || p.business_unit === slowMovingCategory;
          const matchSearch = !slowMovingSearch || p.product_name.toLowerCase().includes(slowMovingSearch.toLowerCase());
          return matchCat && matchSearch;
        });
        const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE) || 1;
        const currentPage = Math.min(slowMovingPage, totalPages);
        const paginated = filteredList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10050,
              padding: 'clamp(0.4rem, 2vw, 1rem)',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowSlowMovingModal(false);
              }
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#ffffff',
                width: '100%',
                maxWidth: '680px',
                borderRadius: '24px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                border: '1px solid #cbd5e1',
                overflow: 'hidden',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                animation: 'scaleUp 0.2s ease-out',
                boxSizing: 'border-box',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '1.25rem 1.5rem',
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  background: '#ffffff',
                  gap: '1rem',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
                    Produk Penjualan Rendah / Slow Moving ({allSlowList.length})
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
                    Daftar item produk & jasa dengan perputaran penjualan terendah / belum terjual
                  </p>
                </div>
                <button
                  onClick={() => setShowSlowMovingModal(false)}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '50%',
                    width: '34px',
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#64748b',
                    flexShrink: 0,
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search & Filter Toolbar */}
              <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
                <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '160px' }}>
                  <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Cari nama produk..."
                    value={slowMovingSearch}
                    onChange={(e) => {
                      setSlowMovingSearch(e.target.value);
                      setSlowMovingPage(1);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.75rem 0.45rem 2.2rem',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.825rem',
                      outline: 'none',
                      background: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {[
                    { id: 'ALL', label: 'Semua' },
                    { id: 'FC_PRINT', label: 'FC & Print' },
                    { id: 'FNB', label: 'F&B' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSlowMovingCategory(cat.id as any);
                        setSlowMovingPage(1);
                      }}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        border: 'none',
                        cursor: 'pointer',
                        background: slowMovingCategory === cat.id ? '#dc2626' : '#e2e8f0',
                        color: slowMovingCategory === cat.id ? '#ffffff' : '#475569',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Content List */}
              <div style={{ padding: '0.85rem clamp(0.5rem, 2vw, 1.25rem)', overflowY: 'auto', flex: 1 }}>
                {paginated.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    Tidak ada produk slow moving yang sesuai pencarian/filter.
                  </div>
                ) : (
                  <div style={{ borderRadius: '16px', border: '1px solid #e2e8f0', overflowX: 'auto', WebkitOverflowScrolling: 'touch', background: '#ffffff' }}>
                    <table style={{ width: '100%', minWidth: '450px', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', color: '#64748b', textAlign: 'left', borderBottom: '1px solid #e2e8f0', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          <th style={{ padding: '0.75rem 0.6rem 0.75rem 1rem', width: '60px' }}>Rank</th>
                          <th style={{ padding: '0.75rem 0.75rem' }}>Nama Produk / Jasa</th>
                          <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center', width: '110px' }}>Terjual</th>
                          <th style={{ padding: '0.75rem 1rem 0.75rem 0.75rem', textAlign: 'right', width: '160px' }}>Status Perputaran</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginated.map((p: any) => {
                          const rank = p.rank || (allSlowList.findIndex((x: any) => x.product_id === p.product_id) + 1);

                          return (
                            <tr key={p.product_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '0.75rem 0.6rem 0.75rem 1rem' }}>
                                <span
                                  style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    background: '#f8fafc',
                                    color: '#64748b',
                                    border: '1px solid #e2e8f0',
                                  }}
                                >
                                  #{rank}
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem 0.75rem' }}>
                                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.875rem' }}>{p.product_name}</div>
                                <span
                                  style={{
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    padding: '0.12rem 0.45rem',
                                    borderRadius: '6px',
                                    background: p.business_unit === 'FC_PRINT' ? '#eff6ff' : '#ecfdf5',
                                    color: p.business_unit === 'FC_PRINT' ? '#1d4ed8' : '#047857',
                                    display: 'inline-block',
                                    marginTop: '0.2rem',
                                  }}
                                >
                                  {p.business_unit}
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center', fontWeight: 900, color: p.qty_sold === 0 ? '#dc2626' : '#d97706' }}>
                                {p.qty_sold} {p.unit || 'pcs'}
                              </td>
                              <td style={{ padding: '0.75rem 1rem 0.75rem 0.75rem', textAlign: 'right', fontSize: '0.78rem', color: '#64748b', fontWeight: 700, whiteSpace: 'nowrap' }}>
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
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Modal Pagination Footer */}
              <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>
                  Item {filteredList.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredList.length)} dari {filteredList.length}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setSlowMovingPage((p) => Math.max(p - 1, 1))}
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: currentPage <= 1 ? '#f1f5f9' : '#ffffff',
                      color: currentPage <= 1 ? '#94a3b8' : '#0f172a',
                      cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                    }}
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>

                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a' }}>
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setSlowMovingPage((p) => Math.min(p + 1, totalPages))}
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: currentPage >= totalPages ? '#f1f5f9' : '#ffffff',
                      color: currentPage >= totalPages ? '#94a3b8' : '#0f172a',
                      cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                    }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
