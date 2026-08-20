import React, { useState, useEffect } from 'react';
import { ShoppingBag, DollarSign, CheckCircle2, RotateCcw, PlayCircle, Printer, FileSpreadsheet, ShieldCheck, UserCheck, Power, X } from 'lucide-react';
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

export const ShiftPage: React.FC<ShiftPageProps> = ({ currentUser, onShiftStatusChange, storeName }) => {
  const [activeShiftData, setActiveShiftData] = useState<ActiveShiftDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Enhanced Form State Buka Shift Baru (Default Empty "")
  const [openInitialCash, setOpenInitialCash] = useState<number | string>('');
  const [shiftNameOption, setShiftNameOption] = useState<string>('Shift Pagi (08:00 - 16:00)');
  const [customShiftName, setCustomShiftName] = useState<string>('');
  const [shiftDateInput, setShiftDateInput] = useState<string>(getTodayDateString());
  const [shiftTimeInput, setShiftTimeInput] = useState<string>(getCurrentTimeString());
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [openLoading, setOpenLoading] = useState(false);

  // Form State Setor Modal Tambahan (Default Empty "")
  const [addCapitalAmount, setAddCapitalAmount] = useState<number | string>('');
  const [capitalLoading, setCapitalLoading] = useState(false);

  // Form & Modal State Tutup Shift
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [actualPhysicalCash, setActualPhysicalCash] = useState<number | string>('');
  const [closeLoading, setCloseLoading] = useState(false);

  // Status Setelah Tutup Shift (Rincian Return Capital)
  const [closedShiftResult, setClosedShiftResult] = useState<ActiveShiftDetailsData | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    apiService.getUsers().then((res) => {
      if (Array.isArray(res)) {
        setAllUsers(res);
        if (selectedStaffIds.length === 0 && currentUser?.user_id) {
          setSelectedStaffIds([currentUser.user_id]);
        }
      }
    }).catch(() => {});
  }, [currentUser]);

  const toggleStaffSelection = (userId: string) => {
    setSelectedStaffIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

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

      const finalShiftName = shiftNameOption === 'CUSTOM' ? (customShiftName || 'Shift Operasional Custom') : shiftNameOption;
      const initialCashNum = Number(openInitialCash) || 0;

      const data = await apiService.openShift(initialCashNum);

      if (data?.shift?.shift_id) {
        const dutyStaffNames = selectedStaffIds.map((id) => getUserDisplayName(id));
        const meta = {
          shiftName: finalShiftName,
          date: shiftDateInput,
          time: shiftTimeInput,
          dutyStaffNames: dutyStaffNames.length > 0 ? dutyStaffNames : [currentUser.full_name],
          initialCash: initialCashNum,
        };
        localStorage.setItem(`pos_shift_meta_${data.shift.shift_id}`, JSON.stringify(meta));
        sessionStorage.setItem(`pos_shift_activated_${currentUser.user_id}`, data.shift.shift_id);
      }

      setActiveShiftData(data);
      setClosedShiftResult(null);
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
        setClosedShiftResult({
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

      setClosedShiftResult({
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
    const dutyStaffList = storedMeta?.dutyStaffNames || contributions.map((c) => getUserDisplayName(c.user_id));

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
              Laci Kas Bersama (Shift #{shift.shift_id.slice(-6)})
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Dimulai pada: {storedMeta?.date ? `${storedMeta.date} | Jam ${storedMeta.time} WIB (Kustom)` : formatWaktuIndo(shift.start_time)} | Tim On-Duty: {dutyStaffList.join(', ') || currentUser.full_name}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
                      <th style={{ padding: '0.5rem', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contributions.map((c) => (
                      <tr key={c.contribution_id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.5rem', fontWeight: 700, color: '#0f172a' }}>
                          {getUserDisplayName(c.user_id)}
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 800, color: '#4f46e5' }}>
                          {formatRupiah(c.amount)}
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                          <span className="badge badge-fnb">{c.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Form Input Modal Tambahan */}
            <form onSubmit={handleAddCapital} style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', color: '#0f172a' }}>
                Tambah Setoran Modal Saya ({currentUser.full_name}):
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="number"
                  value={addCapitalAmount}
                  onChange={(e) => setAddCapitalAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  style={{ flex: 1, padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', fontWeight: 700 }}
                  min={1000}
                  step={5000}
                  required
                />
                <button
                  type="submit"
                  disabled={capitalLoading}
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    padding: '0.45rem 0.9rem',
                    color: '#ffffff',
                    background: '#4f46e5',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: capitalLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  {capitalLoading ? 'Menyimpan...' : '+ Setor Modal'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* MODAL / REKONSILIASI TUTUP SHIFT */}
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
                maxWidth: '520px',
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
                    🛑 Tutup Shift & Rekonsiliasi Kas Laci
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>
                    Selesaikan sesi shift #{shift.shift_id.slice(-6)} dan hitung uang fisik di laci kas.
                  </p>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#475569' }}>
                  <span>Modal Kas Awal:</span>
                  <strong style={{ color: '#4f46e5' }}>{formatRupiah(shift.total_initial_cash)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#475569' }}>
                  <span>Penjualan Tunai Shift:</span>
                  <strong style={{ color: '#059669' }}>+ {formatRupiah(shift.net_cash_sales)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#475569' }}>
                  <span>Pengeluaran Kas Shift:</span>
                  <strong style={{ color: '#dc2626' }}>- {formatRupiah(shift.total_cash_expenses)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '0.5rem', marginTop: '0.5rem', fontWeight: 800 }}>
                  <span style={{ color: '#0f172a' }}>Kas Teoritis (Uang Fisik Seharusnya):</span>
                  <strong style={{ color: '#5b21b6', fontSize: '1rem' }}>{formatRupiah(shift.theoretical_cash)}</strong>
                </div>
              </div>

              <form onSubmit={handleCloseShiftSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.35rem', color: '#0f172a' }}>
                    Hitung Uang Fisik Real di Laci (Rp):
                  </label>
                  <input
                    type="number"
                    value={actualPhysicalCash}
                    onChange={(e) => setActualPhysicalCash(e.target.value === '' ? '' : Number(e.target.value))}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '2px solid #dc2626', fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', outline: 'none' }}
                    min={0}
                    required
                  />

                  {/* Selisih Indicator */}
                  {actualPhysicalCash !== '' && (
                    <div style={{ marginTop: '0.55rem', fontSize: '0.8rem', fontWeight: 700 }}>
                      {Number(actualPhysicalCash) - shift.theoretical_cash === 0 ? (
                        <span style={{ color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.25rem 0.65rem', borderRadius: '8px' }}>✓ Uang Pas / Balanced (Tidak ada selisih)</span>
                      ) : Number(actualPhysicalCash) - shift.theoretical_cash > 0 ? (
                        <span style={{ color: '#0284c7', background: '#f0f9ff', border: '1px solid #bae6fd', padding: '0.25rem 0.65rem', borderRadius: '8px' }}>
                          + {formatRupiah(Number(actualPhysicalCash) - shift.theoretical_cash)} (Surplus / Kas Lebih)
                        </span>
                      ) : (
                        <span style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', padding: '0.25rem 0.65rem', borderRadius: '8px' }}>
                          - {formatRupiah(Math.abs(Number(actualPhysicalCash) - shift.theoretical_cash))} (Defisit / Kas Kurang)
                        </span>
                      )}
                    </div>
                  )}
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
      </div>
    );
  }

  // TAMPILAN 2: Shift Aktif Sudah Dibuka di Backend, tapi Belum Diaktifkan oleh Pegawai Ini
  if (activeShiftData && activeShiftData.shift.shift_status === 'ACTIVE' && !isUserActivated) {
    return (
      <div style={{ maxWidth: '620px', margin: '1.5rem auto', padding: '2rem', background: '#ffffff', borderRadius: '20px', border: '1px solid #c084fc', boxShadow: '0 12px 36px rgba(126, 34, 206, 0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#f3e8ff', color: '#7e22ce', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShieldCheck size={28} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
              Sesi Shift Aktif Terdeteksi di Kasir (# {activeShiftData.shift.shift_id.slice(-6)})
            </h3>
            <p style={{ fontSize: '0.825rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
              Shift telah dibuka oleh PJ/Kasir Senior. Harap aktifkan sesi Anda untuk bergabung ke laci kas bersama.
            </p>
          </div>
        </div>

        <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
            <span>👤 Kasir Pembuka Shift:</span>
            <strong style={{ color: '#0f172a' }}>{getUserDisplayName(activeShiftData.shift.opened_by_user_id)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
            <span>⏰ Jam Dimulai:</span>
            <strong style={{ color: '#047857' }}>{formatWaktuIndo(activeShiftData.shift.start_time)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
            <span>💵 Modal Laci Terdaftar:</span>
            <strong style={{ color: '#4f46e5' }}>{formatRupiah(activeShiftData.shift.total_initial_cash)}</strong>
          </div>
        </div>

        <button
          onClick={handleActivateExistingShift}
          style={{
            width: '100%',
            padding: '0.9rem 1.25rem',
            fontSize: '1rem',
            fontWeight: 800,
            color: '#ffffff',
            background: 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 4px 14px rgba(126, 34, 206, 0.35)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.55rem',
            transition: 'all 0.15s ease',
          }}
        >
          <UserCheck size={20} />
          ⚡ Aktifkan & Bergabung Sesi Shift Ini Now
        </button>
      </div>
    );
  }

  // TAMPILAN 3: Sesi Shift Belum Dibuka Sama Sekali (FORM LENGKAP BUKA SHIFT BARU & MODAL)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag color="#059669" />
            Manajemen Sesi Shift & Modal Awal
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>
            Model Shared Cash Drawer dengan Registrasi Sesi, Jam Custom, Staff On-Duty & Modal Kas Awal
          </p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* Rincian Pengembalian Modal setelah Closing Shift */}
      {closedShiftResult && (
        <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #16a34a', marginBottom: '2rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.15rem', color: '#16a34a', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={22} />
            Rekonsiliasi Shift Selesai - Prosedur Pengembalian Modal Awal
          </h3>
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
        </div>
      )}

      {/* FORM LENGKAP BUKA SHIFT BARU */}
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '2rem', background: '#ffffff', borderRadius: '24px', border: '1px solid #cbd5e1', boxShadow: '0 12px 36px rgba(15, 23, 42, 0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: '#ecfdf5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <PlayCircle size={32} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              Registrasi & Buka Sesi Shift Baru
            </h3>
            <p style={{ fontSize: '0.825rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>
              Lengkapi detail sesi shift, nama shift, jam masuk, staff bertugas, dan modal kas awal.
            </p>
          </div>
        </div>

        <form onSubmit={handleOpenShift} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* 1. NAMA / SESI SHIFT */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 800, marginBottom: '0.4rem', color: '#0f172a' }}>
              🏷️ Nama / Sesi Shift:
            </label>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              {[
                'Shift Pagi (08:00 - 16:00)',
                'Shift Siang (12:00 - 20:00)',
                'Shift Malam (16:00 - 24:00)',
                'Shift Full Day',
                'CUSTOM',
              ].map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => setShiftNameOption(opt)}
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: '10px',
                    border: shiftNameOption === opt ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                    background: shiftNameOption === opt ? '#eff6ff' : '#ffffff',
                    color: shiftNameOption === opt ? '#1d4ed8' : '#334155',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {opt === 'CUSTOM' ? '✏️ Kustom Nama' : opt}
                </button>
              ))}
            </div>

            {shiftNameOption === 'CUSTOM' && (
              <input
                type="text"
                value={customShiftName}
                onChange={(e) => setCustomShiftName(e.target.value)}
                placeholder="Contoh: Shift Event Khusus / Fast Shift"
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1.5px solid #4f46e5', fontSize: '0.9rem', fontWeight: 700 }}
                required
              />
            )}
          </div>

          {/* 2. TANGGAL & JAM MULAI SHIFT (CUSTOM TIME & TODAY DATE) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 800, marginBottom: '0.4rem', color: '#0f172a' }}>
                📅 Tanggal Shift (Mengikuti Tgl):
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
                ⏰ Jam Mulai Shift (Bisa Custom):
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

          {/* 3. PEGAWAI / KASIR ON-DUTY SHIFT INI */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 800, marginBottom: '0.4rem', color: '#0f172a' }}>
              👥 Pegawai / Staff On-Duty (Nama Shift):
            </label>
            <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto' }}>
              {allUsers.length === 0 ? (
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Memuat daftar pegawai...</span>
              ) : (
                allUsers.map((u) => {
                  const isChecked = selectedStaffIds.includes(u.user_id);
                  return (
                    <label key={u.user_id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleStaffSelection(u.user_id)}
                        style={{ width: '16px', height: '16px', accentColor: '#4f46e5', cursor: 'pointer' }}
                      />
                      <span>{u.full_name} ({u.role})</span>
                      {u.user_id === currentUser.user_id && (
                        <span style={{ fontSize: '0.7rem', color: '#4f46e5', background: '#e0e7ff', padding: '0.1rem 0.4rem', borderRadius: '6px' }}>Saya (Pembuka)</span>
                      )}
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* 4. NOMINAL UANG MODAL KAS AWAL */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 800, marginBottom: '0.4rem', color: '#0f172a' }}>
              💵 Nominal Uang Modal Kas Awal (Rp):
            </label>
            <input
              type="number"
              value={openInitialCash}
              onChange={(e) => setOpenInitialCash(e.target.value === '' ? '' : Number(e.target.value))}
              style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '2px solid #4f46e5', background: '#ffffff', fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', outline: 'none' }}
              min={0}
              step={5000}
              required
              placeholder="Contoh: 50000"
            />

            {/* Quick Capital Preset Chips */}
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.65rem', flexWrap: 'wrap' }}>
              {[50000, 100000, 200000, 500000].map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setOpenInitialCash(amt)}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: '8px',
                    border: openInitialCash === amt ? '1.5px solid #4f46e5' : '1px solid #cbd5e1',
                    background: openInitialCash === amt ? '#eff6ff' : '#ffffff',
                    color: openInitialCash === amt ? '#1d4ed8' : '#334155',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {formatRupiah(amt)}
                </button>
              ))}
            </div>
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

      <ActionLoadingModal
        isOpen={openLoading || capitalLoading}
        message="Memproses registrasi sesi shift ke backend POS..."
        submessage="Menyiapkan laci kas dan verifikasi hak akses..."
      />
    </div>
  );
};

