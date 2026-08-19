import React, { useState, useEffect, useMemo } from 'react';
import {
  Banknote,
  QrCode,
  ArrowRightLeft,
  TrendingUp,
  RefreshCw,
  Trash2,
  Calendar,
  Filter,
  Printer,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { apiService, PaymentSummaryData } from '../services/api';
import { Shift } from '../types';
import { formatRupiah } from '../utils/formatters';
import { PaymentMethodBadge } from '../components/common/PaymentMethodBadge';

interface PaymentSummaryPageProps {
  activeShift: Shift | null;
}

export const PaymentSummaryPage: React.FC<PaymentSummaryPageProps> = ({ activeShift }) => {
  const [summary, setSummary] = useState<PaymentSummaryData | null>(null);
  const [allHistoricalTransactions, setAllHistoricalTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter Period State
  const [selectedPeriod, setSelectedPeriod] = useState<string>('ACTIVE_SHIFT');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('ALL');

  // Cancel / Delete Modal State
  const [confirmCancelTx, setConfirmCancelTx] = useState<any | null>(null);
  const [cancelLoading, setCancelLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch shift payment summary if active shift exists
      const summaryPromise = activeShift ? apiService.getPaymentSummary(activeShift.shift_id).catch(() => null) : Promise.resolve(null);
      // Fetch all transactions from database for historical date range filtering
      const txPromise = apiService.getTransactions().catch(() => []);

      const [summaryData, txData] = await Promise.all([summaryPromise, txPromise]);

      setSummary(summaryData);
      setAllHistoricalTransactions(txData || []);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat rekap pembayaran');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [activeShift?.shift_id]);

  // Format timestamp with Day Name, Date, Month, Year & Time (Senin, 19/08/2026 14:20)
  const formatTimestampFull = (dateStr?: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayName = days[d.getDay()];
    const dayDate = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${dayName}, ${dayDate}/${month}/${year} ${hours}:${minutes}`;
  };

  // Filtered transactions based on date preset & custom range
  const filteredTransactions = useMemo(() => {
    let list = allHistoricalTransactions;

    if (selectedPeriod === 'ACTIVE_SHIFT' && activeShift) {
      list = list.filter((t) => t.shift_id === activeShift.shift_id);
    } else if (selectedPeriod === 'TODAY') {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
      list = list.filter((t) => {
        const time = new Date(t.created_at || t.timestamp).getTime();
        return time >= start && time <= end;
      });
    } else if (selectedPeriod === 'THIS_WEEK') {
      const now = new Date();
      const day = now.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
      const sunday = new Date(now.getFullYear(), now.getMonth(), monday.getDate() + 6, 23, 59, 59, 999);
      const start = monday.getTime();
      const end = sunday.getTime();
      list = list.filter((t) => {
        const time = new Date(t.created_at || t.timestamp).getTime();
        return time >= start && time <= end;
      });
    } else if (selectedPeriod === 'THIS_MONTH') {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
      list = list.filter((t) => {
        const time = new Date(t.created_at || t.timestamp).getTime();
        return time >= start && time <= end;
      });
    } else if (selectedPeriod === 'CUSTOM') {
      const start = startDate ? new Date(startDate).getTime() : 0;
      const end = endDate ? new Date(endDate + 'T23:59:59').getTime() : Infinity;
      list = list.filter((t) => {
        const time = new Date(t.created_at || t.timestamp).getTime();
        return time >= start && time <= end;
      });
    }

    if (selectedPaymentMethod !== 'ALL') {
      list = list.filter((t) => t.payment_method === selectedPaymentMethod);
    }

    return list;
  }, [allHistoricalTransactions, selectedPeriod, startDate, endDate, selectedPaymentMethod, activeShift]);

  // Dynamically calculated payment summary for the filtered transactions
  const activeSummary = useMemo(() => {
    if (selectedPeriod === 'ACTIVE_SHIFT' && summary) {
      return summary;
    }

    const completed = filteredTransactions.filter((t) => t.status === 'COMPLETED');
    const totalRev = completed.reduce((acc, t) => acc + (t.final_total || t.total_amount || 0), 0);

    const cashList = completed.filter((t) => t.payment_method === 'CASH');
    const qrisList = completed.filter((t) => t.payment_method === 'QRIS');
    const transferList = completed.filter((t) => t.payment_method === 'TRANSFER');

    return {
      total_revenue: totalRev,
      total_transactions: completed.length,
      cash: {
        amount: cashList.reduce((acc, t) => acc + (t.final_total || t.total_amount || 0), 0),
        count: cashList.length,
      },
      qris: {
        amount: qrisList.reduce((acc, t) => acc + (t.final_total || t.total_amount || 0), 0),
        count: qrisList.length,
      },
      transfer: {
        amount: transferList.reduce((acc, t) => acc + (t.final_total || t.total_amount || 0), 0),
        count: transferList.length,
      },
    };
  }, [filteredTransactions, selectedPeriod, summary]);

  // Execute transaction cancellation / deletion
  const handleExecuteCancel = async () => {
    if (!confirmCancelTx) return;
    try {
      setCancelLoading(true);
      await apiService.cancelTransaction(confirmCancelTx.transaction_id);
      setToastMessage({
        type: 'success',
        text: `Transaksi #${confirmCancelTx.transaction_number} berhasil dibatalkan dan stok dikembalikan.`,
      });
      setConfirmCancelTx(null);
      await loadSummary();
    } catch (err: any) {
      setToastMessage({
        type: 'danger',
        text: err.message || 'Gagal membatalkan transaksi',
      });
    } finally {
      setCancelLoading(false);
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'KEDAI KOPI SENJA & PRINTING - REKAP PEMBAYARAN TRANSAKSI\n';
    csvContent += `Periode: ${selectedPeriod} | Tanggal Cetak: ${todayStr}\n\n`;
    csvContent += `TOTAL OMZET,${activeSummary.total_revenue},TOTAL TRANSAKSI,${activeSummary.total_transactions}\n`;
    csvContent += `CASH,${activeSummary.cash.amount},QRIS,${activeSummary.qris.amount},TRANSFER,${activeSummary.transfer.amount}\n\n`;
    csvContent += 'No. Transaksi,Waktu & Hari,Kasir,Metode Bayar,Total (Rp),Status\n';

    filteredTransactions.forEach((tx) => {
      const timeStr = formatTimestampFull(tx.created_at || tx.timestamp).replace(/,/g, '');
      csvContent += `${tx.transaction_number},${timeStr},${tx.created_by_user_id || '-'},${tx.payment_method},${tx.final_total || tx.total_amount || 0},${tx.status}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Pembayaran_${todayStr.replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Cetak PDF
  const handlePrintPDF = () => {
    const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const printWin = window.open('', '_blank', 'width=900,height=800');
    if (!printWin) {
      alert('Harap izinkan popup browser untuk mencetak PDF.');
      return;
    }

    const rowsHtml = filteredTransactions
      .map(
        (tx, idx) => `
      <tr>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${idx + 1}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; font-family: monospace;">${tx.transaction_number}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 10px;">${formatTimestampFull(tx.created_at || tx.timestamp)}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px;">${tx.created_by_user_id || '-'}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px; font-weight: 700;">${tx.payment_method}</td>
        <td style="text-align: right; border: 1px solid #cbd5e1; padding: 6px; font-weight: 800;">${formatRupiah(tx.final_total || tx.total_amount || 0)}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px; color: ${tx.status === 'COMPLETED' ? '#047857' : '#dc2626'}; font-weight: 800;">${tx.status}</td>
      </tr>
    `
      )
      .join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rekap Pembayaran Transaksi - ${todayStr}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 10px; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; }
          .title { font-size: 18px; font-weight: 900; }
          .subtitle { font-size: 12px; color: #64748b; }
          .summary-box { display: flex; gap: 10px; margin-bottom: 15px; }
          .card { flex: 1; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1; background: #f8fafc; }
          .card-val { font-size: 14px; font-weight: 800; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th { background: #0f172a; color: #ffffff; padding: 6px; border: 1px solid #0f172a; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">REKAP PEMBAYARAN & RIWAYAT TRANSAKSI</div>
          <div class="subtitle">Kedai Kopi Senja & Printing | Cetak: ${todayStr} | Periode: ${selectedPeriod}</div>
        </div>
        <div class="summary-box">
          <div class="card"><div>Total Omzet</div><div class="card-val">${formatRupiah(activeSummary.total_revenue)}</div></div>
          <div class="card"><div>Tunai (Cash)</div><div class="card-val">${formatRupiah(activeSummary.cash.amount)}</div></div>
          <div class="card"><div>QRIS</div><div class="card-val">${formatRupiah(activeSummary.qris.amount)}</div></div>
          <div class="card"><div>Transfer Bank</div><div class="card-val">${formatRupiah(activeSummary.transfer.amount)}</div></div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 30px;">No</th>
              <th>No. Transaksi</th>
              <th>Hari & Waktu</th>
              <th>Kasir</th>
              <th>Metode</th>
              <th>Total (Rp)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            padding: '0.85rem 1.15rem',
            background: toastMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: toastMessage.type === 'success' ? '#047857' : '#dc2626',
            border: `1px solid ${toastMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            borderRadius: '14px',
            fontSize: '0.875rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          }}
        >
          {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* HEADER BAR & ACTION BUTTONS */}
      <div className="payment-header-card">
        <div className="payment-header-title">
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <TrendingUp size={20} />
          </div>
          <h2>Rekap Pembayaran & Riwayat Transaksi</h2>
        </div>

        <div className="payment-header-actions">
          <button
            onClick={handleExportExcel}
            className="btn-toolbar-excel"
          >
            <FileSpreadsheet size={15} />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handlePrintPDF}
            className="btn-toolbar-pdf"
          >
            <Printer size={15} />
            <span>Cetak PDF</span>
          </button>

          <button
            onClick={loadSummary}
            disabled={loading}
            className="btn-toolbar-refresh"
          >
            <RefreshCw size={15} className={loading ? 'spinning' : ''} />
            <span>Perbarui</span>
          </button>
        </div>
      </div>

      {/* CONTROL BAR FILTER PERIODE (SINGLE ROW ON DESKTOP/TABLET, GRID STACK ON MOBILE) */}
      <div className="payment-filter-bar">
        <div className="payment-filter-label">
          <Filter size={16} color="#4f46e5" />
          <span>Filter Periode:</span>
        </div>

        <div className="payment-filter-controls">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="payment-filter-select"
          >
            {activeShift && <option value="ACTIVE_SHIFT">⚡ Shift Aktif Saat Ini</option>}
            <option value="TODAY">📅 Hari Ini</option>
            <option value="THIS_WEEK">📆 Minggu Ini (Senin - Minggu)</option>
            <option value="THIS_MONTH">🗓️ Bulan Ini</option>
            <option value="CUSTOM">🔍 Rentang Tanggal Custom</option>
            <option value="ALL">📦 Semua Riwayat Transaksi</option>
          </select>

          {selectedPeriod === 'CUSTOM' && (
            <div className="payment-filter-custom-dates">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="payment-date-input"
              />
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="payment-date-input"
              />
            </div>
          )}

          <select
            value={selectedPaymentMethod}
            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
            className="payment-filter-select"
          >
            <option value="ALL">Semua Metode Pembayaran</option>
            <option value="CASH">💵 CASH / Tunai</option>
            <option value="QRIS">📱 QRIS Non-Tunai</option>
            <option value="TRANSFER">🏦 Transfer Bank</option>
          </select>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 700 }}>
          {error}
        </div>
      )}

      {/* METRIK SUMMARY CARDS (2x2 GRID RESPONSIVE ON MOBILE, 4 COLS ON DESKTOP) */}
      <div className="responsive-summary-2x2-grid">
        {/* Total Omzet */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', padding: '1rem 1.15rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)' }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.03em' }}>TOTAL OMZET REKAP</div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 900, margin: '0.2rem 0 0 0', letterSpacing: '-0.02em' }}>{formatRupiah(activeSummary.total_revenue)}</h3>
          </div>
          <p style={{ fontSize: '0.72rem', opacity: 0.8, marginTop: '0.4rem', margin: 0, fontWeight: 600 }}>{activeSummary.total_transactions} Transaksi Selesai</p>
        </div>

        {/* CASH */}
        <div style={{ background: '#ecfdf5', padding: '1rem 1.15rem', borderRadius: '16px', border: '1px solid #a7f3d0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#047857', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              <Banknote size={16} />
              <span>CASH / TUNAI</span>
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#047857', margin: '0.2rem 0 0 0', letterSpacing: '-0.02em' }}>{formatRupiah(activeSummary.cash.amount)}</h3>
          </div>
          <div>
            <p style={{ fontSize: '0.72rem', color: '#065f46', marginTop: '0.4rem', marginBottom: 0, fontWeight: 700 }}>{activeSummary.cash.count} transaksi</p>
            {activeSummary.total_revenue > 0 && (
              <div style={{ fontSize: '0.68rem', color: '#047857', fontWeight: 800, marginTop: '0.1rem' }}>
                {((activeSummary.cash.amount / activeSummary.total_revenue) * 100).toFixed(1)}% dari total
              </div>
            )}
          </div>
        </div>

        {/* QRIS */}
        <div style={{ background: '#eff6ff', padding: '1rem 1.15rem', borderRadius: '16px', border: '1px solid #bfdbfe', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#1d4ed8', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              <QrCode size={16} />
              <span>QRIS NON-TUNAI</span>
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#1d4ed8', margin: '0.2rem 0 0 0', letterSpacing: '-0.02em' }}>{formatRupiah(activeSummary.qris.amount)}</h3>
          </div>
          <div>
            <p style={{ fontSize: '0.72rem', color: '#1e40af', marginTop: '0.4rem', marginBottom: 0, fontWeight: 700 }}>{activeSummary.qris.count} transaksi</p>
            {activeSummary.total_revenue > 0 && (
              <div style={{ fontSize: '0.68rem', color: '#1d4ed8', fontWeight: 800, marginTop: '0.1rem' }}>
                {((activeSummary.qris.amount / activeSummary.total_revenue) * 100).toFixed(1)}% dari total
              </div>
            )}
          </div>
        </div>

        {/* TRANSFER */}
        <div style={{ background: '#fffbeb', padding: '1rem 1.15rem', borderRadius: '16px', border: '1px solid #fde68a', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#b45309', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              <ArrowRightLeft size={16} />
              <span>TRANSFER BANK</span>
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#b45309', margin: '0.2rem 0 0 0', letterSpacing: '-0.02em' }}>{formatRupiah(activeSummary.transfer.amount)}</h3>
          </div>
          <div>
            <p style={{ fontSize: '0.72rem', color: '#92400e', marginTop: '0.4rem', marginBottom: 0, fontWeight: 700 }}>{activeSummary.transfer.count} transaksi</p>
            {activeSummary.total_revenue > 0 && (
              <div style={{ fontSize: '0.68rem', color: '#b45309', fontWeight: 800, marginTop: '0.1rem' }}>
                {((activeSummary.transfer.amount / activeSummary.total_revenue) * 100).toFixed(1)}% dari total
              </div>
            )}
          </div>
        </div>
      </div>

      {/* VISUAL PROPORTIONAL BAR */}
      {activeSummary.total_revenue > 0 && (
        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #cbd5e1' }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Proporsi Omzet per Metode Bayar</h3>
          <div style={{ height: '22px', borderRadius: '12px', overflow: 'hidden', display: 'flex', marginBottom: '0.75rem', background: '#f1f5f9' }}>
            {activeSummary.cash.amount > 0 && (
              <div style={{ width: `${(activeSummary.cash.amount / activeSummary.total_revenue) * 100}%`, background: '#10b981', transition: 'width 0.5s ease' }} />
            )}
            {activeSummary.qris.amount > 0 && (
              <div style={{ width: `${(activeSummary.qris.amount / activeSummary.total_revenue) * 100}%`, background: '#3b82f6', transition: 'width 0.5s ease' }} />
            )}
            {activeSummary.transfer.amount > 0 && (
              <div style={{ width: `${(activeSummary.transfer.amount / activeSummary.total_revenue) * 100}%`, background: '#f59e0b', transition: 'width 0.5s ease' }} />
            )}
          </div>
          <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.78rem', fontWeight: 700, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#047857' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
              CASH / TUNAI ({((activeSummary.cash.amount / activeSummary.total_revenue) * 100).toFixed(1)}%)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#1d4ed8' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6' }} />
              QRIS ({((activeSummary.qris.amount / activeSummary.total_revenue) * 100).toFixed(1)}%)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#b45309' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
              TRANSFER ({((activeSummary.transfer.amount / activeSummary.total_revenue) * 100).toFixed(1)}%)
            </span>
          </div>
        </div>
      )}

      {/* TABEL RIWAYAT TRANSAKSI LENGKAP WITH HARI, TGL, BULAN, TAHUN & TOMBOL HAPUS */}
      <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} color="#4f46e5" />
            Riwayat Transaksi Terperinci ({filteredTransactions.length} Transaksi)
          </h3>
          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
            Menampilkan data periode: <strong>{selectedPeriod}</strong>
          </span>
        </div>

        {filteredTransactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            Belum ada transaksi ditemukan untuk filter periode ini.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #cbd5e1', color: '#475569', background: '#f8fafc' }}>
                  <th style={{ padding: '0.65rem', textAlign: 'left', borderRadius: '8px 0 0 8px' }}>No. Transaksi</th>
                  <th style={{ padding: '0.65rem', textAlign: 'left' }}>Hari & Waktu (Tgl/Bln/Thn)</th>
                  <th style={{ padding: '0.65rem', textAlign: 'left' }}>Kasir</th>
                  <th style={{ padding: '0.65rem', textAlign: 'center' }}>Metode Bayar</th>
                  <th style={{ padding: '0.65rem', textAlign: 'right' }}>Total (Rp)</th>
                  <th style={{ padding: '0.65rem', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '0.65rem', textAlign: 'center', borderRadius: '0 8px 8px 0' }}>Aksi Hapus</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx: any) => (
                  <tr key={tx.transaction_id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background 0.15s ease' }}>
                    <td style={{ padding: '0.65rem', fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>
                      {tx.transaction_number}
                    </td>
                    <td style={{ padding: '0.65rem', color: '#334155', fontSize: '0.8rem', fontWeight: 600 }}>
                      {formatTimestampFull(tx.created_at || tx.timestamp)}
                    </td>
                    <td style={{ padding: '0.65rem', color: '#475569', fontWeight: 600 }}>
                      {tx.created_by_user_id || '-'}
                    </td>
                    <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                      <PaymentMethodBadge method={tx.payment_method} size="sm" />
                    </td>
                    <td style={{ padding: '0.65rem', textAlign: 'right', fontWeight: 800, color: tx.status === 'CANCELLED' ? '#94a3b8' : '#0f172a' }}>
                      {formatRupiah(tx.final_total || tx.total_amount || 0)}
                    </td>
                    <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                      {tx.status === 'CANCELLED' ? (
                        <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <XCircle size={12} />
                          CANCELLED
                        </span>
                      ) : (
                        <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CheckCircle2 size={12} />
                          COMPLETED
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                      {tx.status !== 'CANCELLED' ? (
                        <button
                          onClick={() => setConfirmCancelTx(tx)}
                          className="btn-action-delete"
                          title="Hapus / Batalkan Transaksi"
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : (
                        <button
                          disabled={true}
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '10px',
                            border: '1px solid #f1f5f9',
                            background: '#f8fafc',
                            color: '#cbd5e1',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'not-allowed',
                          }}
                          title="Transaksi Sudah Dibatalkan"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DIALOG PERINGATAN KONFIRMASI HAPUS (CLEAN & SIMPLE) */}
      {confirmCancelTx && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '22px', maxWidth: '400px', width: '100%', padding: '1.5rem', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)', border: '1px solid #fee2e2', textAlign: 'center', animation: 'fadeIn 0.2s ease' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <Trash2 size={26} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.4rem' }}>
              Hapus Transaksi?
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.45 }}>
              Transaksi <strong style={{ color: '#0f172a' }}>#{confirmCancelTx.transaction_number}</strong> senilai <strong style={{ color: '#ef4444' }}>{formatRupiah(confirmCancelTx.final_total || confirmCancelTx.total_amount || 0)}</strong> akan dibatalkan & stok akan dikembalikan otomatis.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <button
                onClick={() => setConfirmCancelTx(null)}
                disabled={cancelLoading}
                style={{
                  padding: '0.7rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#475569',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: cancelLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Batal
              </button>

              <button
                onClick={handleExecuteCancel}
                disabled={cancelLoading}
                style={{
                  padding: '0.7rem 1rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: cancelLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
                  transition: 'all 0.15s ease',
                }}
              >
                {cancelLoading ? 'Membatalkan...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
