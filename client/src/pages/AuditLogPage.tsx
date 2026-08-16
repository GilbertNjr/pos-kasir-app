import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, Lock, Activity } from 'lucide-react';
import { apiService } from '../services/api';
import { User, AuditLog } from '../types';
import { formatWaktuIndo } from '../utils/formatters';

interface AuditLogPageProps {
  currentUser: User;
}

export const AuditLogPage: React.FC<AuditLogPageProps> = ({ currentUser }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getAuditLogs();
      setLogs(data || []);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat audit log sistem');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser.role === 'OWNER') {
      loadAuditLogs();
    }
  }, [currentUser.role]);

  if (currentUser.role !== 'OWNER') {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#64748b' }}>
        <Lock size={48} color="#dc2626" style={{ marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '0.5rem', fontWeight: 800 }}>Akses Dibatasi (Owner Only)</h3>
        <p style={{ maxWidth: '480px', margin: '0 auto', fontSize: '0.875rem', color: '#64748b' }}>
          Halaman Audit Log & Security Trail hanya berhak diakses oleh <strong>OWNER</strong> untuk transparansi operasional.
        </p>
      </div>
    );
  }

  const filteredLogs = logs.filter((log: any) => {
    const query = searchQuery.toLowerCase().trim();
    const username = (log.username || log.user_id || '').toLowerCase();
    const action = (log.action || log.action_type || '').toLowerCase();
    const entity = (log.affected_entity || log.entity_name || '').toLowerCase();
    const details = (log.details || '').toLowerCase();

    const matchQuery =
      !query ||
      username.includes(query) ||
      action.includes(query) ||
      entity.includes(query) ||
      details.includes(query);

    const logActionUpper = (log.action || log.action_type || '').toUpperCase();
    const matchAction = selectedAction === 'ALL' || logActionUpper.includes(selectedAction);

    return matchQuery && matchAction;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.35rem 0' }}>
            <Activity color="#2563eb" size={24} />
            Audit Log Aktivitas & Jejak Keamanan Sistem
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
            Catatan log permanen (read-only) untuk setiap aktivitas krusial kasir dan pengelola toko
          </p>
        </div>

        <button
          onClick={loadAuditLogs}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.875rem',
            fontWeight: 700,
            padding: '0.55rem 1.1rem',
            borderRadius: '10px',
            background: '#2563eb',
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
          }}
        >
          <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          {loading ? 'Memuat...' : 'Refresh Log'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', color: '#dc2626', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* TOOLBAR SEARCH & FILTER */}
      <div
        style={{
          background: '#ffffff',
          padding: '1rem 1.25rem',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Cari berdasarkan user, action, atau detail log..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem 0.5rem 2.4rem',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              outline: 'none',
              color: '#0f172a',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="#64748b" />
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#334155',
              background: '#ffffff',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="ALL">Semua Aktivitas Log</option>
            <option value="INIT">Inisialisasi Sistem</option>
            <option value="LOGIN">Login & Sesi Auth</option>
            <option value="SHIFT">Shift Kasir</option>
            <option value="TRANSACTION">Transaksi POS</option>
            <option value="PRODUCT">Produk & Harga</option>
            <option value="STOCK">Pengelolaan Stok</option>
            <option value="EXPENSE">Pengeluaran Kas</option>
            <option value="BACKUP">Backup & Restore</option>
          </select>
        </div>
      </div>

      {/* AUDIT LOG TABLE CARD */}
      <div
        style={{
          background: '#ffffff',
          padding: '1.5rem',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Catatan Audit Log Terdaftar ({filteredLogs.length})
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 500 }}>
            <Lock size={13} /> Read-Only System Trail
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8', fontSize: '0.875rem' }}>
            Tidak ada catatan log yang cocok dengan pencarian filter Anda.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '0.65rem 0.5rem', fontWeight: 700 }}>Waktu Audit</th>
                  <th style={{ padding: '0.65rem 0.5rem', fontWeight: 700 }}>Pengguna / Kasir</th>
                  <th style={{ padding: '0.65rem 0.5rem', fontWeight: 700 }}>Tindakan (Action)</th>
                  <th style={{ padding: '0.65rem 0.5rem', fontWeight: 700 }}>Entitas & ID</th>
                  <th style={{ padding: '0.65rem 0.5rem', fontWeight: 700 }}>Detail Rincian Deskripsi Log</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log: any, index: number) => {
                  const actionStr = log.action || log.action_type || 'SYSTEM';
                  const username = log.username || 'system';
                  const userId = log.user_id || 'usr-owner-01';
                  const entity = log.affected_entity || 'SYSTEM';
                  const entityId = log.entity_id || 'sys-01';

                  const isBlue = actionStr.includes('INIT') || actionStr.includes('BACKUP');
                  const isRed = actionStr.includes('DELETE') || actionStr.includes('CANCEL');

                  return (
                    <tr key={log.audit_id || index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#64748b', fontSize: '0.775rem', whiteSpace: 'nowrap' }}>
                        {formatWaktuIndo(log.timestamp)}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: '#0f172a' }}>
                        {username}{' '}
                        <span style={{ fontSize: '0.725rem', color: '#94a3b8', fontWeight: 500 }}>
                          ({userId.startsWith('usr-') ? userId : `usr-${userId}`})
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: '4px',
                            fontSize: '0.725rem',
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            background: isBlue
                              ? 'rgba(37,99,235,0.12)'
                              : isRed
                              ? 'rgba(239,68,68,0.12)'
                              : 'rgba(16,185,129,0.12)',
                            color: isBlue ? '#2563eb' : isRed ? '#dc2626' : '#059669',
                          }}
                        >
                          {actionStr}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'monospace', fontSize: '0.775rem', color: '#334155' }}>
                        {entity}{' '}
                        <span style={{ color: '#94a3b8' }}>
                          #{entityId.startsWith('#') ? entityId.slice(1) : entityId.length > 10 ? entityId.slice(-6) : entityId}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#1e293b', fontSize: '0.825rem' }}>
                        {log.details || '-'}
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
  );
};


