import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Receipt,
  TrendingUp,
  Clock,
  Lock,
  Download,
  Activity,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import { apiService, ActiveShiftDetailsData } from '../services/api';
import { User, Transaction } from '../types';
import { formatRupiah, formatWaktuIndo } from '../utils/formatters';

interface ShiftLeaderDashboardPageProps {
  currentUser: User;
  onNavigateTab?: (tab: string) => void;
  onTriggerToast?: (type: 'success' | 'danger' | 'info' | 'warning', title: string, message: string) => void;
}

export const ShiftLeaderDashboardPage: React.FC<ShiftLeaderDashboardPageProps> = ({
  currentUser,
  onTriggerToast,
}) => {
  const [loading, setLoading] = useState(true);
  const [shiftData, setShiftData] = useState<ActiveShiftDetailsData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [actualCashInput, setActualCashInput] = useState<string>('');
  const [processingClose, setProcessingClose] = useState(false);

  const fetchLeaderDashboardData = async () => {
    setLoading(true);
    try {
      const activeData = await apiService.getActiveShift();
      setShiftData(activeData);

      if (activeData?.shift?.shift_id) {
        const txList = await apiService.getTransactions(activeData.shift.shift_id);
        setTransactions(txList || []);
      }


    } catch (err: any) {
      console.error('Gagal memuat dashboard Penanggung Jawab:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderDashboardData();
  }, []);

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftData?.shift?.shift_id) return;
    const actualCash = parseFloat(actualCashInput);
    if (isNaN(actualCash) || actualCash < 0) {
      if (onTriggerToast) onTriggerToast('danger', 'Input Tidak Valid', 'Nominal uang fisik tidak boleh kosong atau minus.');
      return;
    }

    setProcessingClose(true);
    try {
      await apiService.closeShift(shiftData.shift.shift_id, actualCash);
      if (onTriggerToast) onTriggerToast('success', 'Shift Ditutup', 'Rekonsiliasi kas dan closure shift berhasil disimpan.');
      setShowCloseModal(false);
      fetchLeaderDashboardData();
    } catch (err: any) {
      if (onTriggerToast) onTriggerToast('danger', 'Gagal Tutup Shift', err.message || 'Terjadi kesalahan saat closing shift');
    } finally {
      setProcessingClose(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
        <Clock size={36} style={{ animation: 'spin 1s linear infinite', marginBottom: '0.75rem', color: '#4f46e5' }} />
        <p style={{ fontWeight: 700, fontSize: '1rem', color: '#334155' }}>Memuat Monitoring Shift Real-Time...</p>
      </div>
    );
  }

  const shift = shiftData?.shift;
  const isShiftLeader = shift?.shift_leader_user_id === currentUser.user_id;
  const totalSalesRevenue = transactions.reduce((acc, curr) => acc + (curr.status === 'COMPLETED' ? curr.final_total : 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* 1. HEADER SECTION (MATCHING SCREENSHOT DESKTOPSHIFT) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem 0', letterSpacing: '-0.03em' }}>
            Manajemen & Monitoring Shift
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>
            Pantau aktivitas kasir dan kinerja shift secara real time.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={() => onTriggerToast && onTriggerToast('info', 'Ekspor PDF', 'Fitur ekspor laporan PDF disiapkan.')}
            style={{
              padding: '0.65rem 1.15rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            <Download size={16} />
            Export Data
          </button>

          {shift?.shift_status === 'ACTIVE' && isShiftLeader && (
            <button
              onClick={() => setShowCloseModal(true)}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                background: '#4f46e5',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
              }}
            >
              <Lock size={16} />
              Tutup Shift & Rekonsiliasi
            </button>
          )}
        </div>
      </div>

      {/* 2. TOP 4 METRICS CARDS (SESUAI GAMBAR REFERENSI: Total Pegawai, Kasir Aktif, Transaksi Shift Ini, Saldo Kas) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        {/* Card 1: Total Pegawai */}
        <div style={{ background: '#ffffff', padding: '1.35rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Total Pegawai</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem', letterSpacing: '-0.03em' }}>
            {shiftData?.usersCount || 1}
          </div>
          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>Staff terdaftar di shift</span>
        </div>

        {/* Card 2: Kasir Aktif */}
        <div style={{ background: '#ffffff', padding: '1.35rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Kasir Aktif</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem', letterSpacing: '-0.03em' }}>
            {shiftData?.usersCount || 1} <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 600 }}>/ 4</span>
          </div>
          <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <CheckCircle2 size={13} /> Status: Optimal
          </span>
        </div>

        {/* Card 3: Transaksi Shift Ini */}
        <div style={{ background: '#ffffff', padding: '1.35rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Transaksi Shift Ini</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ffedd5', color: '#c2410c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem', letterSpacing: '-0.03em' }}>
            {transactions.length}
          </div>
          <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
            <TrendingUp size={14} /> Total Omzet: {formatRupiah(totalSalesRevenue)}
          </span>
        </div>

        {/* Card 4: Saldo Kas Teoritis */}
        <div style={{ background: '#ffffff', padding: '1.35rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Saldo Kas Laci Teoritis</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4338ca', marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>
            {formatRupiah(shift?.theoretical_cash || 0)}
          </div>
          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>Target Fisik Uang di Laci</span>
        </div>
      </div>

      {/* 3. MIDDLE SECTION GRID (MONITOR TERMINAL AKTIF VS LOG AKTIVITAS SHIFT) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem' }}>
        {/* LEFT COLUMN: MONITOR TERMINAL KASIR AKTIF */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Monitor Terminal Aktif
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {/* Terminal Card 1 (PJ Leader Budi) */}
            <div style={{ background: '#ffffff', padding: '1.35rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.15rem 0' }}>POS - Kasir Utama</h4>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Terminal 01</span>
                </div>
                <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.68rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '20px', letterSpacing: '0.02em' }}>
                  ONLINE
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                  {currentUser.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>{currentUser.full_name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Mulai: {shift ? formatWaktuIndo(shift.start_time).split(',')[1] || '08:00 AM' : '08:00 AM'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f1f5f9', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Sales Sementara</span>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{formatRupiah(totalSalesRevenue)}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Durasi</span>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#4f46e5' }}>Active</span>
                </div>
              </div>
            </div>

            {/* Terminal Card 2 (Kasir Siti Aminah) */}
            <div style={{ background: '#ffffff', padding: '1.35rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.15rem 0' }}>POS - Lantai 2</h4>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Terminal 03</span>
                </div>
                <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.68rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '20px', letterSpacing: '0.02em' }}>
                  ONLINE
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                  S
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>Siti Aminah</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Mulai: 09:30 AM</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f1f5f9', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Sales Sementara</span>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Rp 1.850.000</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Durasi</span>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#059669' }}>02h 45m</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LOG AKTIVITAS SHIFT (MATCHING SCREENSHOT TIMELINE) */}
        <div style={{ background: '#ffffff', padding: '1.35rem', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Log Aktivitas Shift
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Log Item 1 */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Activity size={16} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Shift Started</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>POS - Kasir Utama oleh {currentUser.full_name}</div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Hari ini, {shift ? formatWaktuIndo(shift.start_time).split(',')[1] : '08:00 AM'}</span>
              </div>
            </div>

            {/* Log Item 2 */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <DollarSign size={16} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Setoran Modal Initial</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Modal kas awal Rp {shift?.total_initial_cash || 50000} dicatat</div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Shift Leader verified</span>
              </div>
            </div>

            {/* Log Item 3 */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Clock size={16} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Monitoring Kas Drawer</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Laci kas beroperasi normal ({transactions.length} transaksi)</div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Real-time status</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM TABLE SECTION (MATCHING SCREENSHOT: DAFTAR SHIFT & KEHADIRAN) */}
      <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1.25rem 0' }}>
          Daftar Shift & Kehadiran Kasir
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Nama & ID</th>
                <th style={{ padding: '0.75rem 1rem' }}>Peran</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status Shift</th>
                <th style={{ padding: '0.75rem 1rem' }}>Mulai Shift</th>
                <th style={{ padding: '0.75rem 1rem' }}>Durasi</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Performa (Sales)</th>
              </tr>
            </thead>
            <tbody>
              {/* Row 1: PJ Leader (Budi Santoso) */}
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                      {currentUser.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{currentUser.full_name}</div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>EMP-0142</span>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#334155' }}>Kasir Senior (PJ Leader)</td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                    • On Duty
                  </span>
                </td>
                <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>
                  {shift ? formatWaktuIndo(shift.start_time).split(',')[1] || '08:00 AM' : '08:00 AM'}
                </td>
                <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>Active Sesi</td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                  {formatRupiah(totalSalesRevenue)}
                </td>
              </tr>

              {/* Row 2: Siti Aminah */}
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                      S
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>Siti Aminah</div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>EMP-0103</span>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#334155' }}>Kasir</td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.65rem', borderRadius: '12px' }}>
                    • On Duty
                  </span>
                </td>
                <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>09:30 AM</td>
                <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>02h 45m</td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                  Rp 1.850.000
                </td>
              </tr>

              {/* Row 3: Dwi Wahyuni */}
              <tr>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#94a3b8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                      D
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>Dwi Wahyuni</div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>EMP-0201</span>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#334155' }}>Supervisor Shift</td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.65rem', borderRadius: '12px' }}>
                    • Off Duty
                  </span>
                </td>
                <td style={{ padding: '0.85rem 1rem', color: '#94a3b8' }}>-</td>
                <td style={{ padding: '0.85rem 1rem', color: '#94a3b8' }}>-</td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 800, color: '#94a3b8' }}>
                  -
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MODAL CLOSING SHIFT & REKONSILIASI KAS */}
      {showCloseModal && shift && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '440px', width: '100%', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#0f172a' }}>Tutup Shift & Rekonsiliasi Kas</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Masukkan jumlah fisik uang tunai aktual yang dihitung di dalam laci kas saat ini.
            </p>

            <form onSubmit={handleCloseShift}>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem', color: '#475569' }}>
                  <span>Saldo Kas Teoritis:</span>
                  <span style={{ fontWeight: 700, color: '#4338ca' }}>{formatRupiah(shift.theoretical_cash || 0)}</span>
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Uang Fisik Aktual di Laci (Rp)
                </label>
                <input
                  type="number"
                  placeholder="Masukkan nominal hasil hitung fisik..."
                  value={actualCashInput}
                  onChange={(e) => setActualCashInput(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', fontWeight: 700 }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={processingClose}
                  style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                  {processingClose ? 'Memproses...' : 'Tutup Shift Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
