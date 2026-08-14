import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, Lock, Activity } from 'lucide-react';
import { apiService } from '../services/api';
import { User } from '../types';
import { formatWaktuIndo } from '../utils/formatters';

interface AuditLogPageProps {
  currentUser: User;
}

export const AuditLogPage: React.FC<AuditLogPageProps> = ({ currentUser }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getAuditLogs();
      setLogs(data);
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
      <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
        <Lock size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Akses Dibatasi (Owner Only)</h3>
        <p style={{ maxWidth: '480px', margin: '0 auto', fontSize: '0.875rem' }}>
          Halaman Audit Log & Security Trail hanya berhak diakses oleh <strong>OWNER</strong> untuk transparansi operasional.
        </p>
      </div>
    );
  }

  const filteredLogs = logs.filter((log) => {
    const query = searchQuery.toLowerCase();
    const matchQuery =
      log.username.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query) ||
      log.affected_entity.toLowerCase().includes(query) ||
      log.details.toLowerCase().includes(query);

    const matchAction = selectedAction === 'ALL' || log.action.includes(selectedAction);

    return matchQuery && matchAction;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity color="var(--primary-500)" />
            Audit Log Aktivitas & Jejak Keamanan Sistem
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Catatan log permanen (read-only) untuk setiap aktivitas krusial kasir dan pengelola toko
          </p>
        </div>

        <button onClick={loadAuditLogs} disabled={loading} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
          <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          {loading ? 'Memuat...' : 'Refresh Log'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* Toolbar Filter & Search */}
      <div style={{ background: 'var(--bg-card)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Cari berdasarkan user, action, atau detail log..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.45rem 0.6rem 0.45rem 2.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="var(--text-secondary)" />
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            style={{ padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
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

      {/* Table Audit Logs */}
      <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem' }}>Catatan Audit Log Terdaftar ({filteredLogs.length})</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Lock size={12} /> Read-Only System Trail
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Tidak ada catatan log yang cocok dengan pencarian filter Anda.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.6rem 0.5rem', textAlign: 'left' }}>Waktu Audit</th>
                  <th style={{ padding: '0.6rem 0.5rem', textAlign: 'left' }}>Pengguna / Kasir</th>
                  <th style={{ padding: '0.6rem 0.5rem', textAlign: 'left' }}>Tindakan (Action)</th>
                  <th style={{ padding: '0.6rem 0.5rem', textAlign: 'left' }}>Entitas & ID</th>
                  <th style={{ padding: '0.6rem 0.5rem', textAlign: 'left' }}>Detail Rincian Deskripsi Log</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.audit_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      {formatWaktuIndo(log.timestamp)}
                    </td>
                    <td style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>
                      {log.username} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({log.user_id})</span>
                    </td>
                    <td style={{ padding: '0.6rem 0.5rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          background:
                            log.action.includes('INIT') || log.action.includes('BACKUP')
                              ? 'rgba(37,99,235,0.15)'
                              : log.action.includes('DELETE') || log.action.includes('CANCEL')
                              ? 'rgba(239,68,68,0.15)'
                              : 'rgba(16,185,129,0.15)',
                          color:
                            log.action.includes('INIT') || log.action.includes('BACKUP')
                              ? 'var(--primary-600)'
                              : log.action.includes('DELETE') || log.action.includes('CANCEL')
                              ? 'var(--danger)'
                              : 'var(--success)',
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '0.6rem 0.5rem', fontFamily: 'monospace', fontSize: '0.775rem' }}>
                      {log.affected_entity} <span style={{ color: 'var(--text-muted)' }}>#{log.entity_id.slice(-6)}</span>
                    </td>
                    <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
