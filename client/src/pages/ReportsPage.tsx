import React, { useState, useEffect } from 'react';
import { FileText, Filter, Printer, Users } from 'lucide-react';
import { apiService } from '../services/api';
import { User } from '../types';
import { formatRupiah, formatWaktuIndo } from '../utils/formatters';

interface ReportsPageProps {
  currentUser: User;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ currentUser }) => {
  const [periodType, setPeriodType] = useState<string>('DAILY');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<string>('ALL');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('ALL');

  const [usersList, setUsersList] = useState<User[]>([]);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      const users = await apiService.getUsers();
      setUsersList(users);
    } catch {
      // Ignored if non-owner
    }
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {
        period_type: periodType,
        business_unit: selectedBusinessUnit,
        payment_method: selectedPaymentMethod,
      };

      if (selectedUser) params.user_id = selectedUser;
      if (periodType === 'CUSTOM') {
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
      }

      const data = await apiService.getSalesReport(params);
      setReportData(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat laporan penjualan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadReport();
  }, []);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    loadReport();
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const summary = reportData?.summary;

  return (
    <div>
      {/* Header Kop Surat Dokumen Resmi saat di-print ke PDF */}
      <div className="print-only" style={{ marginBottom: '1.5rem', textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>POS KASIR USAHA CAMPURAN</h1>
        <p style={{ fontSize: '0.9rem', margin: '0.2rem 0' }}>Fotokopi / Printing & Food & Beverage (FNB)</p>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '0.5rem', textTransform: 'uppercase' }}>
          LAPORAN PENJUALAN RESMI ({periodType})
        </h3>
        <p style={{ fontSize: '0.8rem', color: '#555' }}>
          Dicetak Pada: {new Date().toLocaleString('id-ID')} | Petugas: {currentUser.full_name} ({currentUser.role})
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText color="var(--primary-500)" />
            Pusat Laporan Penjualan & Performa Kasir
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Filter dan analisis laporan harian, mingguan, bulanan, tahunan, serta performa karyawan
          </p>
        </div>

        <button
          onClick={handlePrintPDF}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', padding: '0.55rem 1.1rem', background: 'linear-gradient(135deg, #059669, #10b981)' }}
        >
          <Printer size={16} />
          Cetak / Ekspor PDF Laporan
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* Form Bar Filter Laporan */}
      <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <form onSubmit={handleApplyFilter} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Periode Waktu:</label>
            <select
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
            >
              <option value="DAILY">Harian (Hari Ini)</option>
              <option value="WEEKLY">Mingguan (7 Hari Terakhir)</option>
              <option value="MONTHLY">Bulanan (Bulan Ini)</option>
              <option value="YEARLY">Tahunan (Tahun Ini)</option>
              <option value="CUSTOM">Rentang Tanggal Custom</option>
            </select>
          </div>

          {periodType === 'CUSTOM' && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Dari Tanggal:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Sampai Tanggal:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                />
              </div>
            </>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Filter Kasir / Pengguna:</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
            >
              <option value="">Semua Kasir & Owner</option>
              {usersList.map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.full_name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Bidang Usaha:</label>
            <select
              value={selectedBusinessUnit}
              onChange={(e) => setSelectedBusinessUnit(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
            >
              <option value="ALL">Semua Bidang Usaha</option>
              <option value="FC_PRINT">Fotokopi & Printing</option>
              <option value="FNB">Food & Beverage (FNB)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Metode Bayar:</label>
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
            >
              <option value="ALL">Semua Metode</option>
              <option value="CASH">CASH / Tunai</option>
              <option value="QRIS">QRIS Non-Tunai</option>
              <option value="TRANSFER">Transfer Bank</option>
            </select>
          </div>

          <div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '0.55rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <Filter size={16} />
              {loading ? 'Proses...' : 'Terapkan Filter'}
            </button>
          </div>
        </form>
      </div>

      {loading && !reportData ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Mengkalkulasi data laporan...</div>
      ) : summary ? (
        <>
          {/* Summary Financial Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Jumlah Transaksi Selesai</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{summary.total_transactions} Transaksi</h3>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Penjualan Kotor (Gross)</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{formatRupiah(summary.total_gross_sales)}</h3>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Total Diskon Diberikan</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--danger)' }}>-{formatRupiah(summary.total_discounts)}</h3>
            </div>

            <div style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))', color: '#fff', padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', opacity: 0.85 }}>Penjualan Bersih (Net Sales)</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatRupiah(summary.total_net_sales)}</h3>
            </div>
          </div>

          {/* Tabel Performa Kasir / Karyawan (Section 19) */}
          {reportData.employee_performance && reportData.employee_performance.length > 0 && (
            <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Users size={18} color="var(--primary-500)" />
                Laporan Performa Penjualan & Pengeluaran Per Karyawan / Kasir
              </h3>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Kasir / Karyawan</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center' }}>Jumlah Transaksi</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>Total Omzet Kasir</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>Cash / Tunai</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>QRIS Non-Tunai</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>Transfer Bank</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>Pengeluaran Dicatat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.employee_performance.map((emp: any) => (
                      <tr key={emp.user_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.5rem', fontWeight: 600 }}>
                          {emp.full_name} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({emp.username})</span>
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 700 }}>{emp.transaction_count} tx</td>
                        <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>{formatRupiah(emp.total_sales)}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'right' }}>{formatRupiah(emp.cash_sales)}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'right' }}>{formatRupiah(emp.qris_sales)}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'right' }}>{formatRupiah(emp.transfer_sales)}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--danger)', fontWeight: 600 }}>-{formatRupiah(emp.recorded_expenses_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tabel Detail Transaksi Selesai */}
          <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Rincian Transaksi Terfilter ({reportData.transactions.length})</h3>

            {reportData.transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Tidak ada transaksi yang cocok dengan filter.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>No. Transaksi</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Waktu Transaksi</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Kasir</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center' }}>Metode Bayar</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>Subtotal</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>Diskon</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>Total Akhir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.transactions.map((tx: any) => (
                      <tr key={tx.transaction_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.5rem', fontWeight: 600, fontFamily: 'monospace' }}>{tx.transaction_number}</td>
                        <td style={{ padding: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{formatWaktuIndo(tx.transaction_time)}</td>
                        <td style={{ padding: '0.5rem' }}>{tx.created_by_user_id}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                          <span
                            style={{
                              padding: '0.2rem 0.5rem',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background:
                                tx.payment_method === 'CASH'
                                  ? 'rgba(16,185,129,0.15)'
                                  : tx.payment_method === 'QRIS'
                                  ? 'rgba(37,99,235,0.15)'
                                  : 'rgba(245,158,11,0.15)',
                              color:
                                tx.payment_method === 'CASH'
                                  ? 'var(--success)'
                                  : tx.payment_method === 'QRIS'
                                  ? 'var(--primary-600)'
                                  : 'var(--accent-fc)',
                            }}
                          >
                            {tx.payment_method}
                          </span>
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'right' }}>{formatRupiah(tx.subtotal_amount)}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--danger)' }}>-{formatRupiah(tx.discount_amount)}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 700 }}>{formatRupiah(tx.final_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};
