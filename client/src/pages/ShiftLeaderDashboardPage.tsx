import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Receipt,
  TrendingUp,
  Clock,
  Download,
  Activity,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  Database,
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
  onNavigateTab,
  onTriggerToast,
}) => {
  const [loading, setLoading] = useState(true);
  const [shiftData, setShiftData] = useState<ActiveShiftDetailsData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const fetchLeaderDashboardData = async () => {
    try {
      const [activeData, usersList] = await Promise.all([
        apiService.getActiveShift().catch(() => null),
        apiService.getUsers().catch(() => []),
      ]);

      setShiftData(activeData);
      setAllUsers(usersList || []);

      if (activeData?.shift?.shift_id) {
        const txList = await apiService.getTransactions(activeData.shift.shift_id).catch(() => []);
        setTransactions(txList || []);
      } else {
        setTransactions([]);
      }
    } catch (err: any) {
      console.error('Gagal memuat dashboard Penanggung Jawab:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderDashboardData();

    // SSE Real-time Updates Listener
    let sse: EventSource | null = null;
    try {
      sse = new EventSource('/api/events');
      sse.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (
            ['SHIFT_OPENED', 'SHIFT_CLOSED', 'TRANSACTION_CREATED', 'USER_CREATED', 'USER_UPDATED'].includes(parsed.type)
          ) {
            fetchLeaderDashboardData();
          }
        } catch {}
      };
    } catch (err) {
      console.warn('SSE connection unavailable, using 5s polling fallback:', err);
    }

    // Polling fallback every 5s for real-time cashier login detection
    const pollInterval = setInterval(() => {
      fetchLeaderDashboardData();
    }, 5000);

    return () => {
      if (sse) sse.close();
      clearInterval(pollInterval);
    };
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
        <Clock size={36} style={{ animation: 'spin 1s linear infinite', marginBottom: '0.75rem', color: '#4f46e5' }} />
        <p style={{ fontWeight: 700, fontSize: '1rem', color: '#334155' }}>Memuat Monitoring Shift Real-Time...</p>
      </div>
    );
  }

  const shift = shiftData?.shift;
  const isShiftActive = shift?.shift_status === 'ACTIVE';
  const totalSalesRevenue = transactions.reduce((acc, curr) => acc + (curr.status === 'COMPLETED' ? curr.final_total : 0), 0);

  // Determine Active User IDs Set dynamically
  const activeUserIdsSet = new Set<string>();
  if (isShiftActive && shift) {
    if (shift.opened_by_user_id) activeUserIdsSet.add(shift.opened_by_user_id);
    if (shift.shift_leader_user_id) activeUserIdsSet.add(shift.shift_leader_user_id);
    if (currentUser?.user_id) activeUserIdsSet.add(currentUser.user_id);

    if (shiftData?.shift_users && Array.isArray(shiftData.shift_users)) {
      shiftData.shift_users.forEach((su: any) => {
        if (su.user_id) activeUserIdsSet.add(su.user_id);
      });
    }

    transactions.forEach((tx) => {
      if (tx.created_by_user_id) activeUserIdsSet.add(tx.created_by_user_id);
    });
  }

  // Active Users List
  const activeUsersList = allUsers.filter((u) => activeUserIdsSet.has(u.user_id));

  // Helper for Duration calculation
  const getShiftDuration = (startTimeIso?: string): string => {
    if (!startTimeIso) return 'Active Sesi';
    const startMs = new Date(startTimeIso).getTime();
    const nowMs = Date.now();
    const diffMs = Math.max(0, nowMs - startMs);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m`;
    }
    return `${mins}m`;
  };

  // Helper for Role Label
  const getUserRoleLabel = (user: User, shiftLeaderId?: string): string => {
    if (user.user_id === shiftLeaderId) {
      return user.role === 'OWNER' ? 'Owner (PJ Shift)' : 'Kasir Senior (PJ Leader)';
    }
    if (user.role === 'OWNER') return 'Owner';
    if (user.role === 'PENANGGUNG_JAWAB') return 'Penanggung Jawab Shift';
    return 'Kasir';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* 1. HEADER SECTION (CLEAN & ELEGANT) */}
      <div className="payment-header-card">
        <div className="payment-header-title">
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Activity size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              Manajemen & Monitoring Shift
            </h2>
          </div>
        </div>

        <div className="payment-header-actions">
          <button
            onClick={() => onNavigateTab && onNavigateTab('BACKUP')}
            className="btn-toolbar-secondary"
            style={{ padding: '0.6rem 1.1rem', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}
          >
            <Database size={16} />
            Backup & Restore
          </button>
          <button
            onClick={() => onTriggerToast && onTriggerToast('info', 'Ekspor PDF', 'Fitur ekspor laporan PDF disiapkan.')}
            className="btn-toolbar-secondary"
            style={{ padding: '0.6rem 1.1rem' }}
          >
            <Download size={16} />
            Export Data
          </button>
        </div>
      </div>

      {/* 2. TOP 4 METRICS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '0.85rem' }}>
        {/* Card 1: Total Pegawai Sistem */}
        <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>Total Pegawai</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.2rem', letterSpacing: '-0.03em' }}>
            {allUsers.length || 1}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>Staff terdaftar di sistem</span>
        </div>

        {/* Card 2: Kasir / Pegawai Aktif Shift */}
        <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>Kasir Aktif</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <UserCheck size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.2rem', letterSpacing: '-0.03em' }}>
            {activeUsersList.length} <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>/ {allUsers.length || 1}</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: isShiftActive ? '#16a34a' : '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <CheckCircle2 size={12} /> Status: {isShiftActive ? 'On Duty Real-Time' : 'Shift Non-Aktif'}
          </span>
        </div>

        {/* Card 3: Transaksi Shift Ini */}
        <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>Transaksi Shift Ini</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ffedd5', color: '#c2410c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Receipt size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.2rem', letterSpacing: '-0.03em' }}>
            {transactions.length}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <TrendingUp size={12} /> Total Omzet: {formatRupiah(totalSalesRevenue)}
          </span>
        </div>

        {/* Card 4: Saldo Kas Laci Teoritis */}
        <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>Saldo Kas Laci Teoritis</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <DollarSign size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#4338ca', marginBottom: '0.2rem', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {formatRupiah(shift?.theoretical_cash || 0)}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>Target Uang di Laci</span>
        </div>
      </div>

      {/* 3. MIDDLE SECTION GRID (MONITOR TERMINAL AKTIF VS LOG AKTIVITAS SHIFT) */}
      <div className="responsive-main-grid">
        {/* LEFT COLUMN: MONITOR TERMINAL KASIR AKTIF */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Monitor Terminal Kasir Aktif ({activeUsersList.length})
            </h3>
          </div>

          {!isShiftActive || activeUsersList.length === 0 ? (
            <div style={{ background: '#ffffff', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
              <AlertCircle size={32} style={{ color: '#94a3b8', marginBottom: '0.5rem' }} />
              <p style={{ fontWeight: 700, margin: '0 0 0.25rem 0', color: '#334155' }}>Belum ada Kasir yang On Duty</p>
              <span style={{ fontSize: '0.85rem' }}>Saat ini tidak ada sesi shift aktif atau kasir yang terdeteksi login.</span>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {activeUsersList.map((user, index) => {
                // Calculate total revenue for this specific user in the current shift
                const userSales = transactions
                  .filter((t) => t.created_by_user_id === user.user_id && t.status === 'COMPLETED')
                  .reduce((sum, t) => sum + t.final_total, 0);

                const roleLabel = getUserRoleLabel(user, shift?.shift_leader_user_id);
                const isOpener = user.user_id === shift?.opened_by_user_id || user.user_id === shift?.shift_leader_user_id;
                const terminalTitle = isOpener ? 'POS - Kasir Utama' : `POS - Terminal ${index + 1}`;

                return (
                  <div key={user.user_id} style={{ background: '#ffffff', padding: '1.35rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.15rem 0' }}>{terminalTitle}</h4>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{roleLabel}</span>
                      </div>
                      <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.68rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '20px', letterSpacing: '0.02em' }}>
                        ONLINE
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: isOpener ? '#4f46e5' : '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', overflow: 'hidden', flexShrink: 0 }}>
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          user.full_name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.full_name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          Mulai: {shift ? formatWaktuIndo(shift.start_time).split(',')[1] || '08:00 AM' : '08:00 AM'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f1f5f9', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Sales Sementara</span>
                        <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{formatRupiah(userSales)}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Durasi</span>
                        <span style={{ fontSize: '1rem', fontWeight: 800, color: '#4f46e5' }}>{getShiftDuration(shift?.start_time)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: LOG AKTIVITAS SHIFT */}
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
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Status Shift: {isShiftActive ? 'Aktif Berjalan' : 'Non-Aktif / Closed'}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {shift ? `Dipandu oleh PJ Shift: ${activeUsersList.find(u => u.user_id === shift.shift_leader_user_id)?.full_name || currentUser.full_name}` : 'Belum ada shift dibuka'}
                </div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>{shift ? formatWaktuIndo(shift.start_time) : 'Real-time monitoring'}</span>
              </div>
            </div>

            {/* Log Item 2 */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <DollarSign size={16} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Modal Kas Awal Shift</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Nominal kas awal {formatRupiah(shift?.total_initial_cash || 0)} dicatat di laci</div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Shift Leader verified</span>
              </div>
            </div>

            {/* Log Item 3 */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Clock size={16} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Aktivitas Penjualan Shift</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Berhasil mencatat {transactions.length} transaksi penjualan</div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Real-time status</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM TABLE SECTION: DAFTAR SHIFT & KEHADIRAN KASIR */}
      <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Daftar Shift & Kehadiran Kasir
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
            Total Pegawai Sistem: <strong>{allUsers.length}</strong> (Aktif On Duty: <strong style={{ color: '#16a34a' }}>{activeUsersList.length}</strong>)
          </span>
        </div>

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
              {allUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                    Belum ada pegawai terdaftar dalam sistem.
                  </td>
                </tr>
              ) : (
                allUsers.map((user) => {
                  const isOnDuty = isShiftActive && activeUserIdsSet.has(user.user_id);
                  const roleLabel = getUserRoleLabel(user, shift?.shift_leader_user_id);

                  // Compute user specific sales revenue in active shift
                  const userSales = transactions
                    .filter((t) => t.created_by_user_id === user.user_id && t.status === 'COMPLETED')
                    .reduce((sum, t) => sum + t.final_total, 0);

                  const isOpener = user.user_id === shift?.opened_by_user_id || user.user_id === shift?.shift_leader_user_id;

                  return (
                    <tr key={user.user_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: isOnDuty ? (isOpener ? '#4f46e5' : '#059669') : '#94a3b8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', overflow: 'hidden', flexShrink: 0 }}>
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              user.full_name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{user.full_name}</div>
                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              @{user.username}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#334155' }}>
                        {roleLabel}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ background: isOnDuty ? '#dcfce7' : '#f1f5f9', color: isOnDuty ? '#15803d' : '#64748b', fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                          • {isOnDuty ? 'On Duty' : 'Off Duty'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: isOnDuty ? '#475569' : '#94a3b8' }}>
                        {isOnDuty && shift ? (formatWaktuIndo(shift.start_time).split(',')[1] || '08:00 AM') : '-'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: isOnDuty ? '#475569' : '#94a3b8' }}>
                        {isOnDuty ? getShiftDuration(shift?.start_time) : '-'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 800, color: isOnDuty ? '#0f172a' : '#94a3b8' }}>
                        {isOnDuty ? formatRupiah(userSales) : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

