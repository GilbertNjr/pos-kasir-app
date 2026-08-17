import React, { useState, useEffect } from 'react';
import { ShoppingBag, DollarSign, Lock, CheckCircle2, ShieldAlert, RotateCcw, PlayCircle } from 'lucide-react';
import { apiService, ActiveShiftDetailsData } from '../services/api';
import { User } from '../types';
import { formatRupiah, formatWaktuIndo } from '../utils/formatters';
import { ActionLoadingModal } from '../components/common/ActionLoadingModal';


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

  // Form State Tutup Shift & Rekonsiliasi
  const [physicalCash, setPhysicalCash] = useState<number | string>(0);
  const [closeLoading, setCloseLoading] = useState(false);

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
        setPhysicalCash(data.shift.theoretical_cash);
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

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShiftData) return;
    try {
      setCloseLoading(true);
      setError(null);
      await apiService.closeShift(activeShiftData.shift.shift_id, Number(physicalCash));

      // Ambil snapshot data terakhir untuk tampilan Rincian Pengembalian Modal
      setClosedShiftResult({ ...activeShiftData });
      setActiveShiftData(null);
      if (onShiftStatusChange) onShiftStatusChange();
    } catch (err: any) {
      setError(err.message || 'Gagal menutup shift');
    } finally {
      setCloseLoading(false);
    }
  };

  const handleReturnCapital = async (contributionId: string) => {
    try {
      await apiService.returnCapitalContribution(contributionId);
      if (closedShiftResult) {
        const updated = closedShiftResult.contributions.map((c) =>
          c.contribution_id === contributionId ? { ...c, status: 'RETURNED' as const } : c
        );
        setClosedShiftResult({ ...closedShiftResult, contributions: updated });
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
    const isPJ = shift.shift_leader_user_id === currentUser.user_id;
    const canClose = true; // Seluruh kasir / karyawan & PJ berwenang menutup shift

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

          {/* Panel Right: Rekonsiliasi & Closing Shift (PJ Shift / Owner Only) */}
          <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
              <Lock size={20} color="#dc2626" />
              Tutup Shift & Rekonsiliasi Kas Bersama
            </h3>

            <div style={{ marginBottom: '1rem', padding: '0.85rem', background: isPJ ? '#faf5ff' : '#f8fafc', borderRadius: '12px', fontSize: '0.85rem', border: isPJ ? '1px solid #d8b4fe' : '1px solid #e2e8f0' }}>
              <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0f172a', marginBottom: '0.25rem', fontWeight: 800 }}>
                <span style={{ background: '#7e22ce', color: '#ffffff', padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 900 }}>
                  ⭐ PJ SHIFT
                </span>
                Penanggung Jawab: <strong style={{ color: '#6b21a8' }}>{getUserDisplayName(shift.shift_leader_user_id)}</strong>
              </p>
              <p style={{ fontSize: '0.75rem', color: '#6b21a8', fontWeight: 600, margin: 0 }}>
                ✅ Seluruh staf kasir (PJ, Karyawan, & Owner) berwenang untuk menyetor modal dan menutup shift kasir.
              </p>
            </div>

            {canClose ? (
              <form onSubmit={handleCloseShift}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.35rem', color: '#0f172a' }}>
                    Hitung Uang Fisik Aktual di Laci Kas (Rp):
                  </label>
                  <input
                    type="number"
                    value={physicalCash}
                    onChange={(e) => setPhysicalCash(e.target.value === '' ? '' : Number(e.target.value))}
                    style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}
                    min={0}
                    step={1000}
                    required
                  />
                </div>

                {/* Ringkasan Kas Teoritis */}
                <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1rem', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ color: '#4b5563', fontWeight: 600 }}>Kas Teoritis System:</span>
                    <strong style={{ color: '#4f46e5' }}>{formatRupiah(shift.theoretical_cash)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#4b5563', fontWeight: 600 }}>Proyeksi Selisih Kas:</span>
                    <strong style={{ color: ((Number(physicalCash) || 0) - shift.theoretical_cash) === 0 ? '#16a34a' : ((Number(physicalCash) || 0) - shift.theoretical_cash) > 0 ? '#2563eb' : '#dc2626' }}>
                      {formatRupiah((Number(physicalCash) || 0) - shift.theoretical_cash)}
                    </strong>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={closeLoading}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1.25rem',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
                    cursor: closeLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Lock size={18} />
                  {closeLoading ? 'Memproses Closing & Rekonsiliasi...' : 'Tutup Shift & Eksekusi Rekonsiliasi'}
                </button>
              </form>
            ) : (
              <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={20} />
                <span>Tombol closing dikunci. Hanya Penanggung Jawab Shift ({getUserDisplayName(shift.shift_leader_user_id)}) yang dapat mengeksekusi rekonsiliasi kas.</span>
              </div>
            )}
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
      <div style={{ maxWidth: '540px', margin: '0 auto', padding: '2rem', background: '#ffffff', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.06)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PlayCircle size={24} color="#059669" />
          Buka Shift Sesi Baru
        </h3>
        <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '1.5rem', lineHeight: 1.4 }}>
          Anda (<strong>{currentUser.full_name}</strong>) akan terdaftar sebagai <strong>Penanggung Jawab Shift</strong> dan memasukkan setoran modal kas awal pertama.
        </p>

        <form onSubmit={handleOpenShift}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>
              Setoran Modal Kas Awal Saya (Rp):
            </label>
            <input
              type="number"
              value={openInitialCash}
              onChange={(e) => setOpenInitialCash(e.target.value === '' ? '' : Number(e.target.value))}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}
              min={0}
              step={5000}
              required
            />
            <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginTop: '0.4rem' }}>
              Karyawan lain yang bergabung di shift ini dapat menambah modal tambahan kemudian.
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
            {openLoading ? 'Membuka Shift...' : 'Buka Shift Baru Sekarang'}
          </button>
        </form>
      </div>

      <ActionLoadingModal
        isOpen={openLoading || capitalLoading || closeLoading}
        message="Memproses transaksi sesi shift ke backend POS..."
        submessage="Menghubungi server untuk verifikasi laci kas..."
      />
    </div>
  );
};

