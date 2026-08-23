import React, { useState } from 'react';
import { TrendingUp, DollarSign, ShoppingBag } from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';

interface RevenueChartPoint {
  label: string;
  omzet: number;
  transaction_count: number;
}

interface RevenuePerformanceChartProps {
  data: RevenueChartPoint[];
  periodType: string;
}

export const RevenuePerformanceChart: React.FC<RevenuePerformanceChartProps> = ({ data, periodType }) => {
  const [activeHover, setActiveHover] = useState<RevenueChartPoint | null>(null);
  const [chartMode, setChartMode] = useState<'OMZET' | 'TRANSACTION'>('OMZET');

  const maxOmzet = Math.max(...data.map((d) => d.omzet), 100000);
  const maxTx = Math.max(...data.map((d) => d.transaction_count), 1);
  const totalOmzetPeriod = data.reduce((acc, d) => acc + d.omzet, 0);
  const totalTxPeriod = data.reduce((acc, d) => acc + d.transaction_count, 0);

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '24px',
        padding: '1.6rem',
        boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.04)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                color: '#b45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(180, 83, 9, 0.15)',
                border: '1px solid #fde68a',
              }}
            >
              <TrendingUp size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Grafik Perkembangan Omzet & Transaksi
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>
                Tren Omzet realtime berbasis transaksi terverifikasi ({periodType})
              </p>
            </div>
          </div>
        </div>

        {/* Mode Toggle & Tooltip Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          {activeHover ? (
            <div
              style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '12px',
                padding: '0.4rem 0.85rem',
                fontSize: '0.825rem',
                textAlign: 'right',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ fontWeight: 900, color: '#b45309' }}>
                {chartMode === 'OMZET' ? formatRupiah(activeHover.omzet) : `${activeHover.transaction_count} Nota`}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#78350f', fontWeight: 600 }}>
                {activeHover.label} ({formatRupiah(activeHover.omzet)} • {activeHover.transaction_count} Tx)
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', background: '#f8fafc', padding: '0.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <button
                onClick={() => setChartMode('OMZET')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '9px',
                  border: 'none',
                  background: chartMode === 'OMZET' ? '#ffffff' : 'transparent',
                  color: chartMode === 'OMZET' ? '#b45309' : '#64748b',
                  fontWeight: chartMode === 'OMZET' ? 800 : 600,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  boxShadow: chartMode === 'OMZET' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <DollarSign size={13} /> Nominal (Rp)
              </button>
              <button
                onClick={() => setChartMode('TRANSACTION')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '9px',
                  border: 'none',
                  background: chartMode === 'TRANSACTION' ? '#ffffff' : 'transparent',
                  color: chartMode === 'TRANSACTION' ? '#b45309' : '#64748b',
                  fontWeight: chartMode === 'TRANSACTION' ? 800 : 600,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  boxShadow: chartMode === 'TRANSACTION' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <ShoppingBag size={13} /> Vol. Nota (Tx)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SVG Interactive Bar Chart (Scrollable on small viewports) */}
      <div className="chart-scroll-wrapper" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '0.4rem' }}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            minWidth: data.length > 6 ? `${data.length * 46}px` : '100%',
            height: '220px',
            display: 'flex',
            alignItems: 'flex-end',
            gap: '8px',
            paddingTop: '24px',
            paddingBottom: '8px',
          }}
        >
          {data.length === 0 ? (
            <div style={{ width: '100%', textAlign: 'center', margin: 'auto', color: '#94a3b8', fontSize: '0.875rem', fontWeight: 600 }}>
              Belum ada data transaksi terformat pada periode ini
            </div>
          ) : (
            data.map((pt, idx) => {
              const currentVal = chartMode === 'OMZET' ? pt.omzet : pt.transaction_count;
              const currentMax = chartMode === 'OMZET' ? maxOmzet : maxTx;
              const heightPct = Math.max(6, Math.round((currentVal / currentMax) * 100));
              const isHovered = activeHover?.label === pt.label;

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setActiveHover(pt)}
                  onMouseLeave={() => setActiveHover(null)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end',
                    cursor: 'pointer',
                    position: 'relative',
                    minWidth: '36px',
                  }}
                >
                  {/* Floating Top Value Label on Hover */}
                  {isHovered && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '-20px',
                        fontSize: '0.68rem',
                        fontWeight: 900,
                        color: '#b45309',
                        background: '#fffbeb',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '6px',
                        whiteSpace: 'nowrap',
                        border: '1px solid #fde68a',
                        zIndex: 10,
                      }}
                    >
                      {chartMode === 'OMZET' ? formatRupiah(pt.omzet) : `${pt.transaction_count} Tx`}
                    </div>
                  )}

                  {/* Vertical Bar */}
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '42px',
                      height: `${heightPct}%`,
                      background: isHovered
                        ? 'linear-gradient(180deg, #f59e0b 0%, #b45309 100%)'
                        : chartMode === 'OMZET'
                        ? 'linear-gradient(180deg, #fbbf24 0%, #d97706 100%)'
                        : 'linear-gradient(180deg, #34d399 0%, #059669 100%)',
                      borderRadius: '8px 8px 3px 3px',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: isHovered ? 'scaleY(1.03)' : 'scaleY(1)',
                      transformOrigin: 'bottom',
                      boxShadow: isHovered
                        ? '0 8px 20px rgba(180, 83, 9, 0.4)'
                        : '0 2px 6px rgba(0, 0, 0, 0.04)',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: isHovered ? '#b45309' : '#64748b',
                      fontWeight: isHovered ? 900 : 600,
                      marginTop: '0.5rem',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '100%',
                    }}
                  >
                    {pt.label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chart Footer Summary Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px dashed #e2e8f0',
          paddingTop: '0.85rem',
          marginTop: '0.85rem',
          fontSize: '0.78rem',
          color: '#64748b',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }} />
          Total Omzet Periode Ini: <strong style={{ color: '#0f172a' }}>{formatRupiah(totalOmzetPeriod)}</strong>
        </span>
        <span style={{ fontWeight: 800, color: '#047857', background: '#ecfdf5', padding: '0.2rem 0.65rem', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
          Volume: {totalTxPeriod} Nota Transaksi
        </span>
      </div>
    </div>
  );
};
