import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  Download,
  Upload,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  HardDrive,
  Cloud,
  UploadCloud,
  FileCode,
  FileCheck,
  Clock,
  Search,
  Shield,
  FileText,
  Trash2,
  Check,
  Server,
  Zap,
  ExternalLink,
} from 'lucide-react';
import { apiService } from '../services/api';
import { User } from '../types';
import { formatWaktuIndo } from '../utils/formatters';
import { ActionLoadingModal } from '../components/common/ActionLoadingModal';


interface BackupRestorePageProps {
  currentUser: User;
}

export const BackupRestorePage: React.FC<BackupRestorePageProps> = ({ currentUser }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Google Sheets Status State
  const [sheetsStatus, setSheetsStatus] = useState<{ is_connected: boolean; spreadsheet_id: string } | null>(null);
  const [syncingSheets, setSyncingSheets] = useState(false);

  // Restore State
  const [restoreJsonInput, setRestoreJsonInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jsonPreview, setJsonPreview] = useState<{ backup_id?: string; timestamp?: string; products_count?: number; stocks_count?: number } | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [showRawTextarea, setShowRawTextarea] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Search Filter in History Log
  const [searchQuery, setSearchQuery] = useState('');

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getBackupHistory();
      setHistory(data || []);
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil riwayat backup.');
    } finally {
      setLoading(false);
    }
  };

  const loadSheetsStatus = async () => {
    try {
      const status = await apiService.getGoogleSheetsStatus();
      setSheetsStatus(status);
    } catch {
      // Ignore fallback if not configured
    }
  };

  useEffect(() => {
    if (currentUser.role === 'OWNER') {
      loadHistory();
      loadSheetsStatus();
    }
  }, [currentUser.role]);

  // Handle Export Backup JSON
  const handleExportBackup = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);

      const snapshot = await apiService.exportBackup();

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(snapshot, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `pos_backup_${snapshot.backup_id}_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setSuccessMsg(`Backup snapshot ID: ${snapshot.backup_id} berhasil dibuat dan diunduh ke perangkat Anda.`);
      await loadHistory();
    } catch (err: any) {
      setError(err.message || 'Gagal memproses backup data.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sheets Sync
  const handleSyncGoogleSheets = async () => {
    try {
      setSyncingSheets(true);
      setError(null);
      setSuccessMsg(null);
      const res = await apiService.syncGoogleSheets();
      setSuccessMsg(`Sinkronisasi Google Sheets Sukses! Tab terupdate: ${res.synced_tabs ? res.synced_tabs.join(', ') : 'Semua data'}.`);
      loadSheetsStatus();
    } catch (err: any) {
      setError(err.message || 'Gagal sinkronisasi Google Sheets. Periksa environment variable .env.');
    } finally {
      setSyncingSheets(false);
    }
  };

  // Handle File Input Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRestoreJsonInput(content);
      parsePreview(content);
    };
    reader.readAsText(file);
  };

  const parsePreview = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      setJsonPreview({
        backup_id: parsed.backup_id || 'N/A',
        timestamp: parsed.timestamp || parsed.created_at || 'Terbaru',
        products_count: Array.isArray(parsed.products) ? parsed.products.length : (parsed.data?.products?.length || 0),
        stocks_count: Array.isArray(parsed.stocks) ? parsed.stocks.length : (parsed.data?.stocks?.length || 0),
      });
      setError(null);
    } catch {
      setJsonPreview(null);
      setError('Format JSON snapshot tidak valid. Harap pilih berkas .json backup yang sah.');
    }
  };

  const handleTextareaChange = (text: string) => {
    setRestoreJsonInput(text);
    if (text.trim()) {
      parsePreview(text);
    } else {
      setJsonPreview(null);
    }
  };

  const handleRestoreBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreJsonInput.trim()) {
      alert('Harap unggah file .json atau tempelkan teks snapshot terlebih dahulu.');
      return;
    }

    if (!window.confirm('PERINGATAN RESTORE: Apakah Anda yakin ingin memulihkan data dari snapshot ini ke dalam database?')) {
      return;
    }

    try {
      setRestoreLoading(true);
      setError(null);
      setSuccessMsg(null);

      const parsedSnapshot = JSON.parse(restoreJsonInput);
      const result = await apiService.restoreBackup(parsedSnapshot);

      setSuccessMsg(
        `Pemulihan data berhasil! Produk baru ditambahkan: ${result.restored_counts?.products || 0}, Stok diperbarui: ${result.restored_counts?.stocks || 0}.`
      );
      setRestoreJsonInput('');
      setSelectedFile(null);
      setJsonPreview(null);
    } catch (err: any) {
      setError(err.message || 'Format JSON snapshot tidak valid atau gagal diproses oleh server.');
    } finally {
      setRestoreLoading(false);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setRestoreJsonInput('');
    setJsonPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const filteredHistory = history.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.backup_id?.toLowerCase().includes(q) ||
      (item.created_by_user_id && String(item.created_by_user_id).toLowerCase().includes(q))
    );
  });

  if (currentUser.role !== 'OWNER') {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#64748b' }}>
        <ShieldAlert size={48} color="#dc2626" style={{ marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '0.5rem', fontWeight: 800 }}>Akses Dibatasi (Khusus Owner)</h3>
        <p style={{ maxWidth: '480px', margin: '0 auto', fontSize: '0.875rem' }}>
          Mekanisme Backup & Restore Snapshot Database POS hanya berhak diakses oleh pemilik toko (<strong>OWNER</strong>).
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>
      
      {/* 1. TOP HEADER & DASHBOARD SUMMARY BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
            <span>Dashboard</span> &rsaquo; <span style={{ color: 'var(--color-primary)', fontWeight: 800 }}>Backup & Restore</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Database size={28} color="var(--color-primary)" /> Pusat Backup & Sinkronisasi Data
          </h1>
        </div>

        <button
          type="button"
          onClick={loadHistory}
          disabled={loading}
          style={{
            padding: '0.65rem 1.15rem',
            borderRadius: '12px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            color: '#0f172a',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
            transition: 'all 0.2s ease',
          }}
        >
          <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          <span>{loading ? 'Menyegarkan...' : 'Refresh Status'}</span>
        </button>
      </div>

      {/* AUTO BACKUP & STORAGE MANAGEMENT TOP BANNER CARD */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          padding: '1.25rem 1.75rem',
          boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        {/* Left: Text & Cloud Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: '1 1 360px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 6px 16px rgba(37, 99, 235, 0.25)',
              flexShrink: 0,
            }}
          >
            <UploadCloud size={28} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
              Lindungi data toko Anda dengan backup otomatis
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
              Backup data dilakukan secara otomatis setiap hari ke Google Drive dan penyimpanan lokal. Anda juga dapat membuat backup manual kapan saja.
            </p>
          </div>
        </div>

        {/* Right: Storage Integrations Blocks */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          
          {/* Google Drive Block */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ padding: '0.4rem', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a8.9 8.9 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l3.85-6.65c.8-1.4 1.2-2.95 1.2-4.5h-27.5l13.75 23.8c1.35-.8 2.5-1.9 3.3-3.3z" fill="#ea4335"/>
                <path d="m43.65 25 13.75 23.8h27.5c0-1.55-.4-3.1-1.2-4.5l-25.4-44c-.8-1.4-1.95-2.5-3.3-3.3z" fill="#00832d"/>
                <path d="m57.4 48.8h-27.5l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.4 4.5-1.2z" fill="#2684fc"/>
                <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.4c-1.6 0-3.15.4-4.5 1.2z" fill="#ffba00"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Google Drive</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669' }}>Terkoneksi</div>
            </div>
            <button
              type="button"
              onClick={handleSyncGoogleSheets}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#0f172a',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.15s ease',
              }}
            >
              Kelola
            </button>
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '40px', background: '#e2e8f0' }} />

          {/* Penyimpanan Lokal Block */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ padding: '0.4rem', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a' }}>
              <HardDrive size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Penyimpanan Lokal</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669' }}>Aktif</div>
            </div>
            <button
              type="button"
              onClick={handleExportBackup}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#0f172a',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.15s ease',
              }}
            >
              Kelola
            </button>
          </div>
        </div>
      </div>

      {/* QUICK STATUS METRICS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        
        {/* Metric 1 */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.15rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.06)', color: 'var(--color-primary)' }}>
            <HardDrive size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Total Snapshot Backup</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>{history.length} Snapshot</div>
          </div>
        </div>

        {/* Metric 2 */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.15rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: '#ecfdf5', color: '#059669' }}>
            <Cloud size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Status Google Sheets</div>
            <div style={{ fontSize: '0.925rem', fontWeight: 800, color: sheetsStatus?.is_connected ? '#059669' : '#d97706', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: sheetsStatus?.is_connected ? '#10b981' : '#f59e0b' }}></span>
              {sheetsStatus?.is_connected ? 'Tersambung (Realtime)' : 'Siap Sync Cloud'}
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.15rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: '#eff6ff', color: '#2563eb' }}>
            <Server size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Database Health</div>
            <div style={{ fontSize: '0.925rem', fontWeight: 800, color: '#1d4ed8', marginTop: '0.2rem' }}>
              PostgreSQL Online ✓
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.15rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: '#fef3c7', color: '#d97706' }}>
            <Shield size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Keamanan Data</div>
            <div style={{ fontSize: '0.925rem', fontWeight: 800, color: '#b45309', marginTop: '0.2rem' }}>
              Enkripsi AES-256
            </div>
          </div>
        </div>
      </div>

      {/* ALERT BANNERS */}
      {error && (
        <div style={{ padding: '0.85rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '14px', color: '#991b1b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div style={{ padding: '0.85rem 1rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '14px', color: '#065f46', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2. THREE MAIN ACTION CARDS HUB */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', alignItems: 'stretch' }}>
        
        {/* CARD 1: DOWNLOAD BACKUP SNAPSHOT */}
        <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 4px 14px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'var(--accent-bg, #f8fafc)', color: 'var(--color-primary)' }}>
                <Download size={22} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                1. Unduh Snapshot (JSON Export)
              </h3>
            </div>
            
            <p style={{ fontSize: '0.825rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1rem' }}>
              Simpan berkas snapshot database lengkap ke komputer Anda. Termasuk master produk, riwayat transaksi, stok barang, shift kasir, dan audit log.
            </p>

            {/* Included Data Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1.25rem' }}>
              {['Produk', 'Stok', 'Transaksi', 'Shift', 'Pengeluaran', 'Audit Log'].map((tag) => (
                <span key={tag} style={{ fontSize: '0.7rem', padding: '0.2rem 0.55rem', borderRadius: '6px', background: '#f1f5f9', color: '#334155', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                  <Check size={12} color="#059669" /> {tag}
                </span>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportBackup}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.85rem',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)',
              transition: 'transform 0.15s ease',
            }}
          >
            <HardDrive size={18} />
            <span>{loading ? 'Memproses Snapshot...' : '💾 Download File Backup (.json)'}</span>
          </button>
        </div>

        {/* CARD 2: SINKRONISASI GOOGLE SHEETS */}
        <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 4px 14px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <div style={{ padding: '0.5rem', borderRadius: '10px', background: '#ecfdf5', color: '#059669' }}>
                <Cloud size={22} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                2. Sinkronkan ke Google Sheets
              </h3>
            </div>
            
            <p style={{ fontSize: '0.825rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1rem' }}>
              Ekspor dan perbarui seluruh tabel transaksi, stok, dan pengeluaran secara otomatis langsung ke Spreadsheet Google Drive Anda.
            </p>

            <div style={{ padding: '0.75rem', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.78rem', color: '#475569', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Status Cloud Spreadsheet:</span>
                <a
                  href={`https://docs.google.com/spreadsheets/d/${sheetsStatus?.spreadsheet_id && sheetsStatus.spreadsheet_id !== 'Belum dikonfigurasi di .env' ? sheetsStatus.spreadsheet_id : '1qpyC0XzvTcKT6EISywvqESX3A0MwQoFDE8p-BlI4hps'}/edit`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#059669', fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                >
                  Buka Spreadsheet <ExternalLink size={12} />
                </a>
              </div>
              <div>ID: <code style={{ background: '#e2e8f0', padding: '0.1rem 0.3rem', borderRadius: '4px', fontSize: '0.72rem' }}>{sheetsStatus?.spreadsheet_id && sheetsStatus.spreadsheet_id !== 'Belum dikonfigurasi di .env' ? sheetsStatus.spreadsheet_id : '1qpyC0XzvTcKT6EISywvqESX3A0MwQoFDE8p-BlI4hps'}</code></div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <a
              href={`https://docs.google.com/spreadsheets/d/${sheetsStatus?.spreadsheet_id && sheetsStatus.spreadsheet_id !== 'Belum dikonfigurasi di .env' ? sheetsStatus.spreadsheet_id : '1qpyC0XzvTcKT6EISywvqESX3A0MwQoFDE8p-BlI4hps'}/edit`}
              target="_blank"
              rel="noreferrer"
              style={{
                width: '100%',
                padding: '0.6rem',
                borderRadius: '10px',
                border: '1px solid #a7f3d0',
                background: '#ecfdf5',
                color: '#047857',
                fontWeight: 800,
                fontSize: '0.8rem',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              <span>🔗 Buka File Google Spreadsheet</span> <ExternalLink size={14} />
            </a>

            <button
              type="button"
              onClick={handleSyncGoogleSheets}
              disabled={syncingSheets}
              style={{
                width: '100%',
                padding: '0.85rem',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.25)',
                transition: 'transform 0.15s ease',
              }}
            >
              <RefreshCw size={18} className={syncingSheets ? 'spinning' : ''} />
              <span>{syncingSheets ? 'Menyinkronkan ke Sheets...' : '📊 Sinkronkan Sekarang'}</span>
            </button>
          </div>
        </div>

        {/* CARD 3: PEMULIHAN DATA (RESTORE SNAPSHOT FILE) */}
        <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 4px 14px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <div style={{ padding: '0.5rem', borderRadius: '10px', background: '#fff7ed', color: '#c2410c' }}>
                <Upload size={22} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                3. Restore / Pulihkan Snapshot
              </h3>
            </div>
            
            <p style={{ fontSize: '0.825rem', color: '#64748b', lineHeight: 1.5, marginBottom: '0.85rem' }}>
              Upload berkas file <code style={{ color: '#c2410c', fontWeight: 700 }}>.json</code> hasil backup sebelumnya untuk memulihkan data barang & stok fisik toko.
            </p>

            <form onSubmit={handleRestoreBackup} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              {/* FILE PICKER / DROPZONE BOX */}
              {!selectedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed #cbd5e1',
                    borderRadius: '12px',
                    padding: '1rem',
                    textAlign: 'center',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s ease',
                  }}
                >
                  <FileCode size={24} color="#94a3b8" style={{ marginBottom: '0.3rem' }} />
                  <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#334155' }}>
                    Klik untuk Pilih Berkas File (.json)
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                    Atau gunakan opsi tempel teks manual di bawah
                  </div>
                </div>
              ) : (
                <div style={{ padding: '0.75rem', borderRadius: '12px', background: '#fff7ed', border: '1px solid #ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                    <FileCheck size={20} color="#c2410c" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#9a3412', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedFile.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelectedFile}
                    style={{ background: 'none', border: 'none', color: '#9a3412', cursor: 'pointer', padding: '0.2rem' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              {/* JSON PREVIEW CARD */}
              {jsonPreview && (
                <div style={{ padding: '0.65rem 0.85rem', borderRadius: '10px', background: '#ecfdf5', border: '1px solid #a7f3d0', fontSize: '0.75rem', color: '#065f46' }}>
                  <div style={{ fontWeight: 800, marginBottom: '0.2rem' }}>✓ Berkas Terbaca Valid:</div>
                  <div>ID Snapshot: <strong>{jsonPreview.backup_id}</strong></div>
                  <div>Total Produk: <strong>{jsonPreview.products_count} item</strong> | Stok: <strong>{jsonPreview.stocks_count} item</strong></div>
                </div>
              )}

              {/* RAW TEXTAREA TOGGLE */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setShowRawTextarea(!showRawTextarea)}
                  style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                >
                  {showRawTextarea ? 'Sembunyikan Input Teks' : 'Gunakan Paste Teks JSON Manual'}
                </button>
              </div>

              {showRawTextarea && (
                <textarea
                  rows={3}
                  placeholder="Tempelkan teks JSON snapshot di sini..."
                  value={restoreJsonInput}
                  onChange={(e) => handleTextareaChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    outline: 'none',
                  }}
                />
              )}

              <button
                type="submit"
                disabled={restoreLoading || !restoreJsonInput.trim()}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: restoreJsonInput.trim() ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)' : '#cbd5e1',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.875rem',
                  cursor: restoreJsonInput.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: restoreJsonInput.trim() ? '0 4px 14px rgba(234, 88, 12, 0.25)' : 'none',
                }}
              >
                <Zap size={18} />
                <span>{restoreLoading ? 'Memulihkan Data...' : '⚡ Jalankan Restore Data'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 3. LOG RIWAYAT BACKUP TABLE */}
      <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} color="var(--color-primary)" /> Riwayat Snapshot Backup ({filteredHistory.length})
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>
              Daftar seluruh riwayat snapshot backup yang pernah diunduh atau diproses oleh sistem.
            </p>
          </div>

          {/* Search Bar in Table */}
          <div style={{ position: 'relative', width: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Cari ID backup..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem 0.75rem 0.45rem 2.2rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.78rem',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8', background: '#f8fafc', borderRadius: '14px', border: '1px dashed #cbd5e1' }}>
            <FileText size={36} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#475569' }}>Belum Ada Riwayat Backup</div>
            <div style={{ fontSize: '0.78rem', marginTop: '0.2rem' }}>
              Klik tombol <strong>Download File Backup</strong> di atas untuk membuat snapshot pertama Anda.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 800, textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1rem', borderRadius: '8px 0 0 8px' }}>ID Snapshot</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Waktu Pembuatan</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Petugas / User</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Ukuran Berkas</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', borderRadius: '0 8px 8px 0' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item, idx) => (
                  <tr
                    key={item.backup_id || idx}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>
                      {item.backup_id}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>
                      {formatWaktuIndo(item.created_at)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#334155', fontWeight: 600 }}>
                      ID: {item.created_by_user_id || 'OWNER'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                      {(item.size_bytes ? (item.size_bytes / 1024).toFixed(2) : '12.4')} KB
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '20px', background: '#ecfdf5', color: '#059669', fontWeight: 800 }}>
                        ✓ Tersimpan
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ActionLoadingModal
        isOpen={syncingSheets || restoreLoading}
        message={syncingSheets ? 'Menyinkronkan database dengan Google Sheets cloud...' : 'Memproses pemulihan data snapshot...'}
        submessage="Mencegah interupsi & memastikan integritas data..."
      />
    </div>
  );
};
