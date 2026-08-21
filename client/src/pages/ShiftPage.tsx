import React, { useState, useEffect } from 'react';
import { ShoppingBag, DollarSign, CheckCircle2, RotateCcw, PlayCircle, Printer, FileSpreadsheet, ShieldCheck, UserCheck, Power, X, Edit3, Trash2, Plus, AlertTriangle } from 'lucide-react';
import { apiService, ActiveShiftDetailsData } from '../services/api';
import { User } from '../types';
import { formatRupiah, formatWaktuIndo } from '../utils/formatters';
import { ActionLoadingModal } from '../components/common/ActionLoadingModal';
import { exportShiftToExcel, printShiftPDF } from '../utils/shiftReportExporter';

interface ShiftPageProps {
  currentUser: User;
  onShiftStatusChange?: () => void;
  storeName?: string;
}

interface StaffEntry {
  id: string;
  name: string;
  time: string;
}

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getCurrentTimeString = () => {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${mins}`;
};

const getCurrentTimeHHMM = () => {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${mins}`;
};

const parseStaffStringToEntries = (staffStringOrArray: string | string[], fallbackTime?: string): StaffEntry[] => {
  let list: string[] = [];
  if (Array.isArray(staffStringOrArray)) {
    list = staffStringOrArray;
  } else if (typeof staffStringOrArray === 'string' && staffStringOrArray.trim()) {
    list = staffStringOrArray.split(',').map((s) => s.trim()).filter(Boolean);
  }

  return list.map((item, idx) => {
    const match = item.match(/^(.*?)(?:\s*\((.*?)\))?$/);
    const name = match && match[1] ? match[1].trim() : item.trim();
    let timeStr = match && match[2] ? match[2].replace(/\s*WIB/i, '').trim() : '';

    if (!timeStr || !/^\d{1,2}:\d{2}$/.test(timeStr)) {
      timeStr = fallbackTime || getCurrentTimeHHMM();
    }

    return {
      id: `staff-${idx}-${Date.now()}`,
      name,
      time: timeStr,
    };
  });
};

export const ShiftPage: React.FC<ShiftPageProps> = ({ currentUser, onShiftStatusChange, storeName }) => {
  const [activeShiftData, setActiveShiftData] = useState<ActiveShiftDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State Buka Shift Baru
  const [openInitialCash, setOpenInitialCash] = useState<number | ''>(50000);
  const [shiftDateInput, setShiftDateInput] = useState<string>(getTodayDateString());
  const [shiftTimeInput, setShiftTimeInput] = useState<string>(getCurrentTimeString());
  const [openStaffEntries, setOpenStaffEntries] = useState<StaffEntry[]>([
    { id: `open-1`, name: currentUser.full_name, time: getCurrentTimeHHMM() },
  ]);

  // Form State Kas Tambahan
  const [addCapitalAmount, setAddCapitalAmount] = useState<number | ''>('');

  // Form State Tutup Shift
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [actualPhysicalCash, setActualPhysicalCash] = useState<number | ''>('');

  // Loading Modals
  const [openLoading, setOpenLoading] = useState(false);
  const [capitalLoading, setCapitalLoading] = useState(false);
  const [closeLoading, setCloseLoading] = useState(false);

  // Modal State Edit Shift Sesi Aktif
  const [showEditShiftModal, setShowEditShiftModal] = useState(false);
  const [editStaffEntries, setEditStaffEntries] = useState<StaffEntry[]>([]);

  // Modal State Hapus Rekonsiliasi Confirmation
  const [showConfirmDeleteReconciliation, setShowConfirmDeleteReconciliation] = useState(false);

  // Status Setelah Tutup Shift (Rincian Return Capital) - Tersimpan di LocalStorage agar tidak hilang saat di-refresh!
  const [closedShiftResult, setClosedShiftResult] = useState<ActiveShiftDetailsData | null>(() => {
    try {
      const raw = localStorage.getItem('pos_last_closed_shift_result');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const updateClosedShiftResult = (data: ActiveShiftDetailsData | null) => {
    setClosedShiftResult(data);
    if (data) {
      localStorage.setItem('pos_last_closed_shift_result', JSON.stringify(data));
    } else {
      localStorage.removeItem('pos_last_closed_shift_result');
    }
  };

  const handleDeleteClosedShiftResult = () => {
    setShowConfirmDeleteReconciliation(true);
  };

  const confirmDeleteClosedShiftResult = () => {
    updateClosedShiftResult(null);
    setShowConfirmDeleteReconciliation(false);
  };
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    apiService.getUsers().then((res) => {
      if (Array.isArray(res)) {
        setAllUsers(res);
      }
    }).catch(() => {});
  }, []);

  const getUserDisplayName = (userId?: string) => {
    if (!userId) return '-';
    if (userId === currentUser.user_id) return `${currentUser.full_name} (Saya)`;
    const found = allUsers.find((u) => u.user_id === userId);
    if (found) return found.full_name;
    return userId;
  };

  const loadShift = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getActiveShift();
      setActiveShiftData(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat status shift');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShift();
  }, []);

  const handlePrintShiftPDF = async () => {
    if (!activeShiftData?.shift?.shift_id) return;
    try {
      setLoading(true);
      const [salesReport, expensesData] = await Promise.all([
        apiService.getSalesReport({ shift_id: activeShiftData.shift.shift_id }),
        apiService.getExpenses(activeShiftData.shift.shift_id).catch(() => []),
      ]);

      let storedMeta: any = null;
      try {
        const raw = localStorage.getItem(`pos_shift_meta_${activeShiftData.shift.shift_id}`);
        if (raw) storedMeta = JSON.parse(raw);
      } catch {}

      const dutyUsers = storedMeta?.dutyStaffNames || activeShiftData.contributions.map((c) => getUserDisplayName(c.user_id));

      printShiftPDF({
        storeName: storeName || 'Kedai POS',
        dateStr: storedMeta?.date
          ? `${storedMeta.date} (Jam ${storedMeta.time} WIB)`
          : new Date(activeShiftData.shift.start_time).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        shiftId: storedMeta?.shiftName || `Shift #${activeShiftData.shift.shift_id.slice(-6)}`,
        dutyUsers: dutyUsers.length > 0 ? dutyUsers : [currentUser.full_name],
        currentUserFullName: currentUser.full_name,
        transactions: salesReport?.transactions || [],
        expenses: expensesData || [],
      });
    } catch (err: any) {
      alert('Gagal memuat data shift untuk cetak PDF: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleExportShiftExcel = async () => {
    if (!activeShiftData?.shift?.shift_id) return;
    try {
      setLoading(true);
      const [salesReport, expensesData] = await Promise.all([
        apiService.getSalesReport({ shift_id: activeShiftData.shift.shift_id }),
        apiService.getExpenses(activeShiftData.shift.shift_id).catch(() => []),
      ]);

      let storedMeta: any = null;
      try {
        const raw = localStorage.getItem(`pos_shift_meta_${activeShiftData.shift.shift_id}`);
        if (raw) storedMeta = JSON.parse(raw);
      } catch {}

      const dutyUsers = storedMeta?.dutyStaffNames || activeShiftData.contributions.map((c) => getUserDisplayName(c.user_id));

      exportShiftToExcel({
        storeName: storeName || 'Kedai POS',
        dateStr: storedMeta?.date
          ? `${storedMeta.date} (Jam ${storedMeta.time} WIB)`
          : new Date(activeShiftData.shift.start_time).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        shiftId: storedMeta?.shiftName || `Shift #${activeShiftData.shift.shift_id.slice(-6)}`,
        dutyUsers: dutyUsers.length > 0 ? dutyUsers : [currentUser.full_name],
        currentUserFullName: currentUser.full_name,
        transactions: salesReport?.transactions || [],
        expenses: expensesData || [],
      });
    } catch (err: any) {
      alert('Gagal memuat data shift untuk ekspor Excel: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setOpenLoading(true);
      setError(null);

      const staffList = openStaffEntries
        .filter((s) => s.name.trim())
        .map((s) => `${s.name.trim()} (${s.time || shiftTimeInput || getCurrentTimeHHMM()} WIB)`);

      if (staffList.length === 0) {
        staffList.push(`${currentUser.full_name} (${shiftTimeInput || getCurrentTimeHHMM()} WIB)`);
      }

      const finalShiftName = staffList.join(', ');
      const initialCashNum = Number(openInitialCash) || 0;

      const data = await apiService.openShift(initialCashNum);

      if (data?.shift?.shift_id) {
        const meta = {
          shiftName: finalShiftName,
          date: shiftDateInput,
          time: shiftTimeInput,
          dutyStaffNames: staffList,
          initialCash: initialCashNum,
        };
        localStorage.setItem(`pos_shift_meta_${data.shift.shift_id}`, JSON.stringify(meta));
        sessionStorage.setItem(`pos_shift_activated_${currentUser.user_id}`, data.shift.shift_id);
      }

      setActiveShiftData(data);
      updateClosedShiftResult(null);
      if (onShiftStatusChange) onShiftStatusChange();
    } catch (err: any) {
      setError(err.message || 'Gagal membuka shift');
    } finally {
      setOpenLoading(false);
    }
  };

  const handleActivateExistingShift = () => {
    if (activeShiftData?.shift?.shift_id) {
      sessionStorage.setItem(`pos_shift_activated_${currentUser.user_id}`, activeShiftData.shift.shift_id);
      if (onShiftStatusChange) onShiftStatusChange();
    }
  };

  const handleAddCapital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShiftData) return;
    try {
      setCapitalLoading(true);
      setError(null);
      await apiService.addCapitalContribution(activeShiftData.shift.shift_id, Number(addCapitalAmount));
      sessionStorage.setItem(`pos_shift_activated_${currentUser.user_id}`, activeShiftData.shift.shift_id);
      await loadShift();
      if (onShiftStatusChange) onShiftStatusChange();
    } catch (err: any) {
      setError(err.message || 'Gagal menambahkan setoran modal');
    } finally {
      setCapitalLoading(false);
    }
  };

  const handleReturnCapital = async (contributionId: string) => {
    try {
      await apiService.returnCapitalContribution(contributionId);
      if (closedShiftResult) {
        updateClosedShiftResult({
          ...closedShiftResult,
          contributions: closedShiftResult.contributions.map((c) =>
            c.contribution_id === contributionId ? { ...c, status: 'RETURNED' } : c
          ),
        });
      }
    } catch (err: any) {
      alert(err.message || 'Gagal memproses pengembalian modal');
    }
  };

  const handleCloseShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShiftData?.shift?.shift_id) return;
    try {
      setCloseLoading(true);
      setError(null);
      const physicalCashNum = actualPhysicalCash === '' ? activeShiftData.shift.theoretical_cash : Number(actualPhysicalCash);
      const closedShift = await apiService.closeShift(activeShiftData.shift.shift_id, physicalCashNum);

      // Clean up session activation & cache
      sessionStorage.removeItem(`pos_shift_activated_${currentUser.user_id}`);
      localStorage.removeItem('pos_cached_active_shift');

      updateClosedShiftResult({
        shift: closedShift,
        contributions: activeShiftData.contributions,
        shift_users: activeShiftData.shift_users,
        usersCount: activeShiftData.usersCount || activeShiftData.contributions.length,
      });

      setShowCloseModal(false);
      setActiveShiftData(null);
      await loadShift();
      if (onShiftStatusChange) onShiftStatusChange();
    } catch (err: any) {
      setError(err.message || 'Gagal menutup shift');
    } finally {
      setCloseLoading(false);
    }
  };

  const handleOpenEditShiftModal = (dutyStaffList: string[], storedTime?: string) => {
    const parsed = parseStaffStringToEntries(dutyStaffList, storedTime || shiftTimeInput);
    setEditStaffEntries(parsed.length > 0 ? parsed : [{ id: `edit-1`, name: currentUser.full_name, time: getCurrentTimeHHMM() }]);
    setShowEditShiftModal(true);
  };

  const handleUpdateShiftMetaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShiftData?.shift?.shift_id) return;
    const shiftId = activeShiftData.shift.shift_id;
    let storedMeta: any = {};
    try {
      const raw = localStorage.getItem(`pos_shift_meta_${shiftId}`);
      if (raw) storedMeta = JSON.parse(raw);
    } catch {}

    const newStaffList = editStaffEntries
      .filter((s) => s.name.trim())
      .map((s) => `${s.name.trim()} (${s.time || getCurrentTimeHHMM()} WIB)`);

    if (newStaffList.length === 0) {
      newStaffList.push(`${currentUser.full_name} (${getCurrentTimeHHMM()} WIB)`);
    }

    const newShiftName = newStaffList.join(', ');

    const updatedMeta = {
      ...storedMeta,
      shiftName: newShiftName,
      dutyStaffNames: newStaffList,
    };
    localStorage.setItem(`pos_shift_meta_${shiftId}`, JSON.stringify(updatedMeta));
    setShowEditShiftModal(false);
    loadShift();
    if (onShiftStatusChange) onShiftStatusChange();
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Memuat status sesi shift...</div>;
  }

  // Check if current user has activated this shift session
  const isUserActivated = Boolean(
    activeShiftData?.shift?.shift_status === 'ACTIVE' &&
      (activeShiftData.shift.opened_by_user_id === currentUser.user_id ||
        activeShiftData.shift_users?.some((su) => su.user_id === currentUser.user_id) ||
        activeShiftData.contributions?.some((c) => c.user_id === currentUser.user_id) ||
        sessionStorage.getItem(`pos_shift_activated_${currentUser.user_id}`) === activeShiftData.shift.shift_id)
  );

  // TAMPILAN 1: Sesi Shift Aktif Berjalan & Sudah Diaktifkan oleh User
  if (activeShiftData && activeShiftData.shift.shift_status === 'ACTIVE' && isUserActivated) {
    const { shift, contributions } = activeShiftData;

    // Load custom metadata if available
    let storedMeta: any = null;
    try {
      const raw = localStorage.getItem(`pos_shift_meta_${shift.shift_id}`);
      if (raw) storedMeta = JSON.parse(raw);
    } catch {}

    const shiftTitle = storedMeta?.shiftName || `Shift Operasional (#${shift.shift_id.slice(-6)})`;
    const dutyStaffList: string[] = storedMeta?.dutyStaffNames || contributions.map((c) => getUserDisplayName(c.user_id));

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="badge badge-fc">SHIFT SESI ACTIVE</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#047857', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.15rem 0.6rem', borderRadius: '12px' }}>
                🏷️ {shiftTitle}
              </span>
            </div>
            <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a', fontWeight: 800 }}>
              <ShoppingBag color="#059669" />
              Laci Kas Bersama
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0.4rem 0' }}>
              Dimulai pada: {storedMeta?.date ? `${storedMeta.date} | Jam ${storedMeta.time} WIB` : formatWaktuIndo(shift.start_time)}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155' }}>👥 Tim Bertugas & Jam Masuk:</span>
              {dutyStaffList.map((staffStr, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#4f46e5',
                    background: '#e0e7ff',
                    border: '1px solid #c7d2fe',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  {staffStr}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleOpenEditShiftModal(dutyStaffList, storedMeta?.time)}
              style={{
                padding: '0.55rem 1rem',
                background: '#4f46e5',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.85rem',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
              }}
            >
              <Edit3 size={16} />
              Edit Sesi & Tim
            </button>
            <button
              onClick={handlePrintShiftPDF}
              style={{
                padding: '0.55rem 1rem',
                background: '#059669',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.85rem',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
              }}
            >
              <Printer size={16} />
              Cetak PDF Shift
            </button>
            <button
              onClick={handleExportShiftExcel}
              style={{
                padding: '0.55rem 1rem',
                background: '#15803d',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.85rem',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 12px rgba(21, 128, 61, 0.25)',
              }}
            >
              <FileSpreadsheet size={16} />
              Export Excel Shift
            </button>
            <button
              onClick={() => {
                setActualPhysicalCash(shift.theoretical_cash);
                setShowCloseModal(true);
              }}
              style={{
                padding: '0.55rem 1rem',
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.85rem',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
              }}
            >
              <Power size={16} />
              🛑 Tutup Shift Sekarang
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {/* Dynamic Metric Cards (2x2 RESPONSIVE GRID) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
          <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '14px', border: '1px solid #cbd5e1', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: '0.78rem', color: '#4b5563', fontWeight: 700 }}>Modal Kas Awal</span>
            <h3 style={{ fontSize: '1.25rem', color: '#4f46e5', marginTop: '0.25rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatRupiah(shift.total_initial_cash)}</h3>
            <p style={{ fontSize: '0.72rem', color: '#6b7280' }}>{contributions.length} Setoran Karyawan</p>
          </div>

          <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '14px', border: '1px solid #cbd5e1', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: '0.78rem', color: '#4b5563', fontWeight: 700 }}>Penjualan Tunai</span>
            <h3 style={{ fontSize: '1.25rem', color: '#059669', marginTop: '0.25rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatRupiah(shift.net_cash_sales)}</h3>
            <p style={{ fontSize: '0.72rem', color: '#6b7280' }}>Seluruh Transaksi Shift</p>
          </div>

          <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '14px', border: '1px solid #cbd5e1', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: '0.78rem', color: '#4b5563', fontWeight: 700 }}>Pengeluaran Kas</span>
            <h3 style={{ fontSize: '1.25rem', color: '#dc2626', marginTop: '0.25rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatRupiah(shift.total_cash_expenses)}</h3>
            <p style={{ fontSize: '0.72rem', color: '#6b7280' }}>Biaya Operasional Toko</p>
          </div>

          <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '14px', border: '2px solid #5b21b6', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: '0.78rem', color: '#5b21b6', fontWeight: 800 }}>Kas Teoritis</span>
            <h3 style={{ fontSize: '1.25rem', color: '#5b21b6', marginTop: '0.25rem', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatRupiah(shift.theoretical_cash)}</h3>
            <p style={{ fontSize: '0.72rem', color: '#6b7280' }}>Uang Fisik di Laci</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Panel Left: Tabel Setoran Modal Multi-User */}
          <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
              <DollarSign size={20} color="#5b21b6" />
              Rincian Setoran Modal Karyawan (Multi-User)
            </h3>

            {contributions.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Belum ada setoran modal awal pada shift ini.</p>
            ) : (
              <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #cbd5e1', color: '#4b5563' }}>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Nama Pegawai</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>Nominal Setoran</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center' }}>Waktu Setor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contributions.map((c) => (
                      <tr key={c.contribution_id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.5rem', fontWeight: 700, color: '#0f172a' }}>{getUserDisplayName(c.user_id)}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 800, color: '#059669' }}>{formatRupiah(c.amount)}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center', color: '#6b7280', fontSize: '0.75rem' }}>
                          {new Date(c.contribution_time || (c as any).created_at || Date.now()).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Panel Right: Tambah Modal Kas Darurat */}
          <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
              <Plus size={20} color="#059669" />
              Tambah Modal Kas Laci Tambahan
            </h3>
            <p style={{ fontSize: '0.825rem', color: '#64748b', marginBottom: '1rem' }}>
              Gunakan form ini jika karyawan lain ikut menyetor modal fisik tambahan ke dalam laci selama shift berjalan.
            </p>

            <form onSubmit={handleAddCapital} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.35rem', color: '#334155' }}>
                  Setor Tambahan Atas Nama:
                </label>
                <input
                  type="text"
                  value={currentUser.full_name}
                  disabled
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700, color: '#64748b' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.35rem', color: '#334155' }}>
                  Nominal Tambahan Modal (Rp):
                </label>
                <input
                  type="number"
                  value={addCapitalAmount}
                  onChange={(e) => setAddCapitalAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Contoh: 50000"
                  min={0}
                  step="any"
                  required
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '2px solid #059669', fontSize: '1.1rem', fontWeight: 800 }}
                />
              </div>

              <button
                type="submit"
                disabled={capitalLoading}
                style={{
                  padding: '0.75rem 1rem',
                  background: '#059669',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: capitalLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  marginTop: '0.25rem',
                }}
              >
                <Plus size={16} />
                {capitalLoading ? 'Menyimpan Modal...' : 'Simpan Modal Tambahan'}
              </button>
            </form>
          </div>
        </div>

        {/* MODAL TUTUP SHIFT */}
        {showCloseModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                maxWidth: '480px',
                width: '100%',
                padding: '1.75rem',
                boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
                position: 'relative',
              }}
            >
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                style={{
                  position: 'absolute',
                  top: '1.25rem',
                  right: '1.25rem',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b',
                }}
              >
                <X size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Power size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    🛑 Prosedur Penutupan Shift
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>
                    Hitung total uang fisik di laci kasir dan masukkan hasilnya.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCloseShiftSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Total Kas Teoritis (Sistem):</span>
                    <span style={{ fontWeight: 800, color: '#5b21b6' }}>{formatRupiah(shift.theoretical_cash)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Total Setoran Modal Awal:</span>
                    <span style={{ fontWeight: 800, color: '#059669' }}>{formatRupiah(shift.total_initial_cash)}</span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.35rem', color: '#0f172a' }}>
                    💵 Jumlah Uang Fisik Aktual di Laci (Rp):
                  </label>
                  <input
                    type="number"
                    value={actualPhysicalCash}
                    onChange={(e) => setActualPhysicalCash(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={`Sistem: ${shift.theoretical_cash}`}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '2px solid #dc2626', fontSize: '1.25rem', fontWeight: 900, outline: 'none' }}
                    required
                  />
                  <span style={{ display: 'block', marginTop: '0.35rem', fontSize: '0.75rem', color: '#64748b' }}>
                    * Jika sama persis dengan sistem, klik tombol tutup di bawah.
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowCloseModal(false)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#475569',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={closeLoading}
                    style={{
                      flex: 1.5,
                      padding: '0.75rem',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                      color: '#ffffff',
                      fontWeight: 800,
                      cursor: closeLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
                    }}
                  >
                    <Power size={18} />
                    {closeLoading ? 'Menutup Shift...' : '🛑 Ya, Tutup Shift Resmi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL EDIT NAMA SESI & TIM BERTUGAS (DENGAN JAM MASUK PER PEGAWAI) */}
        {showEditShiftModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                maxWidth: '520px',
                width: '100%',
                padding: '1.75rem',
                boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
                position: 'relative',
              }}
            >
              <button
                type="button"
                onClick={() => setShowEditShiftModal(false)}
                style={{
                  position: 'absolute',
                  top: '1.25rem',
                  right: '1.25rem',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b',
                }}
              >
                <X size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Edit3 size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    ✏️ Edit Tim Shift & Jam Datang Pegawai
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>
                    Tambah pegawai susulan/telat dan atur jam masuk masing-masing pegawai.
                  </p>
                </div>
              </div>

              <form onSubmit={handleUpdateShiftMetaSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '320px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                    👥 Daftar Pegawai Bertugas & Jam Masuk Individu:
                  </label>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '-0.35rem 0 0.25rem 0' }}>
                    Atur jam kedatangan untuk setiap pegawai (pegawai yang menyusul/terlambat dapat disesuaikan jam masuknya).
                  </p>

                  {editStaffEntries.map((staff, idx) => (
                    <div key={staff.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: '#f8fafc', padding: '0.6rem 0.75rem', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#475569', marginBottom: '0.2rem' }}>
                          Nama Pegawai #{idx + 1}:
                        </label>
                        <input
                          type="text"
                          value={staff.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditStaffEntries((prev) => prev.map((s, i) => (i === idx ? { ...s, name: val } : s)));
                          }}
                          placeholder="Contoh: Budi / Dika"
                          style={{ width: '100%', padding: '0.5rem 0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', fontWeight: 700, outline: 'none' }}
                          required={idx === 0}
                        />
                      </div>
                      <div style={{ width: '125px', flexShrink: 0 }}>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#475569', marginBottom: '0.2rem' }}>
                          ⏰ Jam Datang:
                        </label>
                        <input
                          type="time"
                          value={staff.time}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditStaffEntries((prev) => prev.map((s, i) => (i === idx ? { ...s, time: val } : s)));
                          }}
                          style={{ width: '100%', padding: '0.5rem 0.4rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700, outline: 'none' }}
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setEditStaffEntries((prev) =>
                            prev.map((s, i) => (i === idx ? { ...s, time: getCurrentTimeHHMM() } : s))
                          )
                        }
                        style={{
                          marginTop: '1.1rem',
                          padding: '0.5rem 0.6rem',
                          background: '#e0e7ff',
                          color: '#4f46e5',
                          border: '1px solid #c7d2fe',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.725rem',
                          fontWeight: 800,
                          whiteSpace: 'nowrap',
                        }}
                        title="Set ke Jam Sekarang"
                      >
                        🕒 Now
                      </button>
                      {editStaffEntries.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setEditStaffEntries((prev) => prev.filter((_, i) => i !== idx))}
                          style={{ marginTop: '1.1rem', padding: '0.5rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer' }}
                          title="Hapus Pegawai Ini dari Shift"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      setEditStaffEntries((prev) => [
                        ...prev,
                        { id: `staff-${Date.now()}`, name: '', time: getCurrentTimeHHMM() },
                      ])
                    }
                    style={{
                      alignSelf: 'flex-start',
                      padding: '0.55rem 0.95rem',
                      borderRadius: '10px',
                      border: '1px dashed #4f46e5',
                      background: '#e0e7ff',
                      color: '#4f46e5',
                      fontWeight: 800,
                      fontSize: '0.825rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      marginTop: '0.35rem',
                    }}
                  >
                    <Plus size={16} />
                    + Tambah Pegawai Susulan / Telat
                  </button>
                </div>

                <div style={{ fontSize: '0.75rem', color: '#475569', background: '#f1f5f9', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                  💡 <strong>Catatan:</strong> Pegawai yang menyusul atau terlambat akan dicatat jam masuknya masing-masing dan tersimpan secara otomatis di Laporan Shift (Cetak PDF & Export Excel).
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowEditShiftModal(false)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#475569',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1.5,
                      padding: '0.75rem',
                      borderRadius: '10px',
                      border: 'none',
                      background: '#4f46e5',
                      color: '#ffffff',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
                    }}
                  >
                    <Edit3 size={18} />
                    Simpan Perubahan Tim & Jam
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // TAMPILAN 2: Sesi Shift Aktif Berjalan di Sistem, tetapi Akun Ini Belum Mengaktifkan / Gabung Kas
  if (activeShiftData && activeShiftData.shift.shift_status === 'ACTIVE' && !isUserActivated) {
    const { shift, contributions } = activeShiftData;
    let storedMeta: any = null;
    try {
      const raw = localStorage.getItem(`pos_shift_meta_${shift.shift_id}`);
      if (raw) storedMeta = JSON.parse(raw);
    } catch {}

    const shiftTitle = storedMeta?.shiftName || `Shift Operasional (#${shift.shift_id.slice(-6)})`;

    return (
      <div style={{ maxWidth: '650px', margin: '0 auto' }}>
        <div style={{ background: '#ffffff', padding: '2rem', borderRadius: '24px', border: '1px solid #cbd5e1', boxShadow: '0 12px 36px rgba(15, 23, 42, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#ecfdf5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <UserCheck size={32} />
            </div>
            <div>
              <span className="badge badge-fc" style={{ marginBottom: '0.25rem' }}>SESI SHIFT SEDANG BERJALAN</span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                {shiftTitle}
              </h2>
              <p style={{ fontSize: '0.825rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>
                Shift kas bersama ini sedang diaktifkan oleh tim kasir lain.
              </p>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Total Modal Kas Laci:</span>
              <span style={{ fontWeight: 800, color: '#059669' }}>{formatRupiah(shift.total_initial_cash)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Karyawan Bertugas:</span>
              <span style={{ fontWeight: 800, color: '#4f46e5' }}>{contributions.length} Pengguna Aktif</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <button
              onClick={handleActivateExistingShift}
              style={{
                width: '100%',
                padding: '0.9rem 1.25rem',
                fontSize: '1rem',
                fontWeight: 800,
                color: '#ffffff',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                border: 'none',
                borderRadius: '14px',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <ShieldCheck size={20} />
              🚀 Masuk & Aktifkan Kasir di Shift Ini
            </button>
          </div>
        </div>
      </div>
    );
  }

  // TAMPILAN 3: Belum Ada Shift Aktif -> Form Registrasi & Buka Shift Baru (Clean UI)
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', margin: '0 0 0.35rem 0' }}>
          Sistem Pengelolaan Shift Kasir POS
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>
          Registrasi Sesi Shift, Custom Nama Tim Staff, Jam Masuk & Uang Kas Modal Laci
        </p>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* Rincian Pengembalian Modal setelah Closing Shift (DENGAN BUTTON HAPUS PROMINENT) */}
      {closedShiftResult && (
        <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: '2px solid #16a34a', marginBottom: '2rem', boxShadow: '0 8px 24px rgba(22, 163, 74, 0.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#16a34a', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={22} />
              Rekonsiliasi Shift Selesai - Prosedur Pengembalian Modal Awal
            </h3>
            <button
              onClick={handleDeleteClosedShiftResult}
              title="Hapus / Selesaikan Tampilan Rekonsiliasi Ini"
              style={{
                padding: '0.5rem 1rem',
                background: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.825rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
              }}
            >
              <Trash2 size={16} />
              Hapus Rekonsiliasi Shift
            </button>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '1rem' }}>
            Kas bersama telah direkonsiliasi. Harap kembalikan uang modal fisik kepada masing-masing penyetor di bawah ini:
          </p>

          <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #cbd5e1', color: '#4b5563' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Nama Pegawai Penyetor</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Nominal Modal Wajib Dikembalikan</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center' }}>Status Modal</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {closedShiftResult.contributions.map((c) => (
                  <tr key={c.contribution_id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 700, color: '#0f172a' }}>
                      {getUserDisplayName(c.user_id)}
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 800, color: '#4f46e5' }}>
                      {formatRupiah(c.amount)}
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                      <span className={c.status === 'RETURNED' ? 'badge badge-fc' : 'badge badge-fnb'}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                      {c.status === 'HELD' ? (
                        <button
                          onClick={() => handleReturnCapital(c.contribution_id)}
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            padding: '0.35rem 0.75rem',
                            borderRadius: '8px',
                            background: '#059669',
                            color: '#ffffff',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <RotateCcw size={14} style={{ display: 'inline', marginRight: '4px' }} />
                          Tandai Dikembalikan
                        </button>
                      ) : (
                        <span style={{ color: '#16a34a', fontSize: '0.8rem', fontWeight: 800 }}>✓ Returned</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px dashed #cbd5e1' }}>
            <button
              onClick={handleDeleteClosedShiftResult}
              style={{
                padding: '0.65rem 1.25rem',
                background: '#fee2e2',
                color: '#991b1b',
                border: '1px solid #fecaca',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Trash2 size={16} />
              🗑️ Selesaikan & Hapus Catatan Rekonsiliasi Ini
            </button>
          </div>
        </div>
      )}

      {/* FORM CLEAN BUKA SHIFT BARU (DENGAN DYNAMIC STAFF ARRIVAL TIME INPUTS) */}
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem', background: '#ffffff', borderRadius: '24px', border: '1px solid #cbd5e1', boxShadow: '0 12px 36px rgba(15, 23, 42, 0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.5rem' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: '#ecfdf5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <PlayCircle size={32} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              Registrasi & Buka Sesi Shift Baru
            </h3>
            <p style={{ fontSize: '0.825rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>
              Masukkan nama pegawai bertugas, jam masuk masing-masing, dan modal kas awal.
            </p>
          </div>
        </div>

        <form onSubmit={handleOpenShift} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* 1. DAFTAR TIM PEGAWAI BERTUGAS & JAM MASUK INDIVIDU */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 800, marginBottom: '0.5rem', color: '#0f172a' }}>
              👥 Tim Pegawai Bertugas & Jam Masuk Individu:
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '0.75rem' }}>
              {openStaffEntries.map((staff, idx) => (
                <div key={staff.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      value={staff.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setOpenStaffEntries((prev) => prev.map((s, i) => (i === idx ? { ...s, name: val } : s)));
                      }}
                      placeholder={`Nama Pegawai ${idx + 1} (cth: Dela, Amanda)`}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
                      required={idx === 0}
                    />
                  </div>
                  <div style={{ width: '130px', flexShrink: 0 }}>
                    <input
                      type="time"
                      value={staff.time}
                      onChange={(e) => {
                        const val = e.target.value;
                        setOpenStaffEntries((prev) => prev.map((s, i) => (i === idx ? { ...s, time: val } : s)));
                      }}
                      style={{ width: '100%', padding: '0.65rem 0.6rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700 }}
                      required
                    />
                  </div>
                  {openStaffEntries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setOpenStaffEntries((prev) => prev.filter((_, i) => i !== idx))}
                      style={{ padding: '0.65rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '10px', cursor: 'pointer' }}
                      title="Hapus Pegawai Ini"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setOpenStaffEntries((prev) => [...prev, { id: `staff-${Date.now()}`, name: '', time: getCurrentTimeHHMM() }])}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '10px',
                border: '1px dashed #4f46e5',
                background: '#e0e7ff',
                color: '#4f46e5',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Plus size={15} />
              + Tambah Pegawai Bertugas
            </button>
          </div>

          {/* 2. TANGGAL & JAM UTAMA SHIFT */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 800, marginBottom: '0.4rem', color: '#0f172a' }}>
                📅 Tanggal Shift:
              </label>
              <input
                type="date"
                value={shiftDateInput}
                onChange={(e) => setShiftDateInput(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 800, marginBottom: '0.4rem', color: '#0f172a' }}>
                ⏰ Jam Mulai Shift Utama:
              </label>
              <input
                type="time"
                value={shiftTimeInput}
                onChange={(e) => setShiftTimeInput(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}
                required
              />
            </div>
          </div>

          {/* 3. NOMINAL UANG MODAL KAS AWAL */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 800, marginBottom: '0.4rem', color: '#0f172a' }}>
              💵 Nominal Uang Modal Kas Awal (Rp):
            </label>
            <input
              type="number"
              value={openInitialCash}
              onChange={(e) => setOpenInitialCash(e.target.value === '' ? '' : Number(e.target.value))}
              style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '2px solid #059669', background: '#ffffff', fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', outline: 'none' }}
              min={0}
              step="any"
              required
              placeholder="Contoh: 50000"
            />
          </div>

          <button
            type="submit"
            disabled={openLoading}
            style={{
              width: '100%',
              padding: '0.95rem 1.25rem',
              fontSize: '1rem',
              fontWeight: 800,
              color: '#ffffff',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              border: 'none',
              borderRadius: '14px',
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
              cursor: openLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.55rem',
              transition: 'all 0.15s ease',
              marginTop: '0.5rem',
            }}
          >
            <PlayCircle size={22} />
            {openLoading ? 'Membuka & Mengaktifkan Shift...' : '🚀 Buka & Aktifkan Shift Baru Sekarang'}
          </button>
        </form>
      </div>

      {/* MODAL KONFIRMASI HAPUS REKONSILIASI (ELEGAN, MODERN & SIMPLE) */}
      {showConfirmDeleteReconciliation && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              maxWidth: '460px',
              width: '100%',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8)',
              position: 'relative',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto',
                boxShadow: '0 8px 16px rgba(220, 38, 38, 0.15)',
              }}
            >
              <AlertTriangle size={32} strokeWidth={2.2} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0', letterSpacing: '-0.01em' }}>
              Selesaikan Rekonsiliasi Shift?
            </h3>

            <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.55, marginBottom: '1.75rem' }}>
              Apakah Anda yakin ingin menghapus & menyelesaikan tampilan rekonsiliasi pengembalian modal ini?
              <br /><br />
              <span style={{ fontSize: '0.825rem', color: '#047857', background: '#ecfdf5', padding: '0.5rem 0.85rem', borderRadius: '10px', display: 'inline-block', border: '1px solid #a7f3d0', fontWeight: 700 }}>
                🛡️ Data transaksi & laporan shift tetap tersimpan aman di sistem.
              </span>
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setShowConfirmDeleteReconciliation(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.25rem',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteClosedShiftResult}
                style={{
                  flex: 1.2,
                  padding: '0.75rem 1.25rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Trash2 size={16} />
                Ya, Selesaikan
              </button>
            </div>
          </div>
        </div>
      )}

      <ActionLoadingModal
        isOpen={openLoading || capitalLoading}
        message="Memproses registrasi sesi shift ke backend POS..."
        submessage="Menyiapkan laci kas dan verifikasi hak akses..."
      />
    </div>
  );
};

