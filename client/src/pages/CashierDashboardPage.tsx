import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Receipt,
  DollarSign,
  Clock,
  UserCheck,
  PlusCircle,
  CreditCard,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import { apiService, ActiveShiftDetailsData } from '../services/api';
import { User, Transaction } from '../types';
import { formatRupiah, formatWaktuIndo } from '../utils/formatters';

interface CashierDashboardPageProps {
  currentUser: User;
  activeShiftId?: string | null;
  onNavigateTab: (tab: string) => void;
  onTriggerToast?: (type: 'success' | 'danger' | 'info' | 'warning', title: string, message: string) => void;
  onShiftStatusChange?: () => void;
}

export const CashierDashboardPage: React.FC<CashierDashboardPageProps> = ({
  currentUser,
  activeShiftId,
  onNavigateTab,
  onTriggerToast,
  onShiftStatusChange,
}) => {
  const [loading, setLoading] = useState(true);
  const [shiftData, setShiftData] = useState<ActiveShiftDetailsData | null>(null);
  const [myTransactions, setMyTransactions] = useState<Transaction[]>([]);
  const [showCapitalModal, setShowCapitalModal] = useState(false);
  const [capitalInput, setCapitalInput] = useState('');
  const [submittingCapital, setSubmittingCapital] = useState(false);

  const fetchCashierDashboardData = async () => {
    setLoading(true);
    try {
      const activeData = await apiService.getActiveShift();
      setShiftData(activeData);

      if (activeData?.shift?.shift_id) {
        const txList = await apiService.getTransactions(activeData.shift.shift_id);
        // Filter transactions created by this current cashier user
        const mine = (txList || []).filter((t: Transaction) => t.created_by_user_id === currentUser.user_id);
        setMyTransactions(mine);
      }
    } catch (err: any) {
      console.error('Gagal memuat dashboard kasir karyawan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashierDashboardData();
  }, []);

  const handleActivateOrOpenShift = () => {
    if (activeShiftId) {
      // User shift is already active, navigate to shift management
      onNavigateTab('SHIFT');
      return;
    }

    if (shiftData?.shift?.shift_status === 'ACTIVE') {
      // An active shift exists in system, activate for this employee
      sessionStorage.setItem(`pos_shift_activated_${currentUser.user_id}`, shiftData.shift.shift_id);
      if (onTriggerToast) {
        onTriggerToast('success', 'Shift Berhasil Diaktifkan', `Sesi shift #${shiftData.shift.shift_id.slice(-6)} telah aktif untuk Anda.`);
      }
      if (onShiftStatusChange) onShiftStatusChange();
      fetchCashierDashboardData();
    } else {
      // No active shift in backend, go to shift open page
      onNavigateTab('SHIFT');
    }
  };

  const handleAddCapital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftData?.shift?.shift_id) return;
    const amount = parseFloat(capitalInput);
    if (isNaN(amount) || amount <= 0) {
      if (onTriggerToast) onTriggerToast('danger', 'Input Salah', 'Nominal modal harus lebih dari 0.');
      return;
    }

    setSubmittingCapital(true);
    try {
      await apiService.addCapitalContribution(shiftData.shift.shift_id, amount);
      sessionStorage.setItem(`pos_shift_activated_${currentUser.user_id}`, shiftData.shift.shift_id);
      if (onTriggerToast) onTriggerToast('success', 'Modal Disetor', 'Kontribusi modal awal berhasil dicatat.');
      setShowCapitalModal(false);
      setCapitalInput('');
      if (onShiftStatusChange) onShiftStatusChange();
      fetchCashierDashboardData();
    } catch (err: any) {
      if (onTriggerToast) onTriggerToast('danger', 'Gagal Setor Modal', err.message || 'Terjadi kesalahan.');
    } finally {
      setSubmittingCapital(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        <Clock size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '0.5rem' }} />
        <p style={{ fontWeight: 600 }}>Memuat Dashboard Kasir Operasional...</p>
      </div>
    );
  }

  const shift = shiftData?.shift;
  const isShiftActiveForUser = Boolean(activeShiftId);

  // Calculate stats for logged-in cashier
  const myTotalRevenue = myTransactions.reduce((acc, curr) => acc + (curr.status === 'COMPLETED' ? curr.final_total : 0), 0);
  const myContribution = (shiftData?.contributions || [])
    .filter((c) => c.user_id === currentUser.user_id)
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. WELCOME KASIR HERO CARD */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '1.75rem 2rem',
          border: '1px solid #cbd5e1',
          boxShadow: '0 8px 30px rgba(15, 23, 42, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <span
              style={{
                background: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '0.3rem 0.75rem',
                borderRadius: '9999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <UserCheck size={14} />
              KARYAWAN / KASIR OPERASIONAL
            </span>

            {isShiftActiveForUser ? (
              <span
                style={{
                  background: '#ecfdf5',
                  color: '#047857',
                  border: '1px solid #a7f3d0',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '0.3rem 0.75rem',
                  borderRadius: '9999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                SHIFT AKTIF ({shift?.shift_id ? `# ${shift.shift_id.slice(-6)}` : 'ACTIVE'})
              </span>
            ) : (
              <span
                style={{
                  background: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '0.3rem 0.75rem',
                  borderRadius: '9999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                BELUM ADA SHIFT AKTIF
              </span>
            )}
          </div>

          <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.35rem 0', letterSpacing: '-0.02em' }}>
            Halo, {currentUser.full_name}! 👋
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 600, margin: 0 }}>
            Siap melayani pelanggan toko dengan cepat dan akurat.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleActivateOrOpenShift}
            style={{
              padding: '0.85rem 1.25rem',
              borderRadius: '12px',
              border: '1px solid #7e22ce',
              background: 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              boxShadow: '0 4px 14px rgba(126, 34, 206, 0.3)',
              transition: 'all 0.15s ease',
            }}
          >
            <Clock size={20} />
            {isShiftActiveForUser ? 'Kelola Sesi Shift' : 'Mulai / Buka Shift'}
          </button>

          <button
            onClick={() => onNavigateTab('POS')}
            style={{
              padding: '0.85rem 1.5rem',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
              transition: 'all 0.15s ease',
            }}
          >
            <ShoppingCart size={20} />
            Mulai Transaksi Baru
          </button>
        </div>
      </div>

      {/* 2. REKAP KINERJA INDIVIDU KASIR */}
      <div className="responsive-kpi-grid">
        <div className="responsive-kpi-card" style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Transaksi Diproses Saya</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', background: '#e0e7ff', color: '#4338ca' }}><Receipt size={18} /></div>
          </div>
          <div className="kpi-value" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{myTransactions.length} Transaksi</div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Sesi shift aktif saat ini</span>
        </div>

        <div className="responsive-kpi-card" style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Total Omzet Saya</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', background: '#dcfce7', color: '#15803d' }}><TrendingUp size={18} /></div>
          </div>
          <div className="kpi-value" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#15803d' }}>{formatRupiah(myTotalRevenue)}</div>
          <span style={{ fontSize: '0.75rem', color: '#16a34a' }}>Omzet dari penjualan saya</span>
        </div>

        <div className="responsive-kpi-card" style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Modal Awal Disetor Saya</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', background: '#fef3c7', color: '#b45309' }}><DollarSign size={18} /></div>
          </div>
          <div className="kpi-value" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#b45309' }}>{formatRupiah(myContribution)}</div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Kontribusi modal kasir</span>
        </div>
      </div>

      {/* 3. TOMBOL AKSI CEPAT KASIR (2-COLUMN GRID ON MOBILE, COMPACT & ACCESSIBLE) */}
      <div style={{ background: '#ffffff', padding: '1.25rem 1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 1rem 0', color: '#0f172a' }}>Navigasi Cepat Kasir</h3>
        <div className="responsive-shortcut-grid">
          <button
            onClick={() => onNavigateTab('POS')}
            className="responsive-shortcut-card"
            style={{
              padding: '1rem',
              borderRadius: '16px',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(16,185,129,0.3)' }}>
              <ShoppingCart size={20} />
            </div>
            <div className="shortcut-title" style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>Kasir Register</div>
            <span className="shortcut-desc" style={{ fontSize: '0.75rem', color: '#64748b' }}>Proses transaksi pelanggan baru</span>
          </button>

          {shift?.shift_status === 'ACTIVE' && (
            <button
              onClick={() => setShowCapitalModal(true)}
              className="responsive-shortcut-card"
              style={{
                padding: '1rem',
                borderRadius: '16px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
              }}
            >
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#f59e0b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(245,158,11,0.3)' }}>
                <PlusCircle size={20} />
              </div>
              <div className="shortcut-title" style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>Setor Modal Awal</div>
              <span className="shortcut-desc" style={{ fontSize: '0.75rem', color: '#64748b' }}>Input modal laci kasir</span>
            </button>
          )}

          <button
            onClick={() => onNavigateTab('EXPENSES')}
            className="responsive-shortcut-card"
            style={{
              padding: '1rem',
              borderRadius: '16px',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ef4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(239,68,68,0.3)' }}>
              <Receipt size={20} />
            </div>
            <div className="shortcut-title" style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>Catat Pengeluaran</div>
            <span className="shortcut-desc" style={{ fontSize: '0.75rem', color: '#64748b' }}>Input pengeluaran dari laci kas</span>
          </button>

          <button
            onClick={() => onNavigateTab('PAYMENT')}
            className="responsive-shortcut-card"
            style={{
              padding: '1rem',
              borderRadius: '16px',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>
              <CreditCard size={20} />
            </div>
            <div className="shortcut-title" style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>Rekap Pembayaran</div>
            <span className="shortcut-desc" style={{ fontSize: '0.75rem', color: '#64748b' }}>Rekap transaksi tunai & QRIS</span>
          </button>
        </div>
      </div>

      {/* 4. DAFTAR TRANSAKSI RECENT SAYA */}
      <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} color="#10b981" />
          Riwayat Transaksi Terbaru Saya ({myTransactions.length})
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {myTransactions.length > 0 ? (
            myTransactions.slice(0, 5).map((tx) => (
              <div
                key={tx.transaction_id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>{tx.transaction_number}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {formatWaktuIndo(tx.transaction_time)} • <span style={{ fontWeight: 600 }}>{tx.payment_method}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#15803d' }}>{formatRupiah(tx.final_total)}</div>
                  <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 700 }}>{tx.status}</span>
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', margin: '1rem 0' }}>
              Belum ada transaksi yang diproses oleh Anda pada shift ini.
            </p>
          )}
        </div>
      </div>

      {/* 5. MODAL SETOR MODAL AWAL */}
      {showCapitalModal && shift && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '400px', width: '100%', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#0f172a' }}>Input Kontribusi Modal Awal</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Masukkan nominal uang modal yang Anda serahkan ke laci kas untuk kembalian awal.
            </p>

            <form onSubmit={handleAddCapital}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Nominal Modal (Rp)
                </label>
                <input
                  type="number"
                  placeholder="Contoh: 100000"
                  value={capitalInput}
                  onChange={(e) => setCapitalInput(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', fontWeight: 700 }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCapitalModal(false)}
                  style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingCapital}
                  style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', background: '#10b981', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                  {submittingCapital ? 'Menyimpan...' : 'Simpan Modal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
