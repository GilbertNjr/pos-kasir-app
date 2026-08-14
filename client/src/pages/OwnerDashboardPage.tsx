import React, { useState, useEffect } from 'react';
import { DollarSign, Award, RefreshCw, ShieldAlert, PieChart, ArrowDownRight, LayoutDashboard } from 'lucide-react';
import { apiService } from '../services/api';
import { User } from '../types';
import { formatRupiah } from '../utils/formatters';

interface OwnerDashboardPageProps {
  currentUser: User;
}

export const OwnerDashboardPage: React.FC<OwnerDashboardPageProps> = ({ currentUser }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getDashboardMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat metrik dashboard owner');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser.role === 'OWNER') {
      loadDashboardData();
    }
  }, [currentUser.role]);

  if (currentUser.role !== 'OWNER') {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
        <ShieldAlert size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Akses Dibatasi (Owner Only)</h3>
        <p style={{ maxWidth: '480px', margin: '0 auto', fontSize: '0.875rem' }}>
          Halaman Dashboard Eksekutif Analitik Omzet & Keuntungan hanya dapat diakses oleh akun dengan role <strong>OWNER</strong>.
        </p>
      </div>
    );
  }

  const totalUnitRevenue = (metrics?.revenue_by_unit?.FC_PRINT ?? 0) + (metrics?.revenue_by_unit?.FNB ?? 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LayoutDashboard color="var(--primary-500)" />
            Dashboard Eksekutif Owner Usaha
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Pantau pertumbuhan omzet, analisis keuntungan, dan performa perputaran produk secara real-time
          </p>
        </div>

        <button onClick={loadDashboardData} disabled={loading} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
          <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          {loading ? 'Memuat...' : 'Perbarui Analitik'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {loading && !metrics ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Memuat metrik analitik keuangan...</div>
      ) : metrics ? (
        <>
          {/* Row 1: Cards Omzet Waktu & Est Keuntungan */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Omzet Hari Ini</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--success)' }}>{formatRupiah(metrics.omzet_today)}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Hari ini</p>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Omzet 7 Hari Terakhir</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary-600)' }}>{formatRupiah(metrics.omzet_this_week)}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Performa Mingguan</p>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Omzet Bulan Ini</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-fc)' }}>{formatRupiah(metrics.omzet_this_month)}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Akumulasi Bulanan</p>
            </div>

            <div style={{ background: 'linear-gradient(135deg, var(--primary-600), var(--primary-700))', color: '#fff', padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', opacity: 0.85 }}>Est. Keuntungan Bersih</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{formatRupiah(metrics.net_profit_estimate)}</h3>
              <p style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.25rem' }}>Total Omzet - Total Pengeluaran Kas</p>
            </div>
          </div>

          {/* Row 2: Breakdown Bidang Usaha FC vs FNB & Payment Methods */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Visual Proporsi Bidang Usaha */}
            <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <PieChart size={18} color="var(--primary-500)" />
                Kontribusi Bidang Usaha (FC/Print vs FNB)
              </h3>

              {totalUnitRevenue > 0 ? (
                <>
                  <div style={{ height: '24px', borderRadius: '12px', overflow: 'hidden', display: 'flex', marginBottom: '1rem', background: 'var(--bg-main)' }}>
                    <div
                      style={{
                        width: `${((metrics.revenue_by_unit.FC_PRINT / totalUnitRevenue) * 100).toFixed(1)}%`,
                        background: 'var(--accent-fc)',
                        transition: 'width 0.5s ease',
                      }}
                    />
                    <div
                      style={{
                        width: `${((metrics.revenue_by_unit.FNB / totalUnitRevenue) * 100).toFixed(1)}%`,
                        background: 'var(--primary-500)',
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-fc)', fontWeight: 600 }}>🖨️ FC / PRINTING</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.2rem' }}>{formatRupiah(metrics.revenue_by_unit.FC_PRINT)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {((metrics.revenue_by_unit.FC_PRINT / totalUnitRevenue) * 100).toFixed(1)}% total
                      </div>
                    </div>

                    <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--primary-600)', fontWeight: 600 }}>🍜 FOOD & BEVERAGE</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.2rem' }}>{formatRupiah(metrics.revenue_by_unit.FNB)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {((metrics.revenue_by_unit.FNB / totalUnitRevenue) * 100).toFixed(1)}% total
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Belum ada data omzet bidang usaha.</div>
              )}
            </div>

            {/* Rekap Metode Bayar Overall */}
            <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <DollarSign size={18} color="var(--success)" />
                Rekapitalisasi Akumulasi Metode Pembayaran
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>💵 Cash / Tunai Laci</span>
                  <span style={{ fontWeight: 700, color: 'var(--success)' }}>{formatRupiah(metrics.revenue_by_method.CASH)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>📱 QRIS Non-Tunai</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary-600)' }}>{formatRupiah(metrics.revenue_by_method.QRIS)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>🏦 Transfer Bank Direct</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent-fc)' }}>{formatRupiah(metrics.revenue_by_method.TRANSFER)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Analisis Perputaran Produk (Top Selling & Slow Moving) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {/* Top Selling Products */}
            <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success)' }}>
                <Award size={20} />
                Top 5 Produk Terlaris (Fast-Moving)
              </h3>

              {metrics.top_selling_products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Belum ada data produk terjual.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.4rem', textAlign: 'left' }}>#</th>
                      <th style={{ padding: '0.4rem', textAlign: 'left' }}>Produk</th>
                      <th style={{ padding: '0.4rem', textAlign: 'center' }}>Terjual</th>
                      <th style={{ padding: '0.4rem', textAlign: 'right' }}>Total Omzet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.top_selling_products.map((prod: any, idx: number) => (
                      <tr key={prod.product_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.5rem', fontWeight: 700, color: 'var(--primary-600)' }}>#{idx + 1}</td>
                        <td style={{ padding: '0.5rem', fontWeight: 600 }}>{prod.product_name}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 700 }}>{prod.qty_sold} pcs</td>
                        <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>{formatRupiah(prod.total_revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Slow Moving Products */}
            <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-fc)' }}>
                <ArrowDownRight size={20} />
                Top 5 Produk Penjualan Rendah (Slow-Moving)
              </h3>

              {metrics.slow_moving_products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Belum ada data analisis slow-moving.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.4rem', textAlign: 'left' }}>Produk</th>
                      <th style={{ padding: '0.4rem', textAlign: 'center' }}>Bidang</th>
                      <th style={{ padding: '0.4rem', textAlign: 'center' }}>Terjual</th>
                      <th style={{ padding: '0.4rem', textAlign: 'right' }}>Total Omzet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.slow_moving_products.map((prod: any) => (
                      <tr key={prod.product_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.5rem', fontWeight: 600 }}>{prod.product_name}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                          <span className={prod.business_unit === 'FC_PRINT' ? 'badge badge-fc' : 'badge badge-fnb'}>{prod.business_unit}</span>
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 700, color: 'var(--danger)' }}>{prod.qty_sold} pcs</td>
                        <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 600 }}>{formatRupiah(prod.total_revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
