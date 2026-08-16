import React, { useState, useEffect } from 'react';
import { Banknote, QrCode, ArrowRightLeft, TrendingUp, RefreshCw } from 'lucide-react';
import { apiService, PaymentSummaryData } from '../services/api';
import { Shift } from '../types';
import { formatRupiah } from '../utils/formatters';
import { PaymentMethodBadge } from '../components/common/PaymentMethodBadge';

interface PaymentSummaryPageProps {
  activeShift: Shift | null;
}

export const PaymentSummaryPage: React.FC<PaymentSummaryPageProps> = ({ activeShift }) => {
  const [summary, setSummary] = useState<PaymentSummaryData | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = async () => {
    if (!activeShift) return;
    try {
      setLoading(true);
      setError(null);
      const [summaryData, txData] = await Promise.all([
        apiService.getPaymentSummary(activeShift.shift_id),
        apiService.getTransactions(activeShift.shift_id),
      ]);
      setSummary(summaryData);
      setTransactions(txData);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat rekap pembayaran');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [activeShift?.shift_id]);

  if (!activeShift) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        <p>Tidak ada sesi shift aktif. Buka shift terlebih dahulu untuk melihat rekap pembayaran.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp color="var(--primary-500)" />
            Rekap Pembayaran - Shift Aktif #{activeShift.shift_id.slice(-6)}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Breakdown omzet berdasarkan metode pembayaran
          </p>
        </div>
        <button onClick={loadSummary} disabled={loading} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
          <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          {loading ? 'Memuat...' : 'Perbarui'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {loading && !summary ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Menghitung rekap...</div>
      ) : summary ? (
        <>
          {/* Metrik Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            {/* Total Omzet */}
            <div style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))', color: '#fff', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', opacity: 0.85 }}>Total Omzet Shift</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{formatRupiah(summary.total_revenue)}</h3>
              <p style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.25rem' }}>{summary.total_transactions} Transaksi Selesai</p>
            </div>

            {/* CASH */}
            <div style={{ background: '#ecfdf5', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid #a7f3d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#047857', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 800 }}>
                <Banknote size={18} />
                CASH / TUNAI (HIJAU)
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#047857' }}>{formatRupiah(summary.cash.amount)}</h3>
              <p style={{ fontSize: '0.75rem', color: '#065f46', marginTop: '0.25rem', fontWeight: 600 }}>{summary.cash.count} transaksi</p>
              {summary.total_revenue > 0 && (
                <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 800, marginTop: '0.25rem' }}>
                  {((summary.cash.amount / summary.total_revenue) * 100).toFixed(1)}% dari total
                </div>
              )}
            </div>

            {/* QRIS */}
            <div style={{ background: '#eff6ff', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid #bfdbfe' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#1d4ed8', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 800 }}>
                <QrCode size={18} />
                QRIS NON-TUNAI (BIRU)
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1d4ed8' }}>{formatRupiah(summary.qris.amount)}</h3>
              <p style={{ fontSize: '0.75rem', color: '#1e40af', marginTop: '0.25rem', fontWeight: 600 }}>{summary.qris.count} transaksi</p>
              {summary.total_revenue > 0 && (
                <div style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 800, marginTop: '0.25rem' }}>
                  {((summary.qris.amount / summary.total_revenue) * 100).toFixed(1)}% dari total
                </div>
              )}
            </div>

            {/* TRANSFER */}
            <div style={{ background: '#fffbeb', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid #fde68a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#b45309', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 800 }}>
                <ArrowRightLeft size={18} />
                TRANSFER BANK (KUNING)
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#b45309' }}>{formatRupiah(summary.transfer.amount)}</h3>
              <p style={{ fontSize: '0.75rem', color: '#92400e', marginTop: '0.25rem', fontWeight: 600 }}>{summary.transfer.count} transaksi</p>
              {summary.total_revenue > 0 && (
                <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 800, marginTop: '0.25rem' }}>
                  {((summary.transfer.amount / summary.total_revenue) * 100).toFixed(1)}% dari total
                </div>
              )}
            </div>
          </div>

          {/* Visual Proportional Bar */}
          {summary.total_revenue > 0 && (
            <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 800 }}>Proporsi Omzet per Metode Bayar</h3>
              <div style={{ height: '24px', borderRadius: '12px', overflow: 'hidden', display: 'flex', marginBottom: '0.75rem', background: '#f1f5f9' }}>
                {summary.cash.amount > 0 && (
                  <div
                    style={{
                      width: `${(summary.cash.amount / summary.total_revenue) * 100}%`,
                      background: '#10b981',
                      transition: 'width 0.5s ease',
                    }}
                  />
                )}
                {summary.qris.amount > 0 && (
                  <div
                    style={{
                      width: `${(summary.qris.amount / summary.total_revenue) * 100}%`,
                      background: '#3b82f6',
                      transition: 'width 0.5s ease',
                    }}
                  />
                )}
                {summary.transfer.amount > 0 && (
                  <div
                    style={{
                      width: `${(summary.transfer.amount / summary.total_revenue) * 100}%`,
                      background: '#f59e0b',
                      transition: 'width 0.5s ease',
                    }}
                  />
                )}
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', fontWeight: 700 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#047857' }}>
                  <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }} />
                  CASH / TUNAI (HIJAU)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#1d4ed8' }}>
                  <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6' }} />
                  QRIS (BIRU)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#b45309' }}>
                  <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }} />
                  TRANSFER (KUNING)
                </span>
              </div>
            </div>
          )}

          {/* Tabel Riwayat Transaksi Shift */}
          {transactions.length > 0 && (
            <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 800 }}>Riwayat Transaksi Shift Ini ({transactions.length} Transaksi)</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>No. Transaksi</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Kasir</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center' }}>Metode Bayar</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>Total</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx: any) => (
                      <tr key={tx.transaction_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.5rem', fontWeight: 600, fontFamily: 'monospace' }}>{tx.transaction_number}</td>
                        <td style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>{tx.created_by_user_id}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                          <PaymentMethodBadge method={tx.payment_method} size="sm" />
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 700 }}>{formatRupiah(tx.final_total)}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--success)', fontSize: '0.8rem', fontWeight: 600 }}>
                          ✓ {tx.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Belum ada transaksi di shift ini. Mulai checkout untuk melihat rekap.
        </div>
      )}
    </div>
  );
};
