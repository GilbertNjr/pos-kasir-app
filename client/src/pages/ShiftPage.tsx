import React, { useState, useEffect } from 'react';
import { ShoppingBag, DollarSign, CheckCircle2, RotateCcw, PlayCircle, Printer, FileSpreadsheet } from 'lucide-react';
import { apiService, ActiveShiftDetailsData } from '../services/api';
import { User } from '../types';
import { formatRupiah, formatWaktuIndo } from '../utils/formatters';
import { ActionLoadingModal } from '../components/common/ActionLoadingModal';
import { exportShiftToExcel, printShiftPDF } from '../utils/shiftReportExporter';


interface ShiftPageProps {
  currentUser: User;
  onShiftStatusChange?: () => void;
}

export const ShiftPage: React.FC<ShiftPageProps> = ({ currentUser, onShiftStatusChange }) => {
  const [activeShiftData, setActiveShiftData] = useState<ActiveShiftDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State Buka Shift
  const [openInitialCash, setOpenInitialCash] = useState<number | string>(50000);
  const [openLoading, setOpenLoading] = useState(false);

  // Form State Setor Modal Tambahan
  const [addCapitalAmount, setAddCapitalAmount] = useState<number | string>(50000);
  const [capitalLoading, setCapitalLoading] = useState(false);

  // Status Setelah Tutup Shift (Rincian Return Capital)
  const [closedShiftResult, setClosedShiftResult] = useState<ActiveShiftDetailsData | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    apiService.getUsers().then((res) => {
      if (Array.isArray(res)) setAllUsers(res);
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
      if (data?.shift) {
        // Active shift loaded
      }
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

      const dutyUsers = activeShiftData.contributions.map((c) => getUserDisplayName(c.user_id));

      printShiftPDF({
        storeName: 'KEDAI KOPI SENJA & PRINTING',
        dateStr: new Date(activeShiftData.shift.start_time).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        shiftId: `Shift #${activeShiftData.shift.shift_id.slice(-6)}`,
        dutyUsers: dutyUsers.length > 0 ? dutyUsers : [currentUser.full_name],
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

      const dutyUsers = activeShiftData.contributions.map((c) => getUserDisplayName(c.user_id));

      exportShiftToExcel({
        storeName: 'KEDAI KOPI SENJA & PRINTING',
        dateStr: new Date(activeShiftData.shift.start_time).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        shiftId: `Shift #${activeShiftData.shift.shift_id.slice(-6)}`,
        dutyUsers: dutyUsers.length > 0 ? dutyUsers : [currentUser.full_name],
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
      const data = await apiService.openShift(Number(openInitialCash));
      setActiveShiftData(data);
      setClosedShiftResult(null);
      if (onShiftStatusChange) onShiftStatusChange();
    } catch (err: any) {
      setError(err.message || 'Gagal membuka shift');
    } finally {
      setOpenLoading(false);
    }
  };

  const handleAddCapital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShiftData) return;
    try {
      setCapitalLoading(true);
      setError(null);
      await apiService.addCapitalContribution(activeShiftData.shift.shift_id, Number(addCapitalAmount));
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

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Memuat status sesi shift...</div>;
  }

  // TAMPILAN 1: Sesi Shift Aktif Berjalan (Shared Cash Drawer & Closing Panel)
  if (activeShiftData && activeShiftData.shift.shift_status === 'ACTIVE') {
    const { shift, contributions } = activeShiftData;

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="badge badge-fc" style={{ marginBottom: '0.25rem' }}>SHIFT SESI ACTIVE</span>
            <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a', fontWeight: 800 }}>
              <ShoppingBag color="#059669" />
              Laci Kas Bersama (Shift #{shift.shift_id.slice(-6)})
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Dimulai pada {formatWaktuIndo(shift.start_time)} | Dikelola secara kolektif
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
      </div>
    );
  }

  // TAMPILAN 2: Sesi Shift Belum Dibuka / Setelah Tutup Shift (Form Buka Shift & Return Capital Summary)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag color="#059669" />
            Manajemen Sesi Shift & Modal Awal
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>
            Model Shared Cash Drawer dengan Dukungan Kontribusi Modal Multi-User
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

      {/* Form Buka Shift Baru */}
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '2rem', background: '#ffffff', borderRadius: '20px', border: '1px solid #cbd5e1', boxShadow: '0 12px 36px rgba(0, 0, 0, 0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#ecfdf5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <PlayCircle size={28} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
              Buka Sesi Shift Baru
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>
              Shift tidak otomatis aktif. Buka shift untuk memulai transaksi kasir.
            </p>
          </div>
        </div>

        {/* Informational Card (Hari, Tanggal, Jam, Kasir Pembuka) */}
        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '1.25rem', fontSize: '0.825rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
            <span>👤 Kasir Pembuka (PJ):</span>
            <strong style={{ color: '#0f172a' }}>{currentUser.full_name} ({currentUser.role})</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
            <span>📅 Hari & Tanggal:</span>
            <strong style={{ color: '#4f46e5' }}>
              {['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][new Date().getDay()]}, {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
            <span>⏰ Waktu Registrasi:</span>
            <strong style={{ color: '#047857' }}>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</strong>
          </div>
        </div>

        <form onSubmit={handleOpenShift}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 800, marginBottom: '0.5rem', color: '#0f172a' }}>
              Nominal Uang Modal Kas Awal (Rp):
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

            <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '0.65rem', lineHeight: 1.4 }}>
              📌 Data tanggal, hari, waktu, dan modal awal kas ini akan disimpan secara otomatis di database untuk audit & laporan shift.
            </span>
          </div>

          <button
            type="submit"
            disabled={openLoading}
            style={{
              width: '100%',
              padding: '0.85rem 1.25rem',
              fontSize: '1rem',
              fontWeight: 800,
              color: '#ffffff',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
              cursor: openLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.15s ease',
            }}
          >
            <PlayCircle size={20} />
            {openLoading ? 'Membuka Shift...' : '🚀 Buka Shift Baru Sekarang'}
          </button>
        </form>
      </div>

      <ActionLoadingModal
        isOpen={openLoading || capitalLoading}
        message="Memproses transaksi sesi shift ke backend POS..."
        submessage="Menghubungi server untuk verifikasi laci kas..."
      />
    </div>
  );
};

