import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  ShoppingBag,
  QrCode,
  CreditCard,
  X,
  Search,
  Eye,
  Calendar,
  Download,
  Package,
  Wallet,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { apiService } from '../services/api';
import { User } from '../types';
import { ToastType } from '../components/ToastNotification';
import { formatRupiah, formatWaktuIndo } from '../utils/formatters';
import { TransactionDetailModal } from '../components/common/TransactionDetailModal';

interface OwnerTransactionsPageProps {
  currentUser: User;
  onTriggerToast?: (type: ToastType, title: string, message: string) => void;
  storeName?: string;
}

export const OwnerTransactionsPage: React.FC<OwnerTransactionsPageProps> = ({
  currentUser: _currentUser,
  onTriggerToast,
  storeName,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [periodType, setPeriodType] = useState('DAILY');
  const [startDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCashier] = useState('');
  const [selectedPaymentMethod] = useState('ALL');
  const [selectedStatus] = useState('ALL');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch users & transactions
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Load users
      const usersData = await apiService.getUsers().catch(() => []);
      setUsersList(usersData);

      // 2. Load transactions
      const txParams: Record<string, string> = { period: periodType, period_type: periodType };
      if (periodType === 'CUSTOM') {
        if (startDate) txParams.start_date = startDate;
        if (endDate) txParams.end_date = endDate;
      }
      if (selectedCashier) txParams.user_id = selectedCashier;
      if (selectedPaymentMethod !== 'ALL') txParams.payment_method = selectedPaymentMethod;

      const reportRes = await apiService.getSalesReport(txParams).catch(() => null);
      let rawTxs: any[] = [];
      if (reportRes && Array.isArray(reportRes.transactions)) {
        rawTxs = reportRes.transactions;
      } else {
        rawTxs = await apiService.getTransactions().catch(() => []);
      }

      setTransactions(rawTxs);
      if (rawTxs.length > 0 && !selectedTx) {
        setSelectedTx(rawTxs[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data transaksi dari database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [periodType, startDate, endDate, selectedCashier, selectedPaymentMethod]);

  // Realtime SSE Synchronization
  useEffect(() => {
    const sse = new EventSource('/api/events');
    const handleRealtimeUpdate = () => {
      loadData();
    };

    sse.addEventListener('TRANSACTION_CREATED', handleRealtimeUpdate);
    sse.addEventListener('TRANSACTION_CANCELLED', handleRealtimeUpdate);

    return () => {
      sse.removeEventListener('TRANSACTION_CREATED', handleRealtimeUpdate);
      sse.removeEventListener('TRANSACTION_CANCELLED', handleRealtimeUpdate);
      sse.close();
    };
  }, []);

  // Filter Transactions locally for Search & Status
  const filteredTransactions = transactions.filter((tx: any) => {
    const txNum = (tx.transaction_number || tx.transaction_id || '').toLowerCase();
    const custName = (tx.customer_name || 'pelanggan umum').toLowerCase();
    const cashierName = (
      tx.created_by_user_name ||
      tx.cashier_name ||
      usersList.find((u) => u.user_id === tx.created_by_user_id || u.username === tx.created_by_user_id)?.full_name ||
      (_currentUser && (tx.created_by_user_id === _currentUser.user_id || tx.created_by_user_id === _currentUser.username) ? _currentUser.full_name : null) ||
      tx.created_by_user_id ||
      'kasir'
    ).toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      txNum.includes(query) || custName.includes(query) || cashierName.includes(query);

    const matchesStatus =
      selectedStatus === 'ALL'
        ? true
        : selectedStatus === 'LUNAS'
        ? (tx.status || 'COMPLETED').toUpperCase() === 'COMPLETED'
        : (tx.status || '').toUpperCase() === 'CANCELLED';

    return matchesSearch && matchesStatus;
  });

  // Calculate Real-Time DB Metrics
  const completedTxs = filteredTransactions.filter(
    (tx) => (tx.status || 'COMPLETED').toUpperCase() !== 'CANCELLED'
  );
  const totalTransactionsCount = completedTxs.length;
  const totalSalesAmount = completedTxs.reduce(
    (acc, tx) => acc + Number(tx.final_total || tx.subtotal_amount || 0),
    0
  );
  const avgSalesPerTx =
    totalTransactionsCount > 0 ? Math.round(totalSalesAmount / totalTransactionsCount) : 0;

  const totalCashSales = completedTxs
    .filter((tx) => (tx.payment_method || 'CASH').toUpperCase() === 'CASH')
    .reduce((acc, tx) => acc + Number(tx.final_total || tx.subtotal_amount || 0), 0);

  const totalNonCashSales = completedTxs
    .filter((tx) => (tx.payment_method || '').toUpperCase() !== 'CASH')
    .reduce((acc, tx) => acc + Number(tx.final_total || tx.subtotal_amount || 0), 0);

  const cashPct =
    totalSalesAmount > 0 ? ((totalCashSales / totalSalesAmount) * 100).toFixed(1) : '0';
  const nonCashPct =
    totalSalesAmount > 0 ? ((totalNonCashSales / totalSalesAmount) * 100).toFixed(1) : '0';

  // Helper to parse transaction date YYYY-MM-DD local
  const getTxDateStr = (tx: any): string => {
    const rawDate = tx.created_at || tx.transaction_time || tx.created_at_date || tx.date;
    if (!rawDate) return '';
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Compare Today vs Yesterday Metrics
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const yest = new Date(now);
  yest.setDate(yest.getDate() - 1);
  const yesterdayStr = `${yest.getFullYear()}-${String(yest.getMonth() + 1).padStart(2, '0')}-${String(yest.getDate()).padStart(2, '0')}`;

  const allCompletedTxs = transactions.filter(
    (tx) => (tx.status || 'COMPLETED').toUpperCase() !== 'CANCELLED'
  );

  const todayTxs = allCompletedTxs.filter((tx) => getTxDateStr(tx) === todayStr);
  const yesterdayTxs = allCompletedTxs.filter((tx) => getTxDateStr(tx) === yesterdayStr);

  // 1. Transaction Count Trend
  const todayCount = todayTxs.length;
  const yesterdayCount = yesterdayTxs.length;
  const countTrendPct =
    yesterdayCount > 0
      ? ((todayCount - yesterdayCount) / yesterdayCount) * 100
      : todayCount > 0
      ? 100
      : 0;

  // 2. Sales Revenue Trend
  const todaySales = todayTxs.reduce(
    (sum, tx) => sum + Number(tx.final_total || tx.subtotal_amount || 0),
    0
  );
  const yesterdaySales = yesterdayTxs.reduce(
    (sum, tx) => sum + Number(tx.final_total || tx.subtotal_amount || 0),
    0
  );
  const salesTrendPct =
    yesterdaySales > 0
      ? ((todaySales - yesterdaySales) / yesterdaySales) * 100
      : todaySales > 0
      ? 100
      : 0;

  // 3. Average Per Transaction Trend
  const todayAvg = todayCount > 0 ? Math.round(todaySales / todayCount) : 0;
  const yesterdayAvg = yesterdayCount > 0 ? Math.round(yesterdaySales / yesterdayCount) : 0;
  const avgTrendPct =
    yesterdayAvg > 0
      ? ((todayAvg - yesterdayAvg) / yesterdayAvg) * 100
      : todayAvg > 0
      ? 100
      : 0;

  // Trend Badge Component
  const renderTrendBadge = (pct: number) => {
    const isPositive = pct > 0;
    const isNegative = pct < 0;
    const bg = isPositive ? '#dcfce7' : isNegative ? '#fee2e2' : '#f1f5f9';
    const color = isPositive ? '#15803d' : isNegative ? '#dc2626' : '#64748b';
    const symbol = isPositive ? '▲ +' : isNegative ? '▼ ' : '- ';
    const formattedPct = Math.abs(pct).toFixed(1).replace('.', ',');

    return (
      <span
        style={{
          padding: '0.15rem 0.45rem',
          background: bg,
          color: color,
          borderRadius: '6px',
          fontSize: '0.68rem',
          fontWeight: 800,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.2rem',
          transition: 'all 0.2s ease',
        }}
      >
        vs kemarin {symbol}{formattedPct}%
      </span>
    );
  };

  // Pagination Logic
  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + pageSize);
  const getCashierName = (txOrId: any): string => {
    if (!txOrId) return _currentUser?.full_name || 'Kasir';

    let rawId = '';
    let candidateName = '';

    if (typeof txOrId === 'string') {
      rawId = txOrId;
    } else {
      candidateName = txOrId.user_name || txOrId.cashier_name || txOrId.created_by_user_name || '';
      rawId = txOrId.created_by_user_id || txOrId.user_id || txOrId.created_by || '';
    }

    if (candidateName && !candidateName.startsWith('usr-') && !candidateName.startsWith('user_')) {
      return candidateName;
    }

    if (rawId) {
      const u = (usersList || []).find((usr) => usr.user_id === rawId || usr.username === rawId);
      if (u?.full_name) return u.full_name;
      if (u?.username) return u.username;
      if (_currentUser && (_currentUser.user_id === rawId || _currentUser.username === rawId)) {
        return _currentUser.full_name;
      }
    }

    return candidateName || (rawId && !rawId.startsWith('usr-') ? rawId : '') || _currentUser?.full_name || 'Kasir';
  };

  // Cetak PDF Transaksi tanpa membekukan halaman utama POS
  const handlePrintPDF = () => {
    if (onTriggerToast)
      onTriggerToast('info', 'Export Transaksi', 'Membuka pratinjau cetak PDF...');

    const printWin = window.open('', '_blank', 'width=950,height=800');
    if (!printWin) {
      alert('Harap izinkan popup browser untuk mencetak PDF.');
      return;
    }

    try {
      printWin.opener = null;
    } catch {
      // Ignore
    }

    const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const rowsHtml = filteredTransactions
      .map(
        (tx, idx) => `
      <tr>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${idx + 1}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; font-family: monospace;">${tx.transaction_number || `TRX-${tx.transaction_id}`}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 10px;">${tx.transaction_time ? formatWaktuIndo(tx.transaction_time) : '-'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px;">${getCashierName(tx.created_by_user_id)}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px;">${tx.customer_name || 'Pelanggan Umum'}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px; font-weight: 700;">${(tx.payment_method || 'CASH').toUpperCase()}</td>
        <td style="text-align: right; border: 1px solid #cbd5e1; padding: 6px; font-weight: 800;">${formatRupiah(Number(tx.final_total || tx.subtotal_amount || 0))}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px; font-weight: 800; color: ${(tx.status || '').toUpperCase() === 'CANCELLED' ? '#dc2626' : '#047857'};">${(tx.status || 'COMPLETED').toUpperCase() === 'CANCELLED' ? 'Dibatalkan' : 'Lunas'}</td>
      </tr>
    `
      )
      .join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rekap Transaksi POS - ${todayStr}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
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
          <div class="title">REKAPITULASI TRANSAKSI PENJUALAN</div>
          <div class="subtitle">${storeName || 'Kedai POS'} | Tanggal Cetak: ${todayStr} | Periode: ${periodType}</div>
        </div>
        <div class="summary-box">
          <div class="card"><div>Total Transaksi</div><div class="card-val">${totalTransactionsCount} Tx</div></div>
          <div class="card"><div>Total Penjualan</div><div class="card-val">${formatRupiah(totalSalesAmount)}</div></div>
          <div class="card"><div>Tunai</div><div class="card-val">${formatRupiah(totalCashSales)}</div></div>
          <div class="card"><div>Non Tunai</div><div class="card-val">${formatRupiah(totalNonCashSales)}</div></div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 30px;">No</th>
              <th>No. Transaksi</th>
              <th>Hari & Waktu</th>
              <th>Kasir</th>
              <th>Pelanggan</th>
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
          window.onload = function() {
            try {
              window.print();
            } catch(e) {}
            setTimeout(function() {
              try { window.close(); } catch(e) {}
            }, 300);
          };
          window.onafterprint = function() {
            try { window.close(); } catch(e) {}
          };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '3rem' }}>
      {/* Top Header & Action Toolbar Bar */}
      <div className="tx-header-bar">
        <div>
          <h1 className="tx-header-title">
            Transaksi
          </h1>
        </div>

        {/* Search, Date Picker & Export Action Toolbar */}
        <div className="tx-toolbar-container">
          {/* Search Box */}
          <div className="tx-search-box">
            <Search
              size={16}
              color="#94a3b8"
              className="tx-search-icon"
            />
            <input
              type="text"
              placeholder="Cari transaksi..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="tx-search-input"
            />
          </div>

          <div className="tx-actions-wrapper">
            {/* Date Range Selector */}
            <div className="tx-date-select-wrapper">
              <Calendar size={15} color="#2563eb" />
              <select
                value={periodType}
                onChange={(e) => setPeriodType(e.target.value)}
                className="tx-date-select"
              >
                <option value="DAILY">Hari Ini</option>
                <option value="WEEKLY">7 Hari Terakhir</option>
                <option value="MONTHLY">Bulan Ini</option>
                <option value="YEARLY">Tahun Ini</option>
              </select>
            </div>

            {/* Export Button */}
            <button
              onClick={handlePrintPDF}
              className="tx-export-btn"
            >
              <Download size={15} />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '0.75rem 1rem',
            background: '#fef2f2',
            color: '#dc2626',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      {/* Top 5 Stat Metric Cards (Dynamic DB Realtime Sync - 2x2 Grid on Mobile, 5 Cols on Desktop) */}
      <div className="tx-kpi-grid">
        {/* Card 1: Total Transaksi */}
        <div className="tx-kpi-card card-blue">
          <div className="tx-kpi-header">
            <span className="tx-kpi-title">Total Transaksi</span>
            <div className="tx-kpi-icon-box" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <FileText size={18} color="#2563eb" />
            </div>
          </div>
          <div className="tx-kpi-body">
            <h3 className="tx-kpi-value">{totalTransactionsCount}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.35rem' }}>
              {renderTrendBadge(countTrendPct)}
            </div>
          </div>
        </div>

        {/* Card 2: Total Penjualan */}
        <div className="tx-kpi-card card-emerald">
          <div className="tx-kpi-header">
            <span className="tx-kpi-title">Total Penjualan</span>
            <div className="tx-kpi-icon-box" style={{ background: '#ecfdf5', color: '#059669' }}>
              <ShoppingBag size={18} color="#059669" />
            </div>
          </div>
          <div className="tx-kpi-body">
            <h3 className="tx-kpi-value">{formatRupiah(totalSalesAmount)}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.35rem' }}>
              {renderTrendBadge(salesTrendPct)}
            </div>
          </div>
        </div>

        {/* Card 3: Rata-rata per Transaksi */}
        <div className="tx-kpi-card card-purple">
          <div className="tx-kpi-header">
            <span className="tx-kpi-title">Rata-rata per Transaksi</span>
            <div className="tx-kpi-icon-box" style={{ background: '#f3e8ff', color: '#7e22ce' }}>
              <Package size={18} color="#7e22ce" />
            </div>
          </div>
          <div className="tx-kpi-body">
            <h3 className="tx-kpi-value">{formatRupiah(avgSalesPerTx)}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.35rem' }}>
              {renderTrendBadge(avgTrendPct)}
            </div>
          </div>
        </div>

        {/* Card 4: Pembayaran Tunai */}
        <div className="tx-kpi-card card-orange">
          <div className="tx-kpi-header">
            <span className="tx-kpi-title">Pembayaran Tunai</span>
            <div className="tx-kpi-icon-box" style={{ background: '#ffedd5', color: '#ea580c' }}>
              <Wallet size={18} color="#ea580c" />
            </div>
          </div>
          <div className="tx-kpi-body">
            <h3 className="tx-kpi-value">{formatRupiah(totalCashSales)}</h3>
            <div className="tx-kpi-subtext">{cashPct}% dari total</div>
          </div>
        </div>

        {/* Card 5: Pembayaran Non Tunai */}
        <div className="tx-kpi-card card-sky tx-kpi-card-span-mobile">
          <div className="tx-kpi-header">
            <span className="tx-kpi-title">Pembayaran Non Tunai</span>
            <div className="tx-kpi-icon-box" style={{ background: '#e0f2fe', color: '#0284c7' }}>
              <CreditCard size={18} color="#0284c7" />
            </div>
          </div>
          <div className="tx-kpi-body">
            <h3 className="tx-kpi-value">{formatRupiah(totalNonCashSales)}</h3>
            <div className="tx-kpi-subtext">{nonCashPct}% dari total</div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout (Left: Table | Right: Transaction Detail Panel) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: selectedTx ? '1fr 380px' : '1fr',
          gap: '1.25rem',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Daftar Transaksi Table Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
              Daftar Transaksi
            </h3>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>
              Total {filteredTransactions.length} Transaksi
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
              <thead>
                <tr
                  style={{
                    background: '#f8fafc',
                    color: '#64748b',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    borderBottom: '1px solid #e2e8f0',
                  }}
                >
                  <th style={{ padding: '0.85rem 1rem' }}>No. Transaksi</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Waktu</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Kasir</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Pelanggan</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Metode</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                      Memuat transaksi real-time...
                    </td>
                  </tr>
                ) : paginatedTransactions.length > 0 ? (
                  paginatedTransactions.map((tx: any, idx: number) => {
                    const isSelected = selectedTx?.transaction_id === tx.transaction_id;
                    const isCancelled = (tx.status || '').toUpperCase() === 'CANCELLED';
                    const method = (tx.payment_method || 'CASH').toUpperCase();

                    return (
                      <tr
                        key={tx.transaction_id || idx}
                        onClick={() => setSelectedTx(tx)}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: isSelected ? '#f0f9ff' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#0f172a' }}>
                          {tx.transaction_number || `TRX-${tx.transaction_id}`}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.78rem' }}>
                          {tx.transaction_time ? formatWaktuIndo(tx.transaction_time) : '-'}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#334155' }}>
                          {getCashierName(tx.created_by_user_id)}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                          {tx.customer_name || 'Pelanggan Umum'}
                        </td>
                        <td
                          style={{
                            padding: '0.85rem 1rem',
                            textAlign: 'right',
                            fontWeight: 900,
                            color: isCancelled ? '#94a3b8' : '#0f172a',
                            textDecoration: isCancelled ? 'line-through' : 'none',
                          }}
                        >
                          {formatRupiah(Number(tx.final_total || tx.subtotal_amount || 0))}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                          <span
                            style={{
                              padding: '0.25rem 0.55rem',
                              borderRadius: '6px',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              background:
                                method === 'CASH'
                                  ? '#dcfce7'
                                  : method === 'QRIS'
                                  ? '#dbeafe'
                                  : method === 'DEBIT'
                                  ? '#f3e8ff'
                                  : '#e0f2fe',
                              color:
                                method === 'CASH'
                                  ? '#15803d'
                                  : method === 'QRIS'
                                  ? '#1d4ed8'
                                  : method === 'DEBIT'
                                  ? '#7e22ce'
                                  : '#0369a1',
                            }}
                          >
                            {method === 'CASH' ? 'Tunai' : method}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                          {isCancelled ? (
                            <span
                              style={{
                                padding: '0.25rem 0.55rem',
                                borderRadius: '6px',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                background: '#fee2e2',
                                color: '#dc2626',
                              }}
                            >
                              Dibatalkan
                            </span>
                          ) : (
                            <span
                              style={{
                                padding: '0.25rem 0.55rem',
                                borderRadius: '6px',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                background: '#dcfce7',
                                color: '#16a34a',
                              }}
                            >
                              Lunas
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTx(tx);
                            }}
                            style={{
                              background: '#f1f5f9',
                              border: 'none',
                              borderRadius: '8px',
                              width: '30px',
                              height: '30px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: '#475569',
                            }}
                          >
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                      Tidak ada transaksi ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Footer Bar */}
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              fontSize: '0.8rem',
              color: '#64748b',
            }}
          >
            <div>
              Menampilkan {startIndex + 1} - {Math.min(startIndex + pageSize, filteredTransactions.length)} dari{' '}
              {filteredTransactions.length} transaksi
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '0.3rem 0.5rem',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1,
                }}
              >
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontWeight: 800, color: '#0f172a' }}>
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '0.3rem 0.5rem',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1,
                }}
              >
                <ChevronRight size={14} />
              </button>

              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: '0.3rem 0.5rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  marginLeft: '0.5rem',
                }}
              >
                <option value={10}>10 / halaman</option>
                <option value={20}>20 / halaman</option>
                <option value={50}>50 / halaman</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Persistent Detail Transaksi Side Panel (Exact Screenshot Design) */}
        {selectedTx && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              position: 'sticky',
              top: '1.5rem',
            }}
          >
            {/* Header Panel */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #f1f5f9',
                paddingBottom: '0.75rem',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  Detail Transaksi
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#2563eb' }}>
                    {selectedTx.transaction_number || `TRX-${selectedTx.transaction_id}`}
                  </span>
                  {(selectedTx.status || '').toUpperCase() === 'CANCELLED' ? (
                    <span
                      style={{
                        padding: '0.15rem 0.45rem',
                        background: '#fee2e2',
                        color: '#dc2626',
                        borderRadius: '6px',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                      }}
                    >
                      Dibatalkan
                    </span>
                  ) : (
                    <span
                      style={{
                        padding: '0.15rem 0.45rem',
                        background: '#dcfce7',
                        color: '#16a34a',
                        borderRadius: '6px',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                      }}
                    >
                      Lunas
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedTx(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Timestamp & Cashier Info */}
            <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <div>📅 {selectedTx.transaction_time ? formatWaktuIndo(selectedTx.transaction_time) : '-'}</div>
              <div>👤 Kasir: <strong style={{ color: '#0f172a' }}>{getCashierName(selectedTx.created_by_user_id)}</strong></div>
            </div>

            {/* Customer Information Card */}
            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                Informasi Pelanggan
              </span>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginTop: '0.15rem' }}>
                {selectedTx.customer_name || 'Pelanggan Umum'}
              </div>
            </div>

            {/* Purchased Items List */}
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>
                Detail Item
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                {selectedTx.items && selectedTx.items.length > 0 ? (
                  selectedTx.items.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.8rem',
                        paddingBottom: '0.35rem',
                        borderBottom: '1px dashed #e2e8f0',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{item.product_name || `Produk #${item.product_id}`}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {item.quantity || item.qty || 1} x {formatRupiah(Number(item.price || item.unit_price || 0))}
                        </div>
                      </div>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>
                        {formatRupiah(Number(item.subtotal || item.total_price || (item.price * (item.quantity || 1))))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center', padding: '0.5rem' }}>
                    Item tidak terdaftar
                  </div>
                )}
              </div>
            </div>

            {/* Financial Summary Card */}
            <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.825rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>
                  {formatRupiah(Number(selectedTx.subtotal_amount || selectedTx.final_total || 0))}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Diskon</span>
                <span style={{ fontWeight: 700, color: '#dc2626' }}>
                  - {formatRupiah(Number(selectedTx.discount_amount || 0))}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px solid #cbd5e1',
                  paddingTop: '0.4rem',
                  fontSize: '0.95rem',
                  fontWeight: 900,
                  color: '#2563eb',
                }}
              >
                <span>Total</span>
                <span>{formatRupiah(Number(selectedTx.final_total || selectedTx.subtotal_amount || 0))}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', marginTop: '0.2rem' }}>
                <span>Dibayar ({selectedTx.payment_method || 'CASH'})</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>
                  {formatRupiah(Number(selectedTx.cash_tendered || selectedTx.final_total || 0))}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 800 }}>
                <span>Kembalian</span>
                <span>{formatRupiah(Number(selectedTx.change_due || 0))}</span>
              </div>
            </div>

            {/* Payment Method Details */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                background: '#eff6ff',
                borderRadius: '10px',
                border: '1px solid #bfdbfe',
                fontSize: '0.78rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <QrCode size={18} color="#2563eb" />
                <div>
                  <div style={{ fontWeight: 800, color: '#1e40af' }}>
                    {(selectedTx.payment_method || 'CASH').toUpperCase() === 'CASH'
                      ? 'Tunai / Cash'
                      : selectedTx.payment_method}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#3b82f6' }}>No. Ref: 123456789012</div>
                </div>
              </div>
              <span style={{ padding: '0.15rem 0.4rem', background: '#2563eb', color: '#ffffff', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800 }}>
                {(selectedTx.payment_method || 'CASH').toUpperCase()}
              </span>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <button
                onClick={handlePrintPDF}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#0f172a',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                }}
              >
                <Printer size={15} />
                Cetak Struk
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Cancellation Modal integration */}
      <TransactionDetailModal
        isOpen={false}
        onClose={() => {}}
        transaction={null}
        getUserName={getCashierName}
        onTransactionCancelled={loadData}
        storeName={storeName}
      />
    </div>
  );
};
