import React, { useState, useEffect } from 'react';
import {
  FileText,
  Filter,
  Printer,
  Users,
  ShoppingBag,
  Banknote,
  QrCode,
  CreditCard,
  TrendingUp,
  X,
  ArrowRight,
  ShoppingBag as BagIcon,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { apiService } from '../services/api';
import { User } from '../types';
import { formatRupiah, formatWaktuIndo, formatDateIndoFull } from '../utils/formatters';
import { CashierBadge } from '../components/common/CashierBadge';
import { TransactionDetailModal } from '../components/common/TransactionDetailModal';
import { exportShiftToExcel, printShiftPDF, formatShiftDurationText } from '../utils/shiftReportExporter';
import { exportStockToExcel, printStockPDF } from '../utils/stockReportExporter';
import { getStoredBrandingProfile } from '../utils/storeBrandingHelper';

interface DonutSegment {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

const SVGDonutChart: React.FC<{ segments: DonutSegment[] }> = ({ segments }) => {
  const radius = 36;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  const validSegments = (segments || []).filter((s) => (s.value || 0) > 0 || (s.percentage || 0) > 0);
  const hasData = validSegments.length > 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', width: '100%', padding: '0.4rem 0' }}>
      {/* SVG Donut Ring Graphic */}
      <div style={{ position: 'relative', width: '115px', height: '115px', flexShrink: 0, margin: '0 auto' }}>
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          {/* Neutral Background Circle Ring */}
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
          {!hasData ? (
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#cbd5e1" strokeWidth={strokeWidth} strokeDasharray="3 3" />
          ) : (
            validSegments.map((seg, idx) => {
              const dashArray = `${(seg.percentage / 100) * circumference} ${circumference}`;
              const strokeOffset = -((accumulatedPercent / 100) * circumference);
              accumulatedPercent += seg.percentage;
              return (
                <circle
                  key={idx}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={dashArray}
                  strokeDashoffset={strokeOffset}
                  style={{ transition: 'all 0.4s ease' }}
                />
              );
            })
          )}
          {/* Donut Center Hole */}
          <circle cx="50" cy="50" r={radius - strokeWidth / 2 - 1} fill="#ffffff" />
        </svg>

        {/* Center Donut Badge Label */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {hasData ? 'ITEM' : 'POS'}
          </span>
          <span style={{ fontSize: '0.78rem', fontWeight: 900, color: hasData ? '#0f172a' : '#64748b' }}>
            {hasData ? `${validSegments.length} Data` : '0%'}
          </span>
        </div>
      </div>

      {/* Legend Column List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', flex: 1, minWidth: 0 }}>
        {segments.map((seg, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: seg.value > 0 ? seg.color : '#cbd5e1', flexShrink: 0 }} />
              <span style={{ fontWeight: 700, color: seg.value > 0 ? '#334155' : '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {seg.name}
              </span>
            </div>
            <div style={{ fontWeight: 800, color: seg.value > 0 ? '#0f172a' : '#94a3b8', marginLeft: '0.5rem', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
              {formatRupiah(seg.value)} <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>({seg.percentage.toFixed(1)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface SVGLineChartProps {
  transactions?: any[];
  chartMode?: 'Per Jam' | 'Harian';
}

const SVGLineChart: React.FC<SVGLineChartProps> = ({ transactions = [], chartMode = 'Per Jam' }) => {
  const width = 360;
  const height = 145;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const formatShortDate = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  let labels: string[] = [];
  let pointsCurrent: number[] = [];
  let pointsPrev: number[] = [];

  if (chartMode === 'Per Jam') {
    labels = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
    pointsCurrent = new Array(8).fill(0);
    pointsPrev = new Array(8).fill(0);

    transactions.forEach((tx: any) => {
      if (!tx.transaction_time && !tx.created_at) return;
      const txDateObj = new Date(tx.transaction_time || tx.created_at);
      const dateStr = txDateObj.toISOString().split('T')[0];
      const hour = txDateObj.getHours();
      const amount = Number(tx.final_total || tx.subtotal_amount || 0);

      const slotIndex = Math.min(Math.floor(hour / 3), 7);

      if (dateStr === todayStr) {
        pointsCurrent[slotIndex] += amount;
      } else if (dateStr === yesterdayStr) {
        pointsPrev[slotIndex] += amount;
      } else {
        pointsCurrent[slotIndex] += amount;
      }
    });
  } else {
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    labels = [];
    pointsCurrent = new Array(7).fill(0);
    pointsPrev = new Array(7).fill(0);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      labels.push(dayNames[d.getDay()]);
    }

    transactions.forEach((tx: any) => {
      if (!tx.transaction_time && !tx.created_at) return;
      const txDateObj = new Date(tx.transaction_time || tx.created_at);
      const amount = Number(tx.final_total || tx.subtotal_amount || 0);
      const diffDays = Math.floor((now.getTime() - txDateObj.getTime()) / (1000 * 3600 * 24));
      
      if (diffDays >= 0 && diffDays < 7) {
        const index = 6 - diffDays;
        pointsCurrent[index] += amount;
      } else if (diffDays >= 7 && diffDays < 14) {
        const index = 13 - diffDays;
        pointsPrev[index] += amount;
      }
    });
  }

  const maxRaw = Math.max(...pointsCurrent, ...pointsPrev, 100000);
  const isMillions = maxRaw >= 1000000;
  const divisor = isMillions ? 1000000 : 1000;
  const unitLabel = isMillions ? 'Jt' : 'Rb';

  const pointsCurrentScaled = pointsCurrent.map((v) => v / divisor);
  const pointsPrevScaled = pointsPrev.map((v) => v / divisor);
  const maxScaled = Math.max(...pointsCurrentScaled, ...pointsPrevScaled, 1);
  const roundedMaxY = Math.ceil(maxScaled * 1.15);

  const getCoordinates = (pts: number[]) => {
    const maxX = pts.length - 1;
    return pts
      .map((val, idx) => {
        const x = (idx / (maxX || 1)) * (width - 45) + 40;
        const y = height - 25 - (val / (roundedMaxY || 1)) * (height - 35);
        return `${x},${y}`;
      })
      .join(' ');
  };

  const pathCurrent = getCoordinates(pointsCurrentScaled);
  const pathPrev = getCoordinates(pointsPrevScaled);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ position: 'relative', width: '100%', height: '140px' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%' }}>
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((step, idx) => {
            const valNum = Math.round(roundedMaxY * step * 10) / 10;
            const y = height - 25 - step * (height - 35);
            return (
              <g key={idx}>
                <line x1="40" y1={y} x2={width} y2={y} stroke="#f1f5f9" strokeDasharray="3 3" />
                <text x="0" y={y + 3} fontSize="7" fill="#94a3b8" fontWeight="700">
                  {valNum === 0 ? 'Rp 0' : `Rp ${valNum} ${unitLabel}`}
                </text>
              </g>
            );
          })}

          <polyline fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" points={pathPrev} />
          <polygon fill="url(#chartGrad)" points={`40,${height - 25} ${pathCurrent} ${width},${height - 25}`} />
          <polyline fill="none" stroke="#2563eb" strokeWidth="2.5" points={pathCurrent} />

          {pointsCurrentScaled.map((val, idx) => {
            const x = (idx / (pointsCurrentScaled.length - 1 || 1)) * (width - 45) + 40;
            const y = height - 25 - (val / (roundedMaxY || 1)) * (height - 35);
            return <circle key={idx} cx={x} cy={y} r="3.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />;
          })}

          {labels.map((label, idx) => {
            const x = (idx / (labels.length - 1 || 1)) * (width - 45) + 40;
            return (
              <text key={idx} x={x} y={height - 6} fontSize="7.5" fill="#64748b" textAnchor="middle" fontWeight="700">
                {label}
              </text>
            );
          })}
        </svg>
      </div>

      <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', fontSize: '0.725rem', marginTop: '0.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#2563eb' }}>
          <span style={{ width: '12px', height: '3px', background: '#2563eb', borderRadius: '2px' }} />
          {formatShortDate(now)} ({chartMode === 'Per Jam' ? 'Hari Ini' : 'Minggu Ini'})
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: '#94a3b8' }}>
          <span style={{ width: '12px', height: '2px', borderTop: '2px dashed #cbd5e1' }} />
          {formatShortDate(yesterday)} ({chartMode === 'Per Jam' ? 'Kemarin' : 'Minggu Lalu'})
        </div>
      </div>
    </div>
  );
};

interface ReportsPageProps {
  currentUser: User;
  storeName?: string;
  onTriggerToast?: (type: 'success' | 'danger' | 'info' | 'warning', title: string, message: string) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ currentUser, storeName, onTriggerToast }) => {
  const [periodType, setPeriodType] = useState<string>('DAILY');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<string>('ALL');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('ALL');
  const [lineChartMode, setLineChartMode] = useState<'Per Jam' | 'Harian'>('Per Jam');

  // Sub-Tab Switcher State: Laporan Shift & Penjualan vs Laporan Stok & Inventaris vs Riwayat Sesi Shift
  const [activeReportSubTab, setActiveReportSubTab] = useState<'SHIFT_SALES' | 'STOCKS_LOG' | 'SHIFT_HISTORY'>('SHIFT_SALES');
  const [stockList, setStockList] = useState<any[]>([]);
  const [stockAuditLogs, setStockAuditLogs] = useState<any[]>([]);
  const [expenseList, setExpenseList] = useState<any[]>([]);

  // Shift History State
  const [shiftHistoryList, setShiftHistoryList] = useState<any[]>([]);
  const [loadingShiftHistory, setLoadingShiftHistory] = useState<boolean>(false);
  const [printingShiftId, setPrintingShiftId] = useState<string | null>(null);

  const loadShiftHistory = async () => {
    setLoadingShiftHistory(true);
    try {
      const history = await apiService.getShiftHistory();
      setShiftHistoryList(history || []);
    } catch (err: any) {
      console.error('Gagal memuat riwayat shift:', err);
    } finally {
      setLoadingShiftHistory(false);
    }
  };

  useEffect(() => {
    if (activeReportSubTab === 'SHIFT_HISTORY') {
      loadShiftHistory();
    }
  }, [activeReportSubTab]);

  const handlePrintSpecificShift = async (shiftId: string) => {
    try {
      setPrintingShiftId(shiftId);
      const details = await apiService.getShiftDetails(shiftId);
      if (!details || !details.shift) {
        throw new Error('Data shift tidak ditemukan');
      }

      const s = details.shift;
      const dutyUsers = details.shift_users && details.shift_users.length > 0
        ? details.shift_users.map((u: any) => u.full_name || u.user_id)
        : (s.duty_staff_names ? String(s.duty_staff_names).split(',').map((n: string) => n.trim()) : [details.opened_by_user_name]);

      printShiftPDF({
        storeName: storeName || 'Kedai POS',
        dateStr: s.start_time ? formatDateIndoFull(s.start_time) : '-',
        shiftId: s.shift_category || s.shift_id,
        dutyUsers,
        currentUserFullName: details.opened_by_user_name || currentUser.full_name,
        transactions: details.transactions || [],
        expenses: details.expenses || [],
        startTime: s.start_time,
        endTime: s.end_time,
      });

      if (onTriggerToast) {
        onTriggerToast('success', 'Struk Shift Dicetak', `Struk untuk ${s.shift_category || s.shift_id} berhasil dicetak.`);
      }
    } catch (err: any) {
      if (onTriggerToast) {
        onTriggerToast('danger', 'Gagal Cetak Shift', err.message || 'Gagal memuat data detail shift');
      }
    } finally {
      setPrintingShiftId(null);
    }
  };

  const handleExportSpecificShiftExcel = async (shiftId: string) => {
    try {
      setPrintingShiftId(shiftId);
      const details = await apiService.getShiftDetails(shiftId);
      if (!details || !details.shift) {
        throw new Error('Data shift tidak ditemukan');
      }

      const s = details.shift;
      const dutyUsers = details.shift_users && details.shift_users.length > 0
        ? details.shift_users.map((u: any) => u.full_name || u.user_id)
        : (s.duty_staff_names ? String(s.duty_staff_names).split(',').map((n: string) => n.trim()) : [details.opened_by_user_name]);

      exportShiftToExcel({
        storeName: storeName || 'Kedai POS',
        dateStr: s.start_time ? formatDateIndoFull(s.start_time) : '-',
        shiftId: s.shift_category || s.shift_id,
        dutyUsers,
        currentUserFullName: details.opened_by_user_name || currentUser.full_name,
        transactions: details.transactions || [],
        expenses: details.expenses || [],
        startTime: s.start_time,
        endTime: s.end_time,
      });

      if (onTriggerToast) {
        onTriggerToast('success', 'Excel Shift Diunduh', `Laporan Excel untuk ${s.shift_category || s.shift_id} berhasil diunduh.`);
      }
    } catch (err: any) {
      if (onTriggerToast) {
        onTriggerToast('danger', 'Gagal Export Excel', err.message || 'Gagal memuat data detail shift');
      }
    } finally {
      setPrintingShiftId(null);
    }
  };

  // Pagination State for Laporan Inventaris Stok & Pergerakan Barang
  const [stockCurrentPage, setStockCurrentPage] = useState<number>(1);
  const [stockItemsPerPage, setStockItemsPerPage] = useState<number>(10);

  const totalStockItems = stockList.length;
  const totalStockPages = Math.max(1, Math.ceil(totalStockItems / stockItemsPerPage));
  const stockStartIndex = (stockCurrentPage - 1) * stockItemsPerPage;
  const stockEndIndex = Math.min(totalStockItems, stockStartIndex + stockItemsPerPage);
  const paginatedStockList = stockList.slice(stockStartIndex, stockEndIndex);

  const [usersList, setUsersList] = useState<User[]>([]);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Confirmation modal state for deleting employee performance row
  const [confirmDeleteEmp, setConfirmDeleteEmp] = useState<any | null>(null);

  // Detail Modal & Cancel Transaction State
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  // Additional Interactive Detail Modals
  const [showAllTxModal, setShowAllTxModal] = useState(false);
  const [showAllProductsModal, setShowAllProductsModal] = useState(false);
  const [showProfitLossModal, setShowProfitLossModal] = useState(false);

  const getHiddenEmployeeIds = (): string[] => {
    try {
      const raw = localStorage.getItem('pos_hidden_employee_performance_ids');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveHiddenEmployeeId = (userId: string) => {
    const current = getHiddenEmployeeIds();
    if (!current.includes(userId)) {
      const updated = [...current, userId];
      localStorage.setItem('pos_hidden_employee_performance_ids', JSON.stringify(updated));
    }
  };

  const handleRestoreHiddenEmployees = () => {
    localStorage.removeItem('pos_hidden_employee_performance_ids');
    loadReport();
    if (onTriggerToast) {
      onTriggerToast('info', 'Data Dipulihkan', 'Seluruh rekap performa kasir telah ditampilkan kembali.');
    }
  };

  const loadUsers = async () => {
    try {
      const users = await apiService.getUsers();
      setUsersList(users);
    } catch {
      // Ignored if non-owner
    }
  };

  const getCashierName = (txOrId: any): string => {
    if (!txOrId) return currentUser?.full_name || 'Kasir';

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
      if (currentUser && (currentUser.user_id === rawId || currentUser.username === rawId)) {
        return currentUser.full_name;
      }
    }

    return candidateName || (rawId && !rawId.startsWith('usr-') ? rawId : '') || currentUser?.full_name || 'Kasir';
  };

  const getDutyUsersList = () => {
    const set = new Set<string>();
    const txs = reportData?.transactions || [];
    txs.forEach((tx: any) => {
      if (tx.created_by_user_id) {
        const u = usersList.find((usr) => usr.user_id === tx.created_by_user_id);
        if (u?.full_name) set.add(u.full_name);
      }
      if (tx.created_by_user_name && !tx.created_by_user_name.startsWith('usr-')) {
        set.add(tx.created_by_user_name);
      }
    });
    return set.size > 0 ? Array.from(set) : [currentUser.full_name];
  };

  const getExportDateStr = (exportTxs: any[]) => {
    if (periodType === 'DAILY') {
      return formatDateIndoFull(new Date());
    }
    if (exportTxs.length > 0 && (exportTxs[0].transaction_time || exportTxs[0].created_at)) {
      try {
        const rawDate = exportTxs[0].transaction_time || exportTxs[0].created_at;
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          return formatDateIndoFull(d);
        }
      } catch {}
    }
    return formatDateIndoFull(new Date());
  };

  const handleExportExcel = () => {
    if (activeReportSubTab === 'STOCKS_LOG') {
      exportStockToExcel(stockList, stockAuditLogs, storeName);
    } else {
      const activeUserFilter = selectedUser || (currentUser.role !== 'OWNER' && !currentUser.is_pj ? currentUser.user_id : '');
      const exportTxs = activeUserFilter
        ? (reportData?.transactions || []).filter((tx: any) => tx.created_by_user_id === activeUserFilter || tx.created_by === activeUserFilter || tx.user_id === activeUserFilter)
        : (reportData?.transactions || []);

      const rawExps = (reportData?.expenses && Array.isArray(reportData.expenses)) ? reportData.expenses : expenseList;
      const exportExps = activeUserFilter
        ? (rawExps || []).filter((exp: any) => exp.recorded_by_user_id === activeUserFilter || exp.created_by_user_id === activeUserFilter || exp.user_id === activeUserFilter || exp.recorded_by === activeUserFilter)
        : (rawExps || []);

      const activeUserObj = usersList.find((u) => u.user_id === activeUserFilter);
      const allDuty = getDutyUsersList();
      if (activeUserObj && !allDuty.includes(activeUserObj.full_name)) {
        allDuty.unshift(activeUserObj.full_name);
      }

      exportShiftToExcel({
        storeName: storeName || 'Kedai POS',
        dateStr: getExportDateStr(exportTxs),
        shiftId: periodType === 'DAILY' ? 'Hari Ini' : `Periode ${periodType}`,
        dutyUsers: allDuty,
        currentUserFullName: activeUserObj?.full_name || currentUser.full_name,
        transactions: exportTxs,
        expenses: exportExps,
      });
    }
  };

  const loadReport = async (overrideUserId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {
        period_type: periodType,
        business_unit: selectedBusinessUnit,
        payment_method: selectedPaymentMethod,
      };

      const activeUserId = overrideUserId !== undefined ? overrideUserId : selectedUser;
      if (activeUserId) params.user_id = activeUserId;
      if (periodType === 'CUSTOM') {
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
      }

      const [data, stocksData, logsData, expensesData] = await Promise.all([
        apiService.getSalesReport(params),
        apiService.getStocks().catch(() => []),
        apiService.getAuditLogs().catch(() => []),
        apiService.getExpenses().catch(() => []),
      ]);

      const hiddenIds = getHiddenEmployeeIds();
      if (data && Array.isArray(data.employee_performance) && hiddenIds.length > 0) {
        data.employee_performance = data.employee_performance.filter(
          (emp: any) => !hiddenIds.includes(emp.user_id)
        );
      }

      setReportData(data);
      setStockList(stocksData || []);
      setStockAuditLogs(logsData || []);
      setExpenseList((data && Array.isArray(data.expenses) && data.expenses.length > 0) ? data.expenses : (expensesData || []));
    } catch (err: any) {
      setError(err.message || 'Gagal memuat laporan penjualan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    if (currentUser && currentUser.role !== 'OWNER' && !currentUser.is_pj) {
      setSelectedUser(currentUser.user_id);
      loadReport(currentUser.user_id);
    } else {
      loadReport();
    }
  }, []);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    loadReport();
  };

  const handlePrintPDF = () => {
    if (activeReportSubTab === 'STOCKS_LOG') {
      printStockPDF(stockList, stockAuditLogs, storeName);
    } else {
      const activeUserFilter = selectedUser || (currentUser.role !== 'OWNER' && !currentUser.is_pj ? currentUser.user_id : '');
      const exportTxs = activeUserFilter
        ? (reportData?.transactions || []).filter((tx: any) => tx.created_by_user_id === activeUserFilter || tx.created_by === activeUserFilter || tx.user_id === activeUserFilter)
        : (reportData?.transactions || []);

      const rawExps = (reportData?.expenses && Array.isArray(reportData.expenses)) ? reportData.expenses : expenseList;
      const exportExps = activeUserFilter
        ? (rawExps || []).filter((exp: any) => exp.recorded_by_user_id === activeUserFilter || exp.created_by_user_id === activeUserFilter || exp.user_id === activeUserFilter || exp.recorded_by === activeUserFilter)
        : (rawExps || []);

      const activeUserObj = usersList.find((u) => u.user_id === activeUserFilter);
      const allDuty = getDutyUsersList();
      if (activeUserObj && !allDuty.includes(activeUserObj.full_name)) {
        allDuty.unshift(activeUserObj.full_name);
      }

      printShiftPDF({
        storeName: storeName || 'Kedai POS',
        dateStr: getExportDateStr(exportTxs),
        shiftId: periodType === 'DAILY' ? 'Hari Ini' : `Periode ${periodType}`,
        dutyUsers: allDuty,
        currentUserFullName: activeUserObj?.full_name || currentUser.full_name,
        transactions: exportTxs,
        expenses: exportExps,
      });
    }
  };




  const summary = reportData?.summary;
  const transactions = reportData?.transactions || [];

  // Calculate breakdown by Payment Method under active filters
  const totalCash = transactions.filter((t: any) => (t.payment_method || '').toUpperCase() === 'CASH').reduce((sum: number, t: any) => sum + Number(t.final_total || t.subtotal_amount || 0), 0);
  const totalQris = transactions.filter((t: any) => (t.payment_method || '').toUpperCase() === 'QRIS').reduce((sum: number, t: any) => sum + Number(t.final_total || t.subtotal_amount || 0), 0);
  const totalTransfer = transactions.filter((t: any) => (t.payment_method || '').toUpperCase() === 'TRANSFER').reduce((sum: number, t: any) => sum + Number(t.final_total || t.subtotal_amount || 0), 0);
  const totalDebit = transactions.filter((t: any) => ['DEBIT', 'CARD', 'KARTU'].includes((t.payment_method || '').toUpperCase())).reduce((sum: number, t: any) => sum + Number(t.final_total || t.subtotal_amount || 0), 0);

  // Dynamic Category Breakdown from Real Database Transactions
  const categoryMapUI: Record<string, number> = {};
  transactions.forEach((tx: any) => {
    if (tx.items && Array.isArray(tx.items)) {
      tx.items.forEach((it: any) => {
        const cat = it.category_name || it.category || 'Umum';
        const sub = Number(it.subtotal || it.total_price || (Number(it.unit_price || 0) * Number(it.quantity || it.qty || 1)));
        categoryMapUI[cat] = (categoryMapUI[cat] || 0) + sub;
      });
    }
  });

  const catColors = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];
  const totalCatSumUI = Object.values(categoryMapUI).reduce((a, b) => a + b, 0);
  const dynamicCategorySegments: DonutSegment[] = Object.entries(categoryMapUI)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], idx) => ({
      name,
      value,
      color: catColors[idx % catColors.length],
      percentage: totalCatSumUI > 0 ? Math.round((value / totalCatSumUI) * 1000) / 10 : 0,
    }));

  // Dynamic Top Products Breakdown from Real Database Transactions
  const productMapUI: Record<string, { name: string; qty: number; omzet: number }> = {};
  transactions.forEach((tx: any) => {
    if (tx.items && Array.isArray(tx.items)) {
      tx.items.forEach((it: any) => {
        const name = it.product_name || it.name || 'Produk';
        if (!productMapUI[name]) productMapUI[name] = { name, qty: 0, omzet: 0 };
        const q = Number(it.quantity || it.qty || 1);
        const sub = Number(it.subtotal || it.total_price || (Number(it.unit_price || 0) * q));
        productMapUI[name].qty += q;
        productMapUI[name].omzet += sub;
      });
    }
  });

  const dynamicTopProductsList = Object.values(productMapUI).sort((a, b) => b.qty - a.qty);

  // Financial Calculations for Card 6 (Laba Rugi)
  const totalSalesNetUI = Number(summary?.total_net_sales ?? summary?.total_gross_sales ?? transactions.reduce((a: number, b: any) => a + Number(b.final_total || 0), 0));
  let calculatedHppUI = Number(summary?.total_cogs || summary?.total_hpp || 0);
  if (!calculatedHppUI && totalSalesNetUI > 0) {
    let itemHpp = 0;
    transactions.forEach((tx: any) => {
      if (tx.items && Array.isArray(tx.items)) {
        tx.items.forEach((it: any) => {
          itemHpp += Number(it.cost_price || it.harga_modal || 0) * Number(it.quantity || it.qty || 1);
        });
      }
    });
    calculatedHppUI = itemHpp > 0 ? itemHpp : Math.round(totalSalesNetUI * 0.60);
  }
  const totalExpenseValUI = Number(summary?.total_expenses || 0);
  const grossProfitValUI = Math.max(0, totalSalesNetUI - calculatedHppUI);
  const netProfitValUI = Math.max(0, grossProfitValUI - totalExpenseValUI);
  const marginPctValUI = totalSalesNetUI > 0 ? ((netProfitValUI / totalSalesNetUI) * 100).toFixed(1) + '%' : '0%';


  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Header Kop Surat Dokumen Resmi saat di-print ke PDF */}
      <div className="print-only" style={{ marginBottom: '1.5rem', borderBottom: '2px solid #0f172a', paddingBottom: '1rem' }}>
        {(() => {
          const profile = getStoredBrandingProfile();
          const activeStoreName = storeName || profile.name || 'POS KASIR';
          return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {profile.logoUrl && (
                    <img src={profile.logoUrl} alt={activeStoreName} style={{ height: '24px', maxWidth: '42px', objectFit: 'contain', verticalAlign: 'middle', display: 'inline-block' }} />
                  )}
                  <h1 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0, color: '#0f172a', textTransform: 'uppercase', display: 'inline-block' }}>
                    {activeStoreName}
                  </h1>
                </div>
                {profile.address && <p style={{ fontSize: '0.8rem', margin: '2px 0 0 0', color: '#475569', fontWeight: 600 }}>{profile.address}</p>}
                {profile.phone && <p style={{ fontSize: '0.75rem', margin: '1px 0 0 0', color: '#64748b' }}>Telp: {profile.phone}</p>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0, color: '#2563eb', textTransform: 'uppercase' }}>
                  LAPORAN PENJUALAN RESMI ({periodType})
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '3px 0 0 0', fontWeight: 600 }}>
                  Cetak: {new Date().toLocaleString('id-ID')} | Petugas: {currentUser.full_name}
                </p>
              </div>
            </div>
          );
        })()}
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '12px', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* Form Bar Filter Laporan (RESPONSIVE: 2 ATAS 2 BAWAH DI HP, CENTERED BUTTON) */}
      <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '1.5rem' }}>
        <form onSubmit={handleApplyFilter} className="responsive-filter-form">
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>Periode Waktu:</label>
            <select
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value)}
              style={{ width: '100%', padding: '0.55rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}
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
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>Dari Tanggal:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>Sampai Tanggal:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}
                />
              </div>
            </>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>Filter Kasir / Pengguna:</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              style={{ width: '100%', padding: '0.55rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}
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
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>Bidang Usaha:</label>
            <select
              value={selectedBusinessUnit}
              onChange={(e) => setSelectedBusinessUnit(e.target.value)}
              style={{ width: '100%', padding: '0.55rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}
            >
              <option value="ALL">Semua Bidang Usaha</option>
              <option value="FC_PRINT">Fotokopi & Printing</option>
              <option value="FNB">Food & Beverage (FNB)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>Metode Bayar:</label>
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              style={{ width: '100%', padding: '0.55rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}
            >
              <option value="ALL">Semua Metode</option>
              <option value="CASH">CASH / Tunai</option>
              <option value="QRIS">QRIS Non-Tunai</option>
              <option value="TRANSFER">Transfer Bank</option>
            </select>
          </div>

          <div className="responsive-filter-submit">
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.65rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              }}
            >
              <Filter size={16} />
              {loading ? 'Proses...' : 'Terapkan Filter'}
            </button>
          </div>
        </form>
      </div>

      {/* Featured Banner Card: Total Omzet Penjualan */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          padding: '1.25rem 1.5rem',
          borderRadius: '20px',
          border: '1px solid #334155',
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1rem',
        }}
      >
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <TrendingUp size={16} color="#38bdf8" />
            Total Omzet Penjualan
          </div>
          <h3 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, color: '#ffffff' }}>{formatRupiah(summary?.total_net_sales || summary?.total_gross_sales || 0)}</h3>
        </div>
        <div style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 700, background: 'rgba(56, 189, 248, 0.12)', padding: '0.4rem 0.85rem', borderRadius: '10px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
          {summary?.total_transactions || 0} Transaksi Selesai
        </div>
      </div>

      {/* 4 Summary Metric Cards (2x2 Grid on Mobile, 4 Columns on Laptop/Desktop) */}
      <div className="responsive-summary-2x2-grid">
        {/* Card 1: Jumlah Transaksi */}
        <div
          style={{
            background: '#ffffff',
            padding: '1rem',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShoppingBag size={14} color="#6366f1" />
              Total Transaksi
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: '#0f172a' }}>{summary?.total_transactions || 0} Transaksi</h3>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.65rem', fontWeight: 600 }}>
            Nota Terfilter
          </div>
        </div>

        {/* Card 2: Tunai / Cash (HIJAU) */}
        <div
          style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            padding: '1rem',
            borderRadius: '16px',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#047857', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Banknote size={15} color="#059669" />
              Pembayaran Tunai
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: '#065f46' }}>{formatRupiah(totalCash)}</h3>
          </div>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#047857', marginTop: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            <span style={{ padding: '0.15rem 0.4rem', background: '#10b981', color: '#fff', borderRadius: '5px', fontSize: '0.6rem' }}>TUNAI</span>
            <span>Uang Fisik Kasir</span>
          </div>
        </div>

        {/* Card 3: QRIS Non-Tunai (BIRU) */}
        <div
          style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            padding: '1rem',
            borderRadius: '16px',
            boxShadow: '0 4px 16px rgba(37, 99, 235, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1d4ed8', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <QrCode size={15} color="#2563eb" />
              QRIS Non-Tunai
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: '#1e40af' }}>{formatRupiah(totalQris)}</h3>
          </div>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#1d4ed8', marginTop: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            <span style={{ padding: '0.15rem 0.4rem', background: '#2563eb', color: '#fff', borderRadius: '5px', fontSize: '0.6rem' }}>QRIS</span>
            <span>Scan Kode E-Wallet/Bank</span>
          </div>
        </div>

        {/* Card 4: Transfer Bank (KUNING) */}
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            padding: '1rem',
            borderRadius: '16px',
            boxShadow: '0 4px 16px rgba(245, 158, 11, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#b45309', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CreditCard size={15} color="#d97706" />
              Transfer Bank
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: '#92400e' }}>{formatRupiah(totalTransfer)}</h3>
          </div>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#b45309', marginTop: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            <span style={{ padding: '0.15rem 0.4rem', background: '#f59e0b', color: '#fff', borderRadius: '5px', fontSize: '0.6rem' }}>TRANSFER</span>
            <span>Direct Bank Rekening</span>
          </div>
        </div>
      </div>

      {/* RESPONSIVE CONTROL BAR: Sub-Tabs & Export Actions (No horizontal scroll, wraps cleanly on mobile) */}
      <div className="responsive-control-bar">
        {/* Left Side: Sub-Tab Navigation Switcher */}
        <div className="responsive-tab-group">
          <button
            type="button"
            onClick={() => setActiveReportSubTab('SHIFT_SALES')}
            className="responsive-tab-button"
            style={{
              border: activeReportSubTab === 'SHIFT_SALES' ? '1px solid #cbd5e1' : 'none',
              background: activeReportSubTab === 'SHIFT_SALES' ? '#ffffff' : 'transparent',
              color: activeReportSubTab === 'SHIFT_SALES' ? '#2563eb' : '#64748b',
              boxShadow: activeReportSubTab === 'SHIFT_SALES' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <FileText size={15} color={activeReportSubTab === 'SHIFT_SALES' ? '#2563eb' : '#64748b'} />
            Laporan Shift & Penjualan
          </button>

          <button
            type="button"
            onClick={() => setActiveReportSubTab('STOCKS_LOG')}
            className="responsive-tab-button"
            style={{
              border: activeReportSubTab === 'STOCKS_LOG' ? '1px solid #cbd5e1' : 'none',
              background: activeReportSubTab === 'STOCKS_LOG' ? '#ffffff' : 'transparent',
              color: activeReportSubTab === 'STOCKS_LOG' ? '#2563eb' : '#64748b',
              boxShadow: activeReportSubTab === 'STOCKS_LOG' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <ShoppingBag size={15} color={activeReportSubTab === 'STOCKS_LOG' ? '#2563eb' : '#64748b'} />
            Laporan Stok & Restok
          </button>

          <button
            type="button"
            onClick={() => setActiveReportSubTab('SHIFT_HISTORY')}
            className="responsive-tab-button"
            style={{
              border: activeReportSubTab === 'SHIFT_HISTORY' ? '1px solid #cbd5e1' : 'none',
              background: activeReportSubTab === 'SHIFT_HISTORY' ? '#ffffff' : 'transparent',
              color: activeReportSubTab === 'SHIFT_HISTORY' ? '#2563eb' : '#64748b',
              boxShadow: activeReportSubTab === 'SHIFT_HISTORY' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <Clock size={15} color={activeReportSubTab === 'SHIFT_HISTORY' ? '#2563eb' : '#64748b'} />
            Riwayat Sesi Shift
          </button>
        </div>

        {/* Right Side: Export & Print Action Buttons */}
        <div className="responsive-action-group">
          <button
            onClick={handleExportExcel}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.825rem',
              fontWeight: 700,
              padding: '0.5rem 0.9rem',
              background: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            <FileText size={15} color="#059669" />
            Export Excel
          </button>

          <button
            onClick={handlePrintPDF}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.825rem',
              fontWeight: 800,
              padding: '0.5rem 1rem',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            <Printer size={15} />
            Cetak PDF
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '12px', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>
          {error}
        </div>
      )}



      {activeReportSubTab === 'SHIFT_HISTORY' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🕒 Riwayat Sesi Shift Kasir (Shift History)
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
                  Daftar seluruh sesi shift yang pernah dibuka & ditutup. Gunakan fitur cetak ulang jika kasir lupa mencetak struk saat penutupan shift.
                </p>
              </div>
              <button
                type="button"
                onClick={loadShiftHistory}
                style={{
                  padding: '0.5rem 0.9rem',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#334155',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                🔄 Refresh Shift
              </button>
            </div>

            {loadingShiftHistory ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                Memuat riwayat sesi shift...
              </div>
            ) : shiftHistoryList.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                Belum ada riwayat sesi shift yang dicatat di database.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569', textTransform: 'uppercase', fontSize: '0.72rem', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Sesi & Tanggal Shift</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Kasir Lead / PJ</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Tim Bertugas</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Jam Operasional</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Status</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Total Omzet</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Pengeluaran Kas</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Setoran Murni</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Aksi Struk Snapshot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shiftHistoryList.map((shift: any) => {
                      const isActive = shift.shift_status === 'ACTIVE';
                      const isPrintingThis = printingShiftId === shift.shift_id;
                      const durationStr = formatShiftDurationText(shift.start_time, shift.end_time);

                      return (
                        <tr key={shift.shift_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.75rem 0.5rem', fontWeight: 800, color: '#0f172a' }}>
                            <div>{shift.shift_category || 'Shift Pagi'}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>
                              {shift.start_time ? formatDateIndoFull(shift.start_time) : '-'}
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <CashierBadge name={shift.opened_by_user_name || shift.opened_by_user_id} role="LEAD" size="sm" />
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.78rem', color: '#334155' }}>
                            {shift.duty_staff_names || shift.opened_by_user_name || '-'}
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.78rem', color: '#475569' }}>
                            {durationStr || (shift.start_time ? formatWaktuIndo(shift.start_time) : '-')}
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                            <span
                              style={{
                                padding: '0.2rem 0.6rem',
                                borderRadius: '999px',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                background: isActive ? '#dcfce7' : '#f1f5f9',
                                color: isActive ? '#15803d' : '#64748b',
                                border: isActive ? '1px solid #86efac' : '1px solid #cbd5e1',
                              }}
                            >
                              {isActive ? '● ACTIVE' : 'CLOSED'}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 800, color: '#2563eb' }}>
                            {formatRupiah(shift.total_sales || 0)}
                            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>{shift.transaction_count || 0} tx</div>
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 800, color: '#dc2626' }}>
                            -{formatRupiah(shift.total_expenses || 0)}
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 900, color: '#047857' }}>
                            {formatRupiah(shift.net_setoran || 0)}
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                              <button
                                type="button"
                                disabled={isPrintingThis}
                                onClick={() => handlePrintSpecificShift(shift.shift_id)}
                                title="Cetak Ulang Struk Shift Spesifik"
                                style={{
                                  padding: '0.35rem 0.65rem',
                                  borderRadius: '8px',
                                  border: '1px solid #059669',
                                  background: '#ecfdf5',
                                  color: '#047857',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                }}
                              >
                                <Printer size={13} />
                                {isPrintingThis ? 'Proses...' : 'Cetak Struk'}
                              </button>
                              <button
                                type="button"
                                disabled={isPrintingThis}
                                onClick={() => handleExportSpecificShiftExcel(shift.shift_id)}
                                title="Export Excel Sesi Shift Spesifik"
                                style={{
                                  padding: '0.35rem 0.65rem',
                                  borderRadius: '8px',
                                  border: '1px solid #cbd5e1',
                                  background: '#ffffff',
                                  color: '#334155',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                }}
                              >
                                <FileText size={13} color="#059669" />
                                Excel
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : activeReportSubTab === 'STOCKS_LOG' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Stock Metrics 4-Cards (RESPONSIVE: 2x2 Grid on Mobile, 4 Cols on Desktop) */}
          <div className="responsive-summary-2x2-grid">
            <div style={{ background: '#ffffff', padding: '0.85rem 1rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>TOTAL ITEM TERDAFTAR</span>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', marginTop: '0.25rem' }}>{stockList.length} Item</div>
            </div>

            <div style={{ background: '#ffffff', padding: '0.85rem 1rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>ESTIMASI NILAI ASET STOK</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#059669', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {formatRupiah(stockList.reduce((acc, s) => acc + (Number(s.current_stock || 0) * Number(s.selling_price || 0)), 0))}
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '0.85rem 1rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>STOK MENIPIS (&lt;5 PCS)</span>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#d97706', marginTop: '0.25rem' }}>
                {stockList.filter((s) => Number(s.current_stock) > 0 && Number(s.current_stock) < 5).length} Item
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '0.85rem 1rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>STOK HABIS (0 PCS)</span>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#dc2626', marginTop: '0.25rem' }}>
                {stockList.filter((s) => Number(s.current_stock) === 0).length} Item
              </div>
            </div>
          </div>

          {/* Tabel Status Inventory & Restok (RESPONSIVE: MOBILE CARDS + DESKTOP TABLE WITH PAGINATION) */}
          <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📋 Laporan Inventaris Stok & Pergerakan Barang
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ padding: '0.35rem 0.85rem', borderRadius: '999px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#2563eb' }} />
                  Database Active
                </span>
              </div>
            </div>

            {/* 1. MOBILE CARD VIEW (< 768px: Responsive 2x2 Grid Cards) */}
            <div className="responsive-movement-2x2-grid">
              {paginatedStockList.length > 0 ? (
                paginatedStockList.map((item, idx) => {
                  const st = Number(item.current_stock || 0);
                  const isFc = item.business_unit === 'FC_PRINT' || item.business_unit === 'ATK';
                  return (
                    <div key={item.stock_id || idx} style={{ background: '#ffffff', padding: '0.75rem 0.8rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.45rem', minWidth: 0, boxSizing: 'border-box' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.35rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.825rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }} title={item.product_name}>
                            {item.product_name}
                          </span>
                          {st >= 10 ? (
                            <span style={{ padding: '0.15rem 0.45rem', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 800, flexShrink: 0 }}>Aman</span>
                          ) : st > 0 ? (
                            <span style={{ padding: '0.15rem 0.45rem', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 800, flexShrink: 0 }}>Menipis</span>
                          ) : (
                            <span style={{ padding: '0.15rem 0.45rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 800, flexShrink: 0 }}>Habis</span>
                          )}
                        </div>

                        <div style={{ marginBottom: '0.35rem' }}>
                          {isFc ? (
                            <span style={{ padding: '0.15rem 0.45rem', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 800, background: '#f3e8ff', color: '#7e22ce', border: '1px solid #d8b4fe', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                              🖨️ FC
                            </span>
                          ) : (
                            <span style={{ padding: '0.15rem 0.45rem', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 800, background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                              🍔 FNB
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.35rem', borderTop: '1px dashed #e2e8f0', fontSize: '0.725rem' }}>
                        <div style={{ color: '#475569', fontWeight: 700 }}>
                          Stok: <strong style={{ fontSize: '0.9rem', color: st === 0 ? '#dc2626' : st < 5 ? '#d97706' : '#059669' }}>{st}</strong> <span style={{ fontSize: '0.68rem', color: '#64748b' }}>pcs</span>
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>
                          {item.last_updated ? formatWaktuIndo(item.last_updated) : '-'}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ gridColumn: 'span 2', padding: '1.5rem', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px' }}>
                  Tidak ada data stok di database
                </div>
              )}
            </div>

            {/* 2. DESKTOP TABLE VIEW (>= 768px: Full Multi-Column Modern Table) */}
            <div className="desktop-only-table" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)', borderBottom: '2px solid #e2e8f0', textTransform: 'uppercase', fontSize: '0.75rem', color: '#475569', letterSpacing: '0.05em', fontWeight: 800 }}>
                    <th style={{ padding: '0.9rem 1.25rem', textAlign: 'left' }}>Nama Produk</th>
                    <th style={{ padding: '0.9rem 1.25rem', textAlign: 'center' }}>Unit Usaha</th>
                    <th style={{ padding: '0.9rem 1.25rem', textAlign: 'center' }}>Stok Fisik</th>
                    <th style={{ padding: '0.9rem 1.25rem', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>Terakhir Diperbarui</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStockList.length > 0 ? (
                    paginatedStockList.map((item, idx) => {
                      const st = Number(item.current_stock || 0);
                      const isFc = item.business_unit === 'FC_PRINT' || item.business_unit === 'ATK';
                      return (
                        <tr key={item.stock_id || idx} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}>
                          <td style={{ padding: '0.9rem 1.25rem', fontWeight: 800, color: '#0f172a' }}>{item.product_name}</td>
                          <td style={{ padding: '0.9rem 1.25rem', textAlign: 'center' }}>
                            {isFc ? (
                              <span style={{ padding: '0.3rem 0.85rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800, background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)', color: '#7e22ce', border: '1px solid #d8b4fe', boxShadow: '0 2px 4px rgba(126, 34, 206, 0.06)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span>🖨️</span> FC & Print
                              </span>
                            ) : (
                              <span style={{ padding: '0.3rem 0.85rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800, background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', color: '#ea580c', border: '1px solid #fed7aa', boxShadow: '0 2px 4px rgba(234, 88, 12, 0.06)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span>🍔</span> FNB
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '0.9rem 1.25rem', textAlign: 'center' }}>
                            <span style={{ fontWeight: 900, fontSize: '0.95rem', color: st === 0 ? '#dc2626' : st < 5 ? '#d97706' : '#0f172a' }}>{st}</span>{' '}
                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>pcs</span>
                          </td>
                          <td style={{ padding: '0.9rem 1.25rem', textAlign: 'center' }}>
                            {st >= 10 ? (
                              <span style={{ padding: '0.3rem 0.85rem', background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', color: '#047857', border: '1px solid #a7f3d0', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800 }}>Aman</span>
                            ) : st > 0 ? (
                              <span style={{ padding: '0.3rem 0.85rem', background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', color: '#b45309', border: '1px solid #fde68a', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800 }}>Menipis</span>
                            ) : (
                              <span style={{ padding: '0.3rem 0.85rem', background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800 }}>Habis</span>
                            )}
                          </td>
                          <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right', color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>
                            {item.last_updated ? formatWaktuIndo(item.last_updated) : '-'}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Tidak ada data stok di database</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* FOOTER PAGINATION BAR */}
            {totalStockItems > 0 && (
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ fontSize: '0.825rem', color: '#64748b', fontWeight: 700 }}>
                  Menampilkan <strong style={{ color: '#0f172a' }}>{totalStockItems === 0 ? 0 : stockStartIndex + 1}</strong> - <strong style={{ color: '#0f172a' }}>{stockEndIndex}</strong> dari <strong style={{ color: '#0f172a' }}>{totalStockItems}</strong> produk
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    disabled={stockCurrentPage === 1}
                    onClick={() => setStockCurrentPage((prev) => Math.max(1, prev - 1))}
                    style={{
                      padding: '0.4rem 0.65rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: stockCurrentPage === 1 ? '#cbd5e1' : '#334155',
                      cursor: stockCurrentPage === 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <span style={{ fontSize: '0.825rem', fontWeight: 800, color: '#334155', padding: '0 0.5rem' }}>
                    Halaman {stockCurrentPage} dari {totalStockPages}
                  </span>

                  <button
                    disabled={stockCurrentPage === totalStockPages}
                    onClick={() => setStockCurrentPage((prev) => Math.min(totalStockPages, prev + 1))}
                    style={{
                      padding: '0.4rem 0.65rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: stockCurrentPage === totalStockPages ? '#cbd5e1' : '#334155',
                      cursor: stockCurrentPage === totalStockPages ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>

                  <select
                    value={stockItemsPerPage}
                    onChange={(e) => {
                      setStockItemsPerPage(Number(e.target.value));
                      setStockCurrentPage(1);
                    }}
                    style={{
                      padding: '0.4rem 0.65rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#334155',
                      background: '#ffffff',
                      cursor: 'pointer',
                      marginLeft: '0.5rem',
                    }}
                  >
                    <option value={10}>10 / hlm</option>
                    <option value={20}>20 / hlm</option>
                    <option value={50}>50 / hlm</option>
                    <option value={100}>100 / hlm</option>
                    <option value={totalStockItems || 1000}>Semua ({totalStockItems})</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : loading && !reportData ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontWeight: 600 }}>Mengkalkulasi data laporan...</div>
      ) : summary ? (
        <>
          {/* Tabel Performa Kasir / Karyawan (Section 19) */}

          {/* Tabel Performa Kasir / Karyawan (Section 19) */}
          {reportData.employee_performance && reportData.employee_performance.length > 0 && (
            <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.15rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={18} color="#4f46e5" />
                  Laporan Performa Penjualan & Pengeluaran Per Karyawan / Kasir
                </h3>
                {getHiddenEmployeeIds().length > 0 && (
                  <button
                    type="button"
                    onClick={handleRestoreHiddenEmployees}
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#4f46e5',
                      background: '#e0e7ff',
                      border: '1px solid #c7d2fe',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    🔄 Pulihkan ({getHiddenEmployeeIds().length} Dihapus)
                  </button>
                )}
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Kasir / Karyawan</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Jumlah Transaksi</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Total Omzet Kasir</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Cash / Tunai</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>QRIS Non-Tunai</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Transfer Bank</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Pengeluaran Dicatat</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Aksi Hapus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.employee_performance.map((emp: any) => (
                      <tr key={emp.user_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <CashierBadge name={emp.full_name} role={emp.role} size="sm" />
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 800, color: '#0f172a' }}>{emp.transaction_count} tx</td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 900, color: '#2563eb' }}>{formatRupiah(emp.total_sales)}</td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 700, color: '#047857' }}>{formatRupiah(emp.cash_sales)}</td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 700, color: '#1d4ed8' }}>{formatRupiah(emp.qris_sales)}</td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 700, color: '#b45309' }}>{formatRupiah(emp.transfer_sales)}</td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#dc2626', fontWeight: 800 }}>-{formatRupiah(emp.recorded_expenses_amount)}</td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteEmp(emp)}
                            title="Hapus Rekap Kasir"
                            style={{
                              padding: '0.35rem 0.65rem',
                              borderRadius: '8px',
                              border: '1px solid #fecaca',
                              background: '#fef2f2',
                              color: '#dc2626',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <Trash2 size={13} />
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal Peringatan Konfirmasi Hapus Data Performa Kasir */}
          {confirmDeleteEmp && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
              <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '440px', width: '100%', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#dc2626', marginBottom: '1rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AlertTriangle size={22} color="#dc2626" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Peringatan Hapus Data</h3>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Konfirmasi Penghapusan Rekap Kasir</span>
                  </div>
                </div>

                <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                  Apakah Anda yakin ingin menghapus data rekap performa untuk kasir <strong>{confirmDeleteEmp.full_name}</strong>? Data ini akan dihapus permanen dari rekap tampilan laporan.
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteEmp(null)}
                    style={{ padding: '0.65rem 1.25rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirmDeleteEmp?.user_id) {
                        saveHiddenEmployeeId(confirmDeleteEmp.user_id);
                        if (reportData && reportData.employee_performance) {
                          const hiddenIds = getHiddenEmployeeIds();
                          setReportData({
                            ...reportData,
                            employee_performance: reportData.employee_performance.filter((e: any) => !hiddenIds.includes(e.user_id)),
                          });
                        }
                      }
                      const name = confirmDeleteEmp?.full_name || 'Kasir';
                      setConfirmDeleteEmp(null);
                      if (onTriggerToast) {
                        onTriggerToast('success', 'Data Dihapus Permanen', `Laporan performa kasir ${name} telah dihapus permanen.`);
                      }
                    }}
                    style={{ padding: '0.65rem 1.25rem', borderRadius: '10px', border: 'none', background: '#dc2626', color: '#ffffff', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)' }}
                  >
                    <Trash2 size={16} />
                    Ya, Hapus Data
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION DUKUNGAN ANALISIS BISNIS (6 CARD GRID TERMASUK 2 DIAGRAM LINGKARAN - SAMA PERSIS GAMBAR USER) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginTop: '1.5rem' }}>
            {/* ROW 1 CARD 1: Grafik Omzet */}
            <div style={{ background: '#ffffff', padding: '1.35rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Grafik Omzet Real-time</h4>
                <select
                  value={lineChartMode}
                  onChange={(e) => setLineChartMode(e.target.value as 'Per Jam' | 'Harian')}
                  style={{ padding: '0.3rem 0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.75rem', fontWeight: 700, color: '#475569', background: '#f8fafc', cursor: 'pointer' }}
                >
                  <option value="Per Jam">Per Jam</option>
                  <option value="Harian">Harian</option>
                </select>
              </div>
              <SVGLineChart transactions={transactions} chartMode={lineChartMode} />
            </div>

            {/* ROW 1 CARD 2: Omzet per Kategori (Diagram Lingkaran 1) */}
            <div style={{ background: '#ffffff', padding: '1.35rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a', margin: '0 0 1rem 0' }}>Omzet per Kategori</h4>
              <SVGDonutChart
                segments={
                  dynamicCategorySegments.length > 0
                    ? dynamicCategorySegments
                    : [
                        { name: 'FC & Printing', value: 0, color: '#2563eb', percentage: 0 },
                        { name: 'F&B / Snack', value: 0, color: '#10b981', percentage: 0 },
                        { name: 'ATK & Kantor', value: 0, color: '#f59e0b', percentage: 0 },
                        { name: 'Jasa & Lainnya', value: 0, color: '#8b5cf6', percentage: 0 },
                      ]
                }
              />
            </div>

            {/* ROW 1 CARD 3: Ringkasan Metode Pembayaran (Diagram Lingkaran 2) */}
            <div style={{ background: '#ffffff', padding: '1.35rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a', margin: '0 0 1rem 0' }}>Ringkasan Metode Pembayaran</h4>
              <SVGDonutChart
                segments={[
                  { name: 'Tunai', value: totalCash, color: '#10b981', percentage: totalSalesNetUI > 0 ? Math.round((totalCash / totalSalesNetUI) * 1000) / 10 : 0 },
                  { name: 'QRIS', value: totalQris, color: '#2563eb', percentage: totalSalesNetUI > 0 ? Math.round((totalQris / totalSalesNetUI) * 1000) / 10 : 0 },
                  { name: 'Transfer', value: totalTransfer, color: '#f59e0b', percentage: totalSalesNetUI > 0 ? Math.round((totalTransfer / totalSalesNetUI) * 1000) / 10 : 0 },
                  { name: 'Debit/Kartu', value: totalDebit, color: '#8b5cf6', percentage: totalSalesNetUI > 0 ? Math.round((totalDebit / totalSalesNetUI) * 1000) / 10 : 0 },
                ]}
              />
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', fontWeight: 900, color: '#0f172a' }}>
                <span>Total Omzet</span>
                <span>{formatRupiah(totalSalesNetUI)}</span>
              </div>
            </div>

            {/* ROW 2 CARD 4: Transaksi Terbesar */}
            <div style={{ background: '#ffffff', padding: '1.35rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a', margin: '0 0 1rem 0' }}>Transaksi Terbesar</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead>
                      <tr style={{ color: '#64748b', borderBottom: '1px solid #f1f5f9', textAlign: 'left' }}>
                        <th style={{ padding: '0.4rem 0.2rem' }}>No. Transaksi</th>
                        <th style={{ padding: '0.4rem 0.2rem' }}>Waktu</th>
                        <th style={{ padding: '0.4rem 0.2rem' }}>Kasir</th>
                        <th style={{ padding: '0.4rem 0.2rem' }}>Pelanggan</th>
                        <th style={{ padding: '0.4rem 0.2rem', textAlign: 'right' }}>Total</th>
                        <th style={{ padding: '0.4rem 0.2rem', textAlign: 'center' }}>Metode</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.length > 0 ? (
                        [...transactions]
                          .sort((a: any, b: any) => Number(b.final_total || 0) - Number(a.final_total || 0))
                          .slice(0, 5)
                          .map((tx: any, idx: number) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                              <td style={{ padding: '0.45rem 0.2rem', fontWeight: 800, color: '#0f172a', fontSize: '0.72rem' }}>{tx.transaction_number || ('TRX-' + (tx.transaction_id || idx + 1))}</td>
                              <td style={{ padding: '0.45rem 0.2rem', color: '#64748b', fontSize: '0.7rem' }}>{tx.transaction_time ? formatWaktuIndo(tx.transaction_time) : '-'}</td>
                              <td style={{ padding: '0.45rem 0.2rem', color: '#334155', fontWeight: 600 }}>{getCashierName(tx)}</td>
                              <td style={{ padding: '0.45rem 0.2rem', color: '#64748b', fontSize: '0.72rem' }}>{tx.customer_name || 'Pelanggan Umum'}</td>
                              <td style={{ padding: '0.45rem 0.2rem', textAlign: 'right', fontWeight: 900, color: '#0f172a' }}>{formatRupiah(Number(tx.final_total || tx.subtotal_amount || 0))}</td>
                              <td style={{ padding: '0.45rem 0.2rem', textAlign: 'center' }}>
                                <span style={{ padding: '0.15rem 0.45rem', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800, background: (tx.payment_method || 'CASH').toUpperCase() === 'CASH' ? '#ecfdf5' : (tx.payment_method || '').toUpperCase() === 'QRIS' ? '#eff6ff' : '#fffbeb', color: (tx.payment_method || 'CASH').toUpperCase() === 'CASH' ? '#047857' : (tx.payment_method || '').toUpperCase() === 'QRIS' ? '#1d4ed8' : '#b45309' }}>
                                  {(tx.payment_method || 'CASH').toUpperCase() === 'CASH' ? 'Tunai' : (tx.payment_method || '').toUpperCase() === 'TRANSFER' ? 'Transfer' : tx.payment_method}
                                </span>
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', fontWeight: 600 }}>
                            Belum ada data transaksi pada periode ini
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div style={{ marginTop: '0.85rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                <button onClick={() => setShowAllTxModal(true)} style={{ background: 'none', border: 'none', padding: 0, fontSize: '0.78rem', fontWeight: 800, color: '#2563eb', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  Lihat Semua Transaksi ({transactions.length}) <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* ROW 2 CARD 5: Produk Terlaris */}
            <div style={{ background: '#ffffff', padding: '1.35rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a', margin: '0 0 1rem 0' }}>Produk Terlaris</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {dynamicTopProductsList.length > 0 ? (
                    dynamicTopProductsList.slice(0, 5).map((p, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', paddingBottom: '0.4rem', borderBottom: idx === 4 ? 'none' : '1px solid #f8fafc' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                            <BagIcon size={14} />
                          </div>
                          <span style={{ fontWeight: 800, color: '#0f172a' }}>{p.name}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, color: '#475569', fontSize: '0.75rem' }}>{p.qty} pcs</div>
                          <div style={{ fontWeight: 900, color: '#2563eb', fontSize: '0.75rem' }}>{formatRupiah(p.omzet)}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>
                      Belum ada data produk terlampir pada transaksi
                    </div>
                  )}
                </div>
              </div>
              <div style={{ marginTop: '0.85rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                <button onClick={() => setShowAllProductsModal(true)} style={{ background: 'none', border: 'none', padding: 0, fontSize: '0.78rem', fontWeight: 800, color: '#2563eb', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  Lihat Semua Produk ({dynamicTopProductsList.length}) <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* ROW 2 CARD 6: Ringkasan Laba Rugi */}
            <div style={{ background: '#ffffff', padding: '1.35rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a', margin: '0 0 1rem 0' }}>Ringkasan Laba Rugi</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.825rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                    <span>Total Penjualan</span>
                    <span style={{ fontWeight: 800, color: '#0f172a' }}>{formatRupiah(totalSalesNetUI)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                    <span>(-) Harga Pokok Penjualan</span>
                    <span style={{ fontWeight: 700, color: '#475569' }}>{formatRupiah(calculatedHppUI)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '0.4rem', fontWeight: 900, color: '#059669', fontSize: '0.9rem' }}>
                    <span>Laba Kotor</span>
                    <span>{formatRupiah(grossProfitValUI)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                    <span>(-) Pengeluaran</span>
                    <span style={{ fontWeight: 700, color: '#dc2626' }}>{formatRupiah(totalExpenseValUI)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', fontWeight: 900, color: '#047857', fontSize: '0.95rem' }}>
                    <span>Laba Bersih</span>
                    <span>{formatRupiah(netProfitValUI)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, color: '#0f172a', fontSize: '0.85rem' }}>
                    <span>Margin Laba Bersih</span>
                    <span>{marginPctValUI}</span>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '0.85rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                <button onClick={() => setShowProfitLossModal(true)} style={{ background: 'none', border: 'none', padding: 0, fontSize: '0.78rem', fontWeight: 800, color: '#2563eb', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  Lihat Detail Laba Rugi <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* MODAL DETAIL TRANSAKSI (Sama Persis Gambar 2) */}
      {/* MODAL TRANSACTION DETAIL (NEW SCREENSHOT ACCURATE DESIGN WITH CANCELLATION WARNING) */}
      <TransactionDetailModal
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        transaction={selectedTx}
        getUserName={(userId) => {
          const user = usersList.find((u: any) => u.user_id === userId);
          return user ? user.full_name || user.username : userId || 'Kasir';
        }}
        onTransactionCancelled={() => {
          loadReport();
        }}
      />

      {/* MODAL 1: LIHAT SEMUA TRANSAKSI */}
      {showAllTxModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10050, padding: '1rem' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAllTxModal(false);
            }
          }}
        >
          <div style={{ background: '#ffffff', width: '100%', maxWidth: '850px', maxHeight: '90vh', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflowY: 'auto', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Daftar Transaksi Terfilter ({transactions.length})</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>Semua riwayat nota penjualan sesuai filter periode aktif</p>
              </div>
              <button onClick={() => setShowAllTxModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#64748b', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '0.6rem 0.5rem' }}>No. Transaksi</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Waktu</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Kasir</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Pelanggan</th>
                    <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>Total</th>
                    <th style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>Metode</th>
                    <th style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length > 0 ? (
                    transactions.map((tx: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.6rem 0.5rem', fontWeight: 800, color: '#0f172a' }}>{tx.transaction_number || ('TRX-' + (tx.transaction_id || idx + 1))}</td>
                        <td style={{ padding: '0.6rem 0.5rem', color: '#64748b', fontSize: '0.78rem' }}>{tx.transaction_time ? formatWaktuIndo(tx.transaction_time) : '-'}</td>
                        <td style={{ padding: '0.6rem 0.5rem', color: '#334155', fontWeight: 600 }}>{getCashierName(tx)}</td>
                        <td style={{ padding: '0.6rem 0.5rem', color: '#64748b' }}>{tx.customer_name || 'Pelanggan Umum'}</td>
                        <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right', fontWeight: 900, color: '#0f172a' }}>{formatRupiah(Number(tx.final_total || tx.subtotal_amount || 0))}</td>
                        <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>
                          <span style={{ padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, background: (tx.payment_method || 'CASH').toUpperCase() === 'CASH' ? '#ecfdf5' : (tx.payment_method || '').toUpperCase() === 'QRIS' ? '#eff6ff' : '#fffbeb', color: (tx.payment_method || 'CASH').toUpperCase() === 'CASH' ? '#047857' : (tx.payment_method || '').toUpperCase() === 'QRIS' ? '#1d4ed8' : '#b45309' }}>
                            {(tx.payment_method || 'CASH').toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>
                          <button onClick={(e) => { e.stopPropagation(); setSelectedTx(tx); }} style={{ padding: '0.3rem 0.65rem', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                            Detail
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>
                        Belum ada data transaksi pada database untuk periode ini
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: LIHAT SEMUA PRODUK TERLARIS */}
      {showAllProductsModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10050, padding: '1rem' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAllProductsModal(false);
            }
          }}
        >
          <div style={{ background: '#ffffff', width: '100%', maxWidth: '700px', maxHeight: '90vh', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflowY: 'auto', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Peringkat Produk Terjual ({dynamicTopProductsList.length})</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>Daftar item produk & jasa yang paling sering dibeli pelanggan</p>
              </div>
              <button onClick={() => setShowAllProductsModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#64748b', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '0.6rem', textAlign: 'center', width: '50px' }}>Rank</th>
                    <th style={{ padding: '0.6rem' }}>Nama Produk / Jasa</th>
                    <th style={{ padding: '0.6rem', textAlign: 'center' }}>Terjual (pcs)</th>
                    <th style={{ padding: '0.6rem', textAlign: 'right' }}>Total Omzet Penjualan</th>
                  </tr>
                </thead>
                <tbody>
                  {dynamicTopProductsList.length > 0 ? (
                    dynamicTopProductsList.map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 900, color: idx === 0 ? '#d97706' : idx === 1 ? '#64748b' : idx === 2 ? '#b45309' : '#94a3b8' }}>
                          #{idx + 1}
                        </td>
                        <td style={{ padding: '0.65rem', fontWeight: 800, color: '#0f172a' }}>{p.name}</td>
                        <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 800, color: '#475569' }}>{p.qty} pcs</td>
                        <td style={{ padding: '0.65rem', textAlign: 'right', fontWeight: 900, color: '#2563eb' }}>{formatRupiah(p.omzet)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>
                        Belum ada data produk terlampir pada database untuk periode ini
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DETAIL LABA RUGI OPERASIONAL */}
      {showProfitLossModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10050, padding: '1rem' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowProfitLossModal(false);
            }
          }}
        >
          <div style={{ background: '#ffffff', width: '100%', maxWidth: '620px', maxHeight: '90vh', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflowY: 'auto', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Laporan Rincian Laba Rugi Operasional</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>Perhitungan otomatis dari database omzet, HPP, dan biaya pengeluaran</p>
              </div>
              <button onClick={() => setShowProfitLossModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Total Omzet Penjualan (Net Sales)</span>
                  <span style={{ fontWeight: 800, color: '#0f172a' }}>{formatRupiah(totalSalesNetUI)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>(-) Harga Pokok Penjualan (HPP)</span>
                  <span style={{ fontWeight: 700, color: '#dc2626' }}>- {formatRupiah(calculatedHppUI)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '0.6rem', fontWeight: 900, color: '#059669', fontSize: '1rem' }}>
                  <span>Laba Kotor (Gross Profit)</span>
                  <span>{formatRupiah(grossProfitValUI)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', marginTop: '0.3rem' }}>
                  <span>(-) Total Pengeluaran Operasional Toko</span>
                  <span style={{ fontWeight: 700, color: '#dc2626' }}>- {formatRupiah(totalExpenseValUI)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #0f172a', paddingTop: '0.75rem', fontWeight: 900, color: '#047857', fontSize: '1.15rem' }}>
                  <span>Laba Bersih Operasional (Net Profit)</span>
                  <span>{formatRupiah(netProfitValUI)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', background: '#ecfdf5', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #a7f3d0', fontWeight: 900, color: '#047857', marginTop: '0.5rem' }}>
                  <span>Margin Laba Bersih</span>
                  <span>{marginPctValUI}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowProfitLossModal(false)} style={{ padding: '0.6rem 1.25rem', background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
