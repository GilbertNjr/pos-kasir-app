import React, { useState } from 'react';
import { PieChart, X, ArrowUpRight, Inbox } from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';

interface CategoryItem {
  category_name: string;
  omzet: number;
  business_unit: string;
  unit_sold?: number;
}

interface CategoryDonutChartCardProps {
  categories?: CategoryItem[];
}

const PALETTE = ['#7c3aed', '#10b981', '#f59e0b', '#2563eb', '#ec4899', '#06b6d4', '#84cc16'];

export const CategoryDonutChartCard: React.FC<CategoryDonutChartCardProps> = ({ categories = [] }) => {
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filter valid categories with omzet > 0
  const validCategories = (categories || []).filter((item) => (item.omzet || 0) > 0);
  const totalOmzet = validCategories.reduce((acc, item) => acc + (item.omzet || 0), 0);

  const hasData = validCategories.length > 0 && totalOmzet > 0;

  // Process slices if data exists
  let slices = validCategories.map((cat, idx) => {
    const pct = Math.round(((cat.omzet || 0) / totalOmzet) * 1000) / 10;
    return {
      name: cat.category_name || `Kategori ${idx + 1}`,
      omzet: cat.omzet || 0,
      business_unit: cat.business_unit || 'POS',
      pct: pct,
      color: PALETTE[idx % PALETTE.length],
    };
  });

  // Calculate cumulative offsets for SVG Donut
  const radius = 52;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  let cumulativePct = 0;

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
        {/* Card Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <PieChart size={19} color="#7c3aed" />
            Kategori Produk Terlaris
          </h3>
          {hasData && (
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
                transition: 'opacity 0.2s',
              }}
            >
              Lihat Detail <ArrowUpRight size={15} />
            </button>
          )}
        </div>

        {/* Donut Chart & Legend Side-by-Side */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          {/* SVG Donut Chart */}
          <div style={{ position: 'relative', width: '150px', height: '150px', flexShrink: 0, margin: '0 auto' }}>
            <svg width="150" height="150" viewBox="0 0 150 150" style={{ transform: 'rotate(-90deg)' }}>
              {!hasData ? (
                // Empty State Donut Ring
                <circle
                  cx="75"
                  cy="75"
                  r={radius}
                  fill="transparent"
                  stroke="#e2e8f0"
                  strokeWidth={strokeWidth}
                />
              ) : (
                slices.map((slice, idx) => {
                  const strokeDasharray = `${(slice.pct / 100) * circumference} ${circumference}`;
                  const strokeDashoffset = -1 * (cumulativePct / 100) * circumference;
                  cumulativePct += slice.pct;

                  return (
                    <circle
                      key={idx}
                      cx="75"
                      cy="75"
                      r={radius}
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      style={{ transition: 'stroke-dasharray 0.5s ease' }}
                    />
                  );
                })
              )}
              {/* Inner Hole */}
              <circle cx="75" cy="75" r={radius - strokeWidth / 2 - 2} fill="#ffffff" />
            </svg>

            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b' }}>TOTAL</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#0f172a' }}>
                {hasData ? `${slices.length} Kat.` : '0 Kat.'}
              </span>
            </div>
          </div>

          {/* Legend List or Empty State */}
          {hasData ? (
            <div style={{ flex: 1, minWidth: '170px', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {slices.slice(0, 5).map((slice, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.825rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: slice.color,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontWeight: 700, color: '#334155', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {slice.name}
                    </span>
                  </div>
                  <span style={{ fontWeight: 800, color: '#0f172a', marginLeft: '0.5rem', flexShrink: 0 }}>
                    {slice.pct.toFixed(1).replace('.', ',')}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ flex: 1, minWidth: '170px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem 0.5rem', color: '#94a3b8', textAlign: 'center' }}>
              <Inbox size={26} color="#cbd5e1" style={{ marginBottom: '0.3rem' }} />
              <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#64748b' }}>Belum Ada Penjualan</span>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Produk terjual akan tampil di sini secara real-time</span>
            </div>
          )}
        </div>

        {/* Dynamic Footer Subtext */}
        <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '0.75rem', marginTop: '1rem', fontSize: '0.78rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
          <span>
            Omzet Terbesar: <strong>{hasData ? (slices[0]?.name || '-') : 'Belum Ada Transaksi'}</strong>
          </span>
          <span style={{ fontWeight: 800, color: hasData ? '#7c3aed' : '#64748b' }}>
            {formatRupiah(totalOmzet)}
          </span>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {showDetailModal && hasData && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10050,
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDetailModal(false);
            }
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
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PieChart size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Detail Kategori Produk</h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Rincian kontribusi omzet per kategori</span>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '360px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {slices.map((slice, idx) => (
                <div key={idx} style={{ padding: '0.85rem 1rem', borderRadius: '14px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#0f172a' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: slice.color }} />
                      {slice.name}
                    </span>
                    <span style={{ fontWeight: 900, color: '#2563eb' }}>{formatRupiah(slice.omzet)}</span>
                  </div>
                  <div style={{ height: '8px', borderRadius: '4px', background: '#e2e8f0', overflow: 'hidden', marginBottom: '0.35rem' }}>
                    <div style={{ width: `${slice.pct}%`, height: '100%', background: slice.color, borderRadius: '4px' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                    <span>Bidang: <strong>{slice.business_unit}</strong></span>
                    <span style={{ fontWeight: 800, color: '#0f172a' }}>Kontribusi: {slice.pct.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowDetailModal(false)}
              style={{
                width: '100%',
                padding: '0.75rem',
                marginTop: '1.25rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Tutup Detail
            </button>
          </div>
        </div>
      )}
    </>
  );
};
