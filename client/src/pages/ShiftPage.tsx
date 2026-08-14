import React, { useState, useEffect } from 'react';
import { ShoppingBag, DollarSign, Lock, CheckCircle2, UserCheck, ShieldAlert, ArrowDownLeft, RotateCcw } from 'lucide-react';
import { apiService, ActiveShiftDetailsData } from '../services/api';
import { User } from '../types';
import { formatRupiah, formatWaktuIndo } from '../utils/formatters';

interface ShiftPageProps {
  currentUser: User;
  onShiftStatusChange?: () => void;
}

export const ShiftPage: React.FC<ShiftPageProps> = ({ currentUser, onShiftStatusChange }) => {
  const [activeShiftData, setActiveShiftData] = useState<ActiveShiftDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State Buka Shift
  const [openInitialCash, setOpenInitialCash] = useState<number>(50000);
  const [openLoading, setOpenLoading] = useState(false);

  // Form State Setor Modal Tambahan
  const [addCapitalAmount, setAddCapitalAmount] = useState<number>(50000);
  const [capitalLoading, setCapitalLoading] = useState(false);

  // Form State Tutup Shift & Rekonsiliasi
  const [physicalCash, setPhysicalCash] = useState<number>(0);
  const [closeLoading, setCloseLoading] = useState(false);

  // Status Setelah Tutup Shift (Rincian Return Capital)
  const [closedShiftResult, setClosedShiftResult] = useState<ActiveShiftDetailsData | null>(null);

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
    const isOwner = currentUser.role === 'OWNER';
    const canClose = isPJ || isOwner;

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="badge badge-fc" style={{ marginBottom: '0.25rem' }}>SHIFT SESI ACTIVE</span>
            <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingBag color="var(--success)" />
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

        {/* Dynamic Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Modal Kas Awal Bersama</span>
            <h3 style={{ fontSize: '1.35rem', color: 'var(--primary-600)', marginTop: '0.25rem' }}>{formatRupiah(shift.total_initial_cash)}</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{contributions.length} Setoran Karyawan</p>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Penjualan Tunai Bersih</span>
            <h3 style={{ fontSize: '1.35rem', color: 'var(--success)', marginTop: '0.25rem' }}>{formatRupiah(shift.net_cash_sales)}</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Seluruh Transaksi Shift</p>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Pengeluaran Kas</span>
            <h3 style={{ fontSize: '1.35rem', color: 'var(--danger)', marginTop: '0.25rem' }}>{formatRupiah(shift.total_cash_expenses)}</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Biaya Operasional Toko</p>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-500)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--primary-700)', fontWeight: 700 }}>Saldo Kas Teoritis Bersama</span>
            <h3 style={{ fontSize: '1.35rem', color: 'var(--primary-700)', marginTop: '0.25rem' }}>{formatRupiah(shift.theoretical_cash)}</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Uang Fisik Wajib Ada di Laci</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Panel Left: Tabel Setoran Modal Multi-User */}
          <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DollarSign size={20} color="var(--primary-500)" />
              Rincian Setoran Modal Karyawan (Multi-User)
            </h3>

            {contributions.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Belum ada setoran modal awal pada shift ini.</p>
            ) : (
              <div style={{ overflowX: 'auto', marginBottom: '1.25rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>User ID</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>Nominal Setoran</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contributions.map((c) => (
                      <tr key={c.contribution_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.5rem', fontWeight: 600 }}>{c.user_id}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 700, color: 'var(--primary-600)' }}>
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
            <form onSubmit={handleAddCapital} style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Tambah Setoran Modal Saya ({currentUser.username}):
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="number"
                  value={addCapitalAmount}
                  onChange={(e) => setAddCapitalAmount(Number(e.target.value))}
                  style={{ flex: 1, padding: '0.45rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                  min={1000}
                  step={5000}
                  required
                />
                <button type="submit" className="btn-primary" disabled={capitalLoading} style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem' }}>
                  {capitalLoading ? 'Menyimpan...' : '+ Setor Modal'}
                </button>
              </div>
            </form>
          </div>

          {/* Panel Right: Rekonsiliasi & Closing Shift (PJ Shift / Owner Only) */}
          <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={20} color="var(--primary-500)" />
              Tutup Shift & Rekonsiliasi Kas Bersama
            </h3>

            <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
              <p style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                <UserCheck size={16} color="var(--primary-600)" />
                Penanggung Jawab Shift: <strong>{shift.shift_leader_user_id}</strong>
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {isPJ ? '✅ Anda bertugas sebagai Penanggung Jawab Shift ini.' : isOwner ? '👑 Anda dapat melakukan override sebagai Owner.' : '⚠️ Hanya PJ Shift yang diizinkan melakukan closing.'}
              </p>
            </div>

            {canClose ? (
              <form onSubmit={handleCloseShift}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Hitung Uang Fisik Aktual di Laci Kas (Rp):
                  </label>
                  <input
                    type="number"
                    value={physicalCash}
                    onChange={(e) => setPhysicalCash(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '1.1rem', fontWeight: 700 }}
                    min={0}
                    required
                  />
                </div>

                <div style={{ padding: '0.75rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span>Kas Teoritis System:</span>
                    <strong style={{ color: 'var(--primary-600)' }}>{formatRupiah(shift.theoretical_cash)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Proyeksi Selisih Kas:</span>
                    <strong style={{ color: physicalCash - shift.theoretical_cash >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {formatRupiah(physicalCash - shift.theoretical_cash)}
                    </strong>
                  </div>
                </div>

                <button type="submit" className="btn-primary" disabled={closeLoading} style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}>
                  {closeLoading ? 'Memproses Closing & Rekonsiliasi...' : 'Tutup Shift & Eksekusi Rekonsiliasi'}
                </button>
              </form>
            ) : (
              <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={20} />
                <span>Tombol closing dikunci. Hanya Penanggung Jawab Shift ({shift.shift_leader_user_id}) yang dapat mengeksekusi rekonsiliasi kas.</span>
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
          <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag color="var(--primary-500)" />
            Manajemen Sesi Shift & Modal Awal
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
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
        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--success)', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--success)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={22} />
            Rekonsiliasi Shift Selesai - Prosedur Pengembalian Modal Awal
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Kas bersama telah direkonsiliasi. Harap kembalikan uang modal fisik kepada masing-masing penyetor di bawah ini:
          </p>

          <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>User Penyetor</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Nominal Modal Wajib Dikembalikan</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center' }}>Status Modal</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {closedShiftResult.contributions.map((c) => (
                  <tr key={c.contribution_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 600 }}>{c.user_id}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 700, color: 'var(--primary-600)' }}>
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
                          className="btn-primary"
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                        >
                          <RotateCcw size={14} style={{ display: 'inline', marginRight: '4px' }} />
                          Tandai Dikembalikan
                        </button>
                      ) : (
                        <span style={{ color: 'var(--success)', fontSize: '0.8rem', fontWeight: 600 }}>✓ Returned</span>
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
      <div className="card-glass" style={{ maxWidth: '540px', margin: '0 auto', padding: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowDownLeft size={22} color="var(--primary-500)" />
          Buka Shift Sesi Baru
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Anda ({currentUser.full_name}) akan terdaftar sebagai <strong>Penanggung Jawab Shift</strong> dan memasukkan setoran modal kas awal pertama.
        </p>

        <form onSubmit={handleOpenShift}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Setoran Modal Kas Awal Saya (Rp):
            </label>
            <input
              type="number"
              value={openInitialCash}
              onChange={(e) => setOpenInitialCash(Number(e.target.value))}
              style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '1.1rem', fontWeight: 700 }}
              min={0}
              step={5000}
              required
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
              Karyawan lain yang bergabung di shift ini dapat menambah modal tambahan kemudian.
            </span>
          </div>

          <button type="submit" className="btn-primary" disabled={openLoading} style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}>
            {openLoading ? 'Membuka Shift...' : 'Buka Shift Baru Sekarang'}
          </button>
        </form>
      </div>
    </div>
  );
};
