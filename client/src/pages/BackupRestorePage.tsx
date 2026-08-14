import React, { useState, useEffect } from 'react';
import { Database, Download, Upload, ShieldAlert, CheckCircle, RefreshCw, AlertTriangle, HardDrive } from 'lucide-react';
import { apiService } from '../services/api';
import { User } from '../types';
import { formatWaktuIndo } from '../utils/formatters';

interface BackupRestorePageProps {
  currentUser: User;
}

export const BackupRestorePage: React.FC<BackupRestorePageProps> = ({ currentUser }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Restore State
  const [restoreJsonInput, setRestoreJsonInput] = useState('');
  const [restoreLoading, setRestoreLoading] = useState(false);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getBackupHistory();
      setHistory(data);
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil riwayat backup');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser.role === 'OWNER') {
      loadHistory();
    }
  }, [currentUser.role]);

  const handleExportBackup = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);

      const snapshot = await apiService.exportBackup();

      // Trigger automatic JSON file download to owner device
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(snapshot, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `pos_backup_${snapshot.backup_id}_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setSuccessMsg(`Backup snapshot data ID: ${snapshot.backup_id} berhasil dibuat dan diunduh.`);
      await loadHistory();
    } catch (err: any) {
      setError(err.message || 'Gagal memproses backup data');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreJsonInput.trim()) {
      alert('Harap tempelkan teks JSON snapshot backup terlebih dahulu.');
      return;
    }

    if (!window.confirm('PERINGATAN: Apakah Anda yakin ingin merestore data database dari snapshot ini?')) {
      return;
    }

    try {
      setRestoreLoading(true);
      setError(null);
      setSuccessMsg(null);

      const parsedSnapshot = JSON.parse(restoreJsonInput);
      const result = await apiService.restoreBackup(parsedSnapshot);

      setSuccessMsg(
        `Pemulihan data berhasil! Produk baru ditambahkan: ${result.restored_counts.products}, Stok diperbarui: ${result.restored_counts.stocks}.`
      );
      setRestoreJsonInput('');
    } catch (err: any) {
      setError(err.message || 'Format JSON snapshot tidak valid atau gagal diproses');
    } finally {
      setRestoreLoading(false);
    }
  };

  if (currentUser.role !== 'OWNER') {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
        <ShieldAlert size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Akses Dibatasi (Owner Only)</h3>
        <p style={{ maxWidth: '480px', margin: '0 auto', fontSize: '0.875rem' }}>
          Mekanisme Backup & Restore Snapshot Database POS hanya berhak dilakukan oleh pemilik usaha (<strong>OWNER</strong>).
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database color="var(--primary-500)" />
            Pusat Backup & Restore Snapshot Data
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Buat salinan cadangan snapshot sistem (JSON Export) dan pulihkan data saat dibutuhkan
          </p>
        </div>

        <button onClick={loadHistory} disabled={loading} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
          <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          {loading ? 'Memuat...' : 'Refresh Riwayat'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.1)', color: 'var(--success)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid Panel Action: Create Backup & Restore Snapshot & Google Sheets Sync */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Card Buat Backup */}
        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Download size={20} color="var(--primary-500)" />
              Buat Backup Snapshot Manual
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Ekspor seluruh data master produk, transaksi, shift, pengeluaran, dan stok fisik ke dalam format file JSON aman.
            </p>
          </div>

          <button
            onClick={handleExportBackup}
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <HardDrive size={18} />
            {loading ? 'Memproses Snapshot...' : '💾 Download Backup JSON Snapshot'}
          </button>
        </div>

        {/* Card Sinkronisasi Google Sheets */}
        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success)' }}>
              <HardDrive size={20} />
              Integrasi Google Sheets Database
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Sinkronkan seluruh baris transaksi, produk, shift, pengeluaran, dan audit log langsung ke baris spreadsheet Google Drive Anda.
            </p>
          </div>

          <button
            onClick={async () => {
              try {
                setLoading(true);
                setError(null);
                setSuccessMsg(null);
                const res = await apiService.syncGoogleSheets();
                setSuccessMsg(`Sinkronisasi Google Sheets Sukses! Tab terupdate: ${res.synced_tabs ? res.synced_tabs.join(', ') : 'Semua tab'}.`);
              } catch (err: any) {
                setError(err.message || 'Gagal sinkron Google Sheets. Periksa environment variable .env.');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', background: 'linear-gradient(135deg, var(--success), #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            {loading ? 'Menyinkronkan ke Sheets...' : '📊 Sinkronkan Data ke Google Sheets'}
          </button>
        </div>

        {/* Card Restore Snapshot */}
        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-fc)' }}>
            <Upload size={20} />
            Pemulihan Data (Restore Snapshot)
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Tempelkan isi file JSON snapshot backup untuk memulihkan data produk & stok:
          </p>

          <form onSubmit={handleRestoreBackup}>
            <textarea
              rows={3}
              placeholder='Tempelkan isi file JSON snapshot di sini...'
              value={restoreJsonInput}
              onChange={(e) => setRestoreJsonInput(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.8rem', fontFamily: 'monospace', marginBottom: '1rem' }}
            />

            <button
              type="submit"
              disabled={restoreLoading || !restoreJsonInput.trim()}
              className="btn-primary"
              style={{ width: '100%', padding: '0.65rem', fontSize: '0.875rem', background: 'linear-gradient(135deg, var(--accent-fc), #0891b2)' }}
            >
              {restoreLoading ? 'Memulihkan Data...' : '⚡ Jalankan Restore Data Database'}
            </button>
          </form>
        </div>
      </div>

      {/* Tabel Riwayat Backup Snapshot */}
      <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Log Riwayat Backup Sesi Selesai ({history.length})</h3>

        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Belum ada riwayat pembuatan backup snapshot pada sesi ini. Klik tombol di atas untuk membuat backup pertama Anda.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>ID Backup</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Waktu Pembuatan</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Petugas Pembuat</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Ukuran Snapshot</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.backup_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 600, fontFamily: 'monospace' }}>{item.backup_id}</td>
                    <td style={{ padding: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{formatWaktuIndo(item.created_at)}</td>
                    <td style={{ padding: '0.5rem' }}>User ID: {item.created_by_user_id}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 700 }}>{(item.size_bytes / 1024).toFixed(2)} KB</td>
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
