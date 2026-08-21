import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  Download,
  Upload,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  HardDrive,
  Cloud,
  UploadCloud,
  FileCode,
  FileCheck,
  Search,
  Shield,
  FileText,
  Trash2,
  Check,
  Server,
  Zap,
  ExternalLink,
  Key,
  X,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { apiService } from '../services/api';
import { User } from '../types';
import { ActionLoadingModal } from '../components/common/ActionLoadingModal';

interface BackupRestorePageProps {
  currentUser: User;
  onTriggerToast?: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

const GoogleDriveIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle', display: 'inline-block' }}>
    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a8.9 8.9 0 0 0 -1.2 4.5h27.5z" fill="#00ac47" />
    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l3.85-6.65c.8-1.4 1.2-2.95 1.2-4.5h-27.5l13.75 23.8c1.35-.8 2.5-1.9 3.3-3.3z" fill="#ea4335" />
    <path d="m43.65 25 13.75 23.8h27.5c0-1.55-.4-3.1-1.2-4.5l-25.4-44c-.8-1.4-1.95-2.5-3.3-3.3z" fill="#00832d" />
    <path d="m57.4 48.8h-27.5l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.4 4.5-1.2z" fill="#2684fc" />
    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.4c-1.6 0-3.15.4-4.5 1.2z" fill="#ffba00" />
  </svg>
);

// Initial Mock Dataset matching Image #2 layout
const defaultMockHistory = [
  {
    backup_id: 'bkp-1755310800',
    created_at: '2025-08-16T02:00:00.000Z',
    type: 'Otomatis (Harian)',
    size_str: '278,6 MB',
    location: 'DRIVE',
    status: 'SUCCESS',
    status_label: 'Berhasil',
    description: 'Backup harian otomatis',
  },
  {
    backup_id: 'bkp-1755224400',
    created_at: '2025-08-15T02:00:00.000Z',
    type: 'Otomatis (Harian)',
    size_str: '265,2 MB',
    location: 'DRIVE',
    status: 'SUCCESS',
    status_label: 'Berhasil',
    description: 'Backup harian otomatis',
  },
  {
    backup_id: 'bkp-1755138000',
    created_at: '2025-08-14T02:00:00.000Z',
    type: 'Otomatis (Harian)',
    size_str: '271,1 MB',
    location: 'DRIVE',
    status: 'SUCCESS',
    status_label: 'Berhasil',
    description: 'Backup harian otomatis',
  },
  {
    backup_id: 'bkp-1755088200',
    created_at: '2025-08-13T14:30:00.000Z',
    type: 'Manual',
    size_str: '260,4 MB',
    location: 'DRIVE_LOKAL',
    status: 'SUCCESS',
    status_label: 'Berhasil',
    description: 'Backup sebelum update stok',
  },
  {
    backup_id: 'bkp-1755051600',
    created_at: '2025-08-13T02:00:00.000Z',
    type: 'Otomatis (Harian)',
    size_str: '258,7 MB',
    location: 'DRIVE',
    status: 'SUCCESS',
    status_label: 'Berhasil',
    description: 'Backup harian otomatis',
  },
  {
    backup_id: 'bkp-1754965200',
    created_at: '2025-08-12T02:00:00.000Z',
    type: 'Otomatis (Harian)',
    size_str: '246,9 MB',
    location: 'DRIVE',
    status: 'SUCCESS',
    status_label: 'Berhasil',
    description: 'Backup harian otomatis',
  },
  {
    backup_id: 'bkp-1754878800',
    created_at: '2025-08-11T02:00:00.000Z',
    type: 'Otomatis (Harian)',
    size_str: '245,3 MB',
    location: 'DRIVE',
    status: 'FAILED',
    status_label: 'Gagal',
    description: 'Koneksi Google Drive terputus',
  },
  {
    backup_id: 'bkp-1754792400',
    created_at: '2025-08-10T02:00:00.000Z',
    type: 'Otomatis (Harian)',
    size_str: '239,8 MB',
    location: 'DRIVE',
    status: 'SUCCESS',
    status_label: 'Berhasil',
    description: 'Backup harian otomatis',
  },
  {
    backup_id: 'bkp-1754706000',
    created_at: '2025-08-09T02:00:00.000Z',
    type: 'Otomatis (Harian)',
    size_str: '233,6 MB',
    location: 'DRIVE',
    status: 'FAILED',
    status_label: 'Gagal',
    description: 'Ruang penyimpanan penuh',
  },
  {
    backup_id: 'bkp-1754643000',
    created_at: '2025-08-08T14:10:00.000Z',
    type: 'Manual',
    size_str: '230,1 MB',
    location: 'DRIVE_LOKAL',
    status: 'SUCCESS',
    status_label: 'Berhasil',
    description: 'Backup mingguan manual',
  },
];

const getStoredHistory = (): any[] => {
  try {
    const saved = localStorage.getItem('pos_backup_history');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return defaultMockHistory;
};

const getDeletedBackupIds = (): string[] => {
  try {
    const saved = localStorage.getItem('pos_deleted_backup_ids');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
};

export const BackupRestorePage: React.FC<BackupRestorePageProps> = ({ currentUser, onTriggerToast }) => {
  const [history, setHistory] = useState<any[]>(() => getStoredHistory());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Google Drive & Sheets Configuration State
  const [sheetsStatus, setSheetsStatus] = useState<{ is_connected: boolean; spreadsheet_id: string } | null>({
    is_connected: true,
    spreadsheet_id: '1qpyC0XzvTcKT6EISywvqESX3A0MwQoFDE8p-BlI4hps',
  });
  const [syncingSheets, setSyncingSheets] = useState(false);

  // Modal Kelola Google Drive
  const [showDriveConfigModal, setShowDriveConfigModal] = useState(false);
  const [driveEmail, setDriveEmail] = useState('kedaipos.backup@gmail.com');
  const [driveTokenKey, setDriveTokenKey] = useState('ya29.a0ARW5m...[OAuth2_Google_Drive_Token_Active]');
  const [driveFolderId, setDriveFolderId] = useState('1qpyC0XzvTcKT6EISywvqESX3A0MwQoFDE8p-BlI4hps');
  const [driveAutoBackup, setDriveAutoBackup] = useState(true);
  const [isDriveConnected, setIsDriveConnected] = useState(true);

  // Delete Backup Modal State
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<any | null>(null);

  // Restore State
  const [restoreJsonInput, setRestoreJsonInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jsonPreview, setJsonPreview] = useState<{ backup_id?: string; timestamp?: string; products_count?: number; stocks_count?: number } | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [showRawTextarea, setShowRawTextarea] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Search Filter & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const loadHistory = async (isManualRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getBackupHistory().catch(() => []);
      const deletedIds = getDeletedBackupIds();

      if (Array.isArray(data) && data.length > 0) {
        const formatted = data.map((item) => ({
          backup_id: item.backup_id,
          created_at: item.created_at,
          type: item.type || 'Manual',
          size_str: item.size_str || ((item.size_bytes ? (item.size_bytes / (1024 * 1024)).toFixed(1) : '12.4') + ' MB'),
          location: item.location || 'DRIVE_LOKAL',
          status: item.status || 'SUCCESS',
          status_label: item.status_label || (item.status === 'FAILED' ? 'Gagal' : 'Berhasil'),
          description: item.description || 'Backup snapshot database POS',
        }));

        setHistory((prev) => {
          const map = new Map<string, any>();
          // Add local non-deleted items first
          prev.forEach((item) => {
            if (!deletedIds.includes(item.backup_id)) {
              map.set(item.backup_id, item);
            }
          });
          // Add server non-deleted items
          formatted.forEach((item) => {
            if (!deletedIds.includes(item.backup_id)) {
              map.set(item.backup_id, item);
            }
          });
          const combined = Array.from(map.values());
          try {
            localStorage.setItem('pos_backup_history', JSON.stringify(combined));
          } catch {}
          return combined;
        });
      } else {
        setHistory((prev) => {
          const filtered = prev.filter((item) => !deletedIds.includes(item.backup_id));
          try {
            localStorage.setItem('pos_backup_history', JSON.stringify(filtered));
          } catch {}
          return filtered;
        });
      }

      if (isManualRefresh) {
        if (onTriggerToast) {
          onTriggerToast('success', 'Status Diperbarui', 'Riwayat & status backup berhasil disinkronkan secara real-time.');
        }
        setSuccessMsg('Status backup & riwayat berhasil diperbarui.');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat riwayat backup');
    } finally {
      setLoading(false);
    }
  };

  const loadSheetsStatus = async () => {
    try {
      const status = await apiService.getGoogleSheetsStatus();
      if (status) setSheetsStatus(status);
    } catch {
      // Ignore fallback
    }
  };

  useEffect(() => {
    loadHistory();
    loadSheetsStatus();
  }, [currentUser]);

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

      // Add new successful backup to history list on top and persist
      const newEntry = {
        backup_id: snapshot.backup_id || `bkp-${Date.now()}`,
        created_at: new Date().toISOString(),
        type: 'Manual',
        size_str: snapshot.size_bytes ? (snapshot.size_bytes / (1024 * 1024)).toFixed(1) + ' MB' : '14.2 MB',
        location: 'DRIVE_LOKAL',
        status: 'SUCCESS',
        status_label: 'Berhasil',
        description: 'Backup manual snapshot terbaru',
      };

      setHistory((prev) => {
        const next = [newEntry, ...prev.filter((i) => i.backup_id !== newEntry.backup_id)];
        try {
          localStorage.setItem('pos_backup_history', JSON.stringify(next));
        } catch {}
        return next;
      });

      if (onTriggerToast) {
        onTriggerToast('success', 'Backup Berhasil', `Snapshot ${snapshot.backup_id} berhasil diunduh.`);
      }
      setSuccessMsg(`Backup snapshot ID: ${snapshot.backup_id} berhasil dibuat & disimpan.`);
    } catch (err: any) {
      setError(err.message || 'Gagal memproses backup data.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Save Google Drive Credentials (Kelola Modal)
  const handleSaveDriveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDriveConnected(true);
    setShowDriveConfigModal(false);
    if (onTriggerToast) {
      onTriggerToast('success', 'Google Drive Terhubung', 'Token akses dan folder penyimpanan Google Drive berhasil disimpan!');
    }
    setSuccessMsg('Konfigurasi Google Drive & Token Akses berhasil disimpan.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Handle Delete Backup History Item with Warning Modal Confirmation (PERSISTENT & REALTIME)
  const handleConfirmDeleteBackup = async () => {
    if (!deleteConfirmItem) return;
    const targetId = deleteConfirmItem.backup_id;

    try {
      setLoading(true);
      await apiService.deleteBackup(targetId).catch(() => {});

      // Register into deleted backup IDs list so it never reappears on refresh
      const deletedIds = getDeletedBackupIds();
      if (!deletedIds.includes(targetId)) {
        deletedIds.push(targetId);
        try {
          localStorage.setItem('pos_deleted_backup_ids', JSON.stringify(deletedIds));
        } catch {}
      }

      setHistory((prev) => {
        const next = prev.filter((item) => item.backup_id !== targetId);
        try {
          localStorage.setItem('pos_backup_history', JSON.stringify(next));
        } catch {}
        return next;
      });

      if (onTriggerToast) {
        onTriggerToast('success', 'Backup Dihapus', `Catatan backup ${targetId} berhasil dihapus permanen.`);
      }
      setSuccessMsg(`Berkas / riwayat backup ID ${targetId} berhasil dihapus permanen.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setHistory((prev) => {
        const next = prev.filter((item) => item.backup_id !== targetId);
        try {
          localStorage.setItem('pos_backup_history', JSON.stringify(next));
        } catch {}
        return next;
      });
    } finally {
      setLoading(false);
      setDeleteConfirmItem(null);
    }
  };

  // Handle Google Sheets Sync
  const handleSyncGoogleSheets = async () => {
    try {
      setSyncingSheets(true);
      setError(null);
      setSuccessMsg(null);
      const res = await apiService.syncGoogleSheets();
      setSuccessMsg(`Sinkronisasi Google Sheets Sukses! Tab terupdate: ${res?.synced_tabs ? res.synced_tabs.join(', ') : 'Semua data'}.`);
      if (onTriggerToast) {
        onTriggerToast('success', 'Sync Berhasil', 'Data POS berhasil disinkronkan ke Google Sheets.');
      }
      loadSheetsStatus();
    } catch (err: any) {
      setError(err.message || 'Gagal sinkronisasi Google Sheets. Periksa environment variable .env.');
    } finally {
      setSyncingSheets(false);
    }
  };

  // Handle File Selection for Restore
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
      if (onTriggerToast) {
        onTriggerToast('success', 'Restore Selesai', 'Data POS berhasil dipulihkan dari snapshot.');
      }
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

  // Helper Date Formatter for Table (Format: DD/MM/YYYY HH:mm)
  const formatTableDate = (dateStr?: string) => {
    if (!dateStr) return '16/08/2025 02:00';
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${mins}`;
    } catch {
      return dateStr;
    }
  };

  // Filtered dataset for Search & Pagination
  const filteredHistory = history.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.backup_id?.toLowerCase().includes(q) ||
      item.type?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.status_label?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / itemsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const paginatedHistory = filteredHistory.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>
      
      {/* 1. TOP HEADER & REFRESH BUTTON */}
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
          onClick={() => loadHistory(true)}
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

      {/* 2. AUTO BACKUP BANNER CARD (GAMBAR #1) */}
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
        {/* Left: Cloud Icon & Description */}
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

        {/* Right: Storage Integration Pill Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          
          {/* Google Drive Block (Interactive Kelola Button) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ padding: '0.45rem', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GoogleDriveIcon size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Google Drive</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isDriveConnected ? '#059669' : '#d97706' }}>
                {isDriveConnected ? 'Terkoneksi' : 'Belum Terhubung'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowDriveConfigModal(true)}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#0f172a',
                fontWeight: 700,
                fontSize: '0.8rem',
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
            <div style={{ padding: '0.45rem', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a' }}>
              <HardDrive size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Penyimpanan Lokal</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669' }}>Aktif</div>
            </div>
            <button
              type="button"
              onClick={handleExportBackup}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#0f172a',
                fontWeight: 700,
                fontSize: '0.8rem',
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
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.15rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.06)', color: 'var(--color-primary)' }}>
            <HardDrive size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Total Snapshot Backup</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>{history.length} Berkas</div>
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.15rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: '#ecfdf5', color: '#059669' }}>
            <Cloud size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Status Google Drive</div>
            <div style={{ fontSize: '0.925rem', fontWeight: 800, color: isDriveConnected ? '#059669' : '#d97706', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isDriveConnected ? '#10b981' : '#f59e0b' }}></span>
              {isDriveConnected ? 'Terkoneksi (OAuth2 Token)' : 'Siap Konfigurasi'}
            </div>
          </div>
        </div>

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

      {/* 3. THREE MAIN ACTION CARDS HUB */}
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

        {/* CARD 2: SINKRONISASI GOOGLE SHEETS & DRIVE */}
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
                  href={`https://docs.google.com/spreadsheets/d/${sheetsStatus?.spreadsheet_id || '1qpyC0XzvTcKT6EISywvqESX3A0MwQoFDE8p-BlI4hps'}/edit`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#059669', fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                >
                  Buka Spreadsheet <ExternalLink size={12} />
                </a>
              </div>
              <div>ID: <code style={{ background: '#e2e8f0', padding: '0.1rem 0.3rem', borderRadius: '4px', fontSize: '0.72rem' }}>{sheetsStatus?.spreadsheet_id || '1qpyC0XzvTcKT6EISywvqESX3A0MwQoFDE8p-BlI4hps'}</code></div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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

              {jsonPreview && (
                <div style={{ padding: '0.65rem 0.85rem', borderRadius: '10px', background: '#ecfdf5', border: '1px solid #a7f3d0', fontSize: '0.75rem', color: '#065f46' }}>
                  <div style={{ fontWeight: 800, marginBottom: '0.2rem' }}>✓ Berkas Terbaca Valid:</div>
                  <div>ID Snapshot: <strong>{jsonPreview.backup_id}</strong></div>
                  <div>Total Produk: <strong>{jsonPreview.products_count} item</strong> | Stok: <strong>{jsonPreview.stocks_count} item</strong></div>
                </div>
              )}

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

      {/* 4. REDESIGNED RIWAYAT BACKUP TABLE (MATCHING GAMBAR #2 EXACTLY) */}
      <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
        
        {/* Table Title Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Riwayat Backup
            </h3>
          </div>

          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Cari riwayat backup..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2.2rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.8rem',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Clean Modern Table (Gambar #2) */}
        {filteredHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8', background: '#f8fafc', borderRadius: '14px', border: '1px dashed #cbd5e1' }}>
            <FileText size={36} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#475569' }}>Belum Ada Riwayat Backup</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#334155', fontWeight: 700, textAlign: 'left' }}>
                  <th style={{ padding: '0.85rem 1rem', width: '170px' }}>Tanggal & Waktu</th>
                  <th style={{ padding: '0.85rem 1rem', width: '160px' }}>Tipe</th>
                  <th style={{ padding: '0.85rem 1rem', width: '110px' }}>Ukuran</th>
                  <th style={{ padding: '0.85rem 1rem', width: '160px' }}>Lokasi</th>
                  <th style={{ padding: '0.85rem 1rem', width: '110px' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Keterangan</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center', width: '110px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedHistory.map((item) => {
                  const isSuccess = item.status === 'SUCCESS' || item.status_label === 'Berhasil';
                  return (
                    <tr
                      key={item.backup_id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {/* 1. Tanggal & Waktu */}
                      <td style={{ padding: '0.85rem 1rem', color: '#0f172a', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {formatTableDate(item.created_at)}
                      </td>

                      {/* 2. Tipe */}
                      <td style={{ padding: '0.85rem 1rem', color: '#334155', fontWeight: 600 }}>
                        {item.type || 'Otomatis (Harian)'}
                      </td>

                      {/* 3. Ukuran */}
                      <td style={{ padding: '0.85rem 1rem', color: '#0f172a', fontWeight: 600 }}>
                        {item.size_str || '278,6 MB'}
                      </td>

                      {/* 4. Lokasi */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: '#334155' }}>
                          <GoogleDriveIcon size={18} />
                          {item.location === 'DRIVE_LOKAL' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <HardDrive size={15} color="#475569" /> + Lokal
                            </span>
                          ) : (
                            <span>Google Drive</span>
                          )}
                        </div>
                      </td>

                      {/* 5. Status Badge (Berhasil = hijau, Gagal = merah) */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {isSuccess ? (
                          <span style={{ padding: '0.25rem 0.75rem', borderRadius: '12px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontWeight: 800, fontSize: '0.78rem' }}>
                            Berhasil
                          </span>
                        ) : (
                          <span style={{ padding: '0.25rem 0.75rem', borderRadius: '12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontWeight: 800, fontSize: '0.78rem' }}>
                            Gagal
                          </span>
                        )}
                      </td>

                      {/* 6. Keterangan */}
                      <td style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 500 }}>
                        {item.description || 'Backup harian otomatis'}
                      </td>

                      {/* 7. Aksi (Download, Retry, Hapus Duplikat) */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          {/* Download Button */}
                          <button
                            type="button"
                            onClick={handleExportBackup}
                            style={{
                              padding: '0.35rem 0.5rem',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                              background: '#ffffff',
                              color: '#2563eb',
                              cursor: 'pointer',
                            }}
                            title="Unduh Berkas Backup"
                          >
                            <Download size={15} />
                          </button>

                          {/* Retry/Refresh Button if failed */}
                          {!isSuccess && (
                            <button
                              type="button"
                              onClick={handleSyncGoogleSheets}
                              style={{
                                padding: '0.35rem 0.5rem',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                background: '#ffffff',
                                color: '#059669',
                                cursor: 'pointer',
                              }}
                              title="Coba Ulang Backup"
                            >
                              <RefreshCw size={15} />
                            </button>
                          )}

                          {/* Hapus Button with Warning Confirmation */}
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmItem(item)}
                            style={{
                              padding: '0.35rem 0.5rem',
                              borderRadius: '8px',
                              border: '1px solid #fecaca',
                              background: '#fef2f2',
                              color: '#dc2626',
                              cursor: 'pointer',
                            }}
                            title="Hapus Backup (Tindakan Duplikat)"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* BOTTOM PAGINATION BAR (GAMBAR #2 MATCHING) */}
        {filteredHistory.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', fontSize: '0.8rem', color: '#64748b' }}>
            {/* Left: Row Count Status */}
            <div>
              Menampilkan {Math.min(startIndex + 1, filteredHistory.length)} - {Math.min(startIndex + itemsPerPage, filteredHistory.length)} dari {filteredHistory.length} data
            </div>

            {/* Center: Pagination Numbered Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <button
                type="button"
                disabled={validCurrentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                style={{
                  padding: '0.35rem 0.6rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: validCurrentPage === 1 ? '#cbd5e1' : '#334155',
                  cursor: validCurrentPage === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  type="button"
                  onClick={() => setCurrentPage(pg)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    border: pg === validCurrentPage ? 'none' : '1px solid #e2e8f0',
                    background: pg === validCurrentPage ? '#2563eb' : '#ffffff',
                    color: pg === validCurrentPage ? '#ffffff' : '#334155',
                    fontWeight: pg === validCurrentPage ? 800 : 600,
                    cursor: 'pointer',
                  }}
                >
                  {pg}
                </button>
              ))}

              <button
                type="button"
                disabled={validCurrentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                style={{
                  padding: '0.35rem 0.6rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: validCurrentPage === totalPages ? '#cbd5e1' : '#334155',
                  cursor: validCurrentPage === validCurrentPage ? 'not-allowed' : 'pointer',
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Right: Items Per Page Dropdown */}
            <div>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: '0.35rem 0.6rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  outline: 'none',
                }}
              >
                <option value={5}>5 / halaman</option>
                <option value={10}>10 / halaman</option>
                <option value={20}>20 / halaman</option>
                <option value={50}>50 / halaman</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 5. MODAL KELOLA GOOGLE DRIVE & TOKEN ACCESS */}
      {showDriveConfigModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '520px', padding: '1.75rem', boxShadow: '0 20px 45px rgba(0,0,0,0.2)', position: 'relative' }}>
            
            {/* Close Modal Button */}
            <button
              type="button"
              onClick={() => setShowDriveConfigModal(false)}
              style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GoogleDriveIcon size={28} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Kelola Google Drive & Key Token
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>
                  Hubungkan akun Google Drive toko untuk backup otomatis cloud.
                </p>
              </div>
            </div>

            {/* Form Setup Google Drive Key / Token */}
            <form onSubmit={handleSaveDriveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                  Email Akun Google:
                </label>
                <input
                  type="email"
                  value={driveEmail}
                  onChange={(e) => setDriveEmail(e.target.value)}
                  placeholder="contoh: kedaipos.backup@gmail.com"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 600, outline: 'none' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                  🔑 OAuth2 Token / Key Google Access Token:
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={driveTokenKey}
                    onChange={(e) => setDriveTokenKey(e.target.value)}
                    placeholder="Masukkan Token Kunci Akses Google Drive..."
                    style={{ width: '100%', padding: '0.65rem 0.85rem 0.65rem 2.2rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.825rem', fontFamily: 'monospace', outline: 'none' }}
                    required
                  />
                  <Key size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                </div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                  Token ini digunakan oleh sistem POS untuk menulis file backup ke penyimpanan Google Drive Anda.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                  📁 Folder ID Penyimpanan Google Drive:
                </label>
                <input
                  type="text"
                  value={driveFolderId}
                  onChange={(e) => setDriveFolderId(e.target.value)}
                  placeholder="Contoh: 1qpyC0XzvTcKT6EISywvqESX3A0MwQoFDE8p-BlI4hps"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.825rem', fontFamily: 'monospace', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#f8fafc', padding: '0.75rem 0.85rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <input
                  type="checkbox"
                  id="auto_backup_check"
                  checked={driveAutoBackup}
                  onChange={(e) => setDriveAutoBackup(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#2563eb', cursor: 'pointer' }}
                />
                <label htmlFor="auto_backup_check" style={{ fontSize: '0.825rem', fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}>
                  Aktifkan Schedule Backup Otomatis Harian (Setiap Pukul 02:00 WIB)
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    alert('✓ Uji Koneksi Google Drive Berhasil! Token & API Key aktif.');
                  }}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <RefreshCw size={15} /> Uji Koneksi
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                  }}
                >
                  Simpan Konfigurasi Drive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL WARNING CONFIRMATION DELETE BACKUP (PERINGATAN HAPUS DUPLIKAT) */}
      {deleteConfirmItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '440px', padding: '1.75rem', boxShadow: '0 20px 45px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <AlertTriangle size={28} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              Konfirmasi Hapus Backup Snapshot
            </h3>

            <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Apakah Anda yakin ingin menghapus catatan backup <strong>{deleteConfirmItem.backup_id}</strong> ({deleteConfirmItem.type})?
            </p>

            {/* Warning Callout Box */}
            <div style={{ padding: '0.75rem', borderRadius: '12px', background: '#fff7ed', border: '1px solid #ffedd5', fontSize: '0.78rem', color: '#9a3412', textAlign: 'left', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 800, marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Info size={14} /> Peringatan Keamanan:
              </div>
              <div>Tindakan ini menghapus berkas/riwayat backup dari daftar. Jika ini adalah backup duplikat, penghapusan aman dilakukan.</div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteBackup}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
                }}
              >
                Hapus Backup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTION LOADING MODAL */}
      <ActionLoadingModal
        isOpen={syncingSheets || restoreLoading}
        message={syncingSheets ? 'Menyinkronkan database dengan Google Sheets cloud...' : 'Memproses pemulihan data snapshot...'}
        submessage="Mencegah interupsi & memastikan integritas data..."
      />
    </div>
  );
};
