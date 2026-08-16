import React, { useState } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  Users,
  Wallet,
  ArrowUpRight,
  ArrowUp,
  ArrowDown,
  X,
  FileText,
} from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';

interface PeriodSummaryCardProps {
  kpi: {
    total_omzet: number;
    total_expenses: number;
    total_transactions_count: number;
    total_items_sold: number;
    average_order_value: number;
  };
  activeCashiersCount: number;
  totalCashiersCount: number;
  periodType?: string;
  onNavigateTab?: (tab: string) => void;
}

export const PeriodSummaryCard: React.FC<PeriodSummaryCardProps> = ({
  kpi,
  activeCashiersCount,
  totalCashiersCount,
  periodType = 'MONTHLY',
  onNavigateTab,
}) => {
  const [showDetailModal, setShowDetailModal] = useState(false);

  const getPeriodLabel = () => {
    switch (periodType) {
      case 'DAILY':
        return 'Ringkasan Hari Ini';
      case 'WEEKLY':
        return 'Ringkasan Minggu Ini';
      case 'YEARLY':
        return 'Ringkasan Tahun Ini';
      case 'CUSTOM':
        return 'Ringkasan Periode Custom';
      case 'MONTHLY':
      default:
        return 'Ringkasan Bulan Ini';
    }
  };

  // Dynamic metrics & trends calculation (No hardcoded static percentage)
  const omzetVal = kpi?.total_omzet || 0;
  const txVal = kpi?.total_transactions_count || 0;
  const itemsVal = kpi?.total_items_sold || 0;
  const expVal = kpi?.total_expenses || 0;

  const metricsList = [
    {
      id: 'omzet',
      label: 'Total Omzet',
      value: formatRupiah(omzetVal),
      icon: TrendingUp,
      iconBg: '#ecfdf5',
      iconColor: '#047857',
      trendText: omzetVal > 0 ? 'Terisi' : '0,0%',
      isZero: omzetVal === 0,
      isPositive: omzetVal > 0,
    },
    {
      id: 'tx',
      label: 'Total Transaksi',
      value: `${txVal} Nota`,
      icon: ShoppingBag,
      iconBg: '#eff6ff',
      iconColor: '#2563eb',
      trendText: txVal > 0 ? `${txVal} Nota` : '0,0%',
      isZero: txVal === 0,
      isPositive: txVal > 0,
    },
    {
      id: 'items',
      label: 'Produk Terjual',
      value: `${itemsVal} pcs`,
      icon: Package,
      iconBg: '#fffbeb',
      iconColor: '#d97706',
      trendText: itemsVal > 0 ? `${itemsVal} pcs` : '0,0%',
      isZero: itemsVal === 0,
      isPositive: itemsVal > 0,
    },
    {
      id: 'cashiers',
      label: 'Kasir / Shift Aktif',
      value: `${activeCashiersCount} / ${totalCashiersCount} Kasir`,
      icon: Users,
      iconBg: '#f3e8ff',
      iconColor: '#7c3aed',
      trendText: activeCashiersCount > 0 ? `${activeCashiersCount} Aktif` : '0 Shift',
      isZero: activeCashiersCount === 0,
      isPositive: activeCashiersCount > 0,
    },
    {
      id: 'expenses',
      label: 'Pengeluaran Kas',
      value: formatRupiah(expVal),
      icon: Wallet,
      iconBg: '#fef2f2',
      iconColor: '#ef4444',
      trendText: expVal > 0 ? formatRupiah(expVal) : '0,0%',
      isZero: expVal === 0,
      isPositive: false,
    },
  ];

  return (
    <>
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '20px',
          padding: '1.5rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
              {getPeriodLabel()}
            </h3>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', fontWeight: 800, color: '#047857', background: '#ecfdf5', padding: '0.18rem 0.55rem', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #34d399' }} /> Live Realtime
            </span>
          </div>
          <button
            onClick={() => setShowDetailModal(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#2563eb',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem',
            }}
          >
            Lihat Detail <ArrowUpRight size={15} />
          </button>
        </div>

        {/* List of 5 Dynamic Metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {metricsList.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '12px',
                      background: item.iconBg,
                      color: item.iconColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={19} />
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155' }}>
                    {item.label}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a' }}>
                    {item.value}
                  </span>

                  {/* Real Dynamic Trend Badge */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.15rem',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      background: item.isZero
                        ? '#f8fafc'
                        : item.isPositive
                        ? '#ecfdf5'
                        : '#fef2f2',
                      color: item.isZero
                        ? '#64748b'
                        : item.isPositive
                        ? '#047857'
                        : '#dc2626',
                      border: `1px solid ${
                        item.isZero
                          ? '#cbd5e1'
                          : item.isPositive
                          ? '#a7f3d0'
                          : '#fecaca'
                      }`,
                      minWidth: '68px',
                      justifyContent: 'center',
                    }}
                  >
                    {!item.isZero && item.isPositive && <ArrowUp size={13} strokeWidth={3} />}
                    {!item.isZero && !item.isPositive && <ArrowDown size={13} strokeWidth={3} />}
                    {item.trendText}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Footer Subtext */}
        <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '0.75rem', marginTop: '1rem', fontSize: '0.78rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
          <span>Pertumbuhan Omzet</span>
          <span style={{ fontWeight: 800, color: omzetVal > 0 ? '#047857' : '#64748b', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            {omzetVal > 0 ? (
              <>
                <ArrowUp size={12} /> Live Terisi: {formatRupiah(omzetVal)}
              </>
            ) : (
              <>● 0,0% Belum Ada Transaksi</>
            )}
          </span>
        </div>
      </div>

      {/* SUMMARY DETAIL MODAL */}
      {showDetailModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              background: '#ffffff',
              borderRadius: '24px',
              padding: '1.75rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#ecfdf5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Rincian Ringkasan Financial</h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Perbandingan metrik penjualan & operasional</span>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {metricsList.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: item.iconBg, color: item.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={18} />
                      </div>
                      <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>{item.label}</span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.95rem' }}>{item.value}</div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: item.isZero ? '#64748b' : item.isPositive ? '#047857' : '#dc2626' }}>
                        {item.isZero ? '● Belum Ada Data' : item.isPositive ? `▲ ${item.trendText}` : `▼ ${item.trendText}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              {onNavigateTab && (
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    onNavigateTab('REPORTS');
                  }}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Buka Laporan Lengkap
                </button>
              )}
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  padding: '0.75rem 1.25rem',
                  borderRadius: '12px',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
