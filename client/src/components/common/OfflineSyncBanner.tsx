import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, Database } from 'lucide-react';
import { offlineQueue } from '../../utils/offlineQueue';
import { apiService } from '../../services/api';

interface OfflineSyncBannerProps {
  onTriggerToast?: (type: 'success' | 'danger' | 'info' | 'warning', title: string, message: string) => void;
}

export const OfflineSyncBanner: React.FC<OfflineSyncBannerProps> = ({ onTriggerToast }) => {
  const [pendingCount, setPendingCount] = useState<number>(offlineQueue.count());
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const updateStatus = () => {
    setPendingCount(offlineQueue.count());
    setIsOnline(navigator.onLine);
  };

  const handleSyncNow = async () => {
    if (isSyncing || pendingCount === 0) return;

    try {
      setIsSyncing(true);
      const result = await offlineQueue.syncAll(apiService, (tx) => {
        if (onTriggerToast) {
          onTriggerToast(
            'success',
            'Transaksi Tersinkron',
            `Transaksi offline ${tx.id} (${tx.paymentMethod}) tersimpan ke server.`
          );
        }
      });

      updateStatus();

      if (result.syncedCount > 0 && onTriggerToast) {
        onTriggerToast(
          'success',
          'Sinkronisasi Selesai',
          `${result.syncedCount} transaksi offline telah tersinkronisasi sempurna ke database server.`
        );
      }
    } catch (err: any) {
      if (onTriggerToast) {
        onTriggerToast('warning', 'Sinkronisasi Tertunda', 'Server belum siap/offline. Mengulang secara otomatis saat terhubung.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    updateStatus();

    const handleQueueChange = () => updateStatus();
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync immediately when online event triggers
      handleSyncNow();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('pos_offline_queue_updated', handleQueueChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic auto-sync check every 10 seconds if there are pending items
    const interval = setInterval(() => {
      if (navigator.onLine && offlineQueue.count() > 0) {
        handleSyncNow();
      }
    }, 10000);

    return () => {
      window.removeEventListener('pos_offline_queue_updated', handleQueueChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div
      style={{
        background: !isOnline
          ? 'linear-gradient(135deg, #451a03 0%, #78350f 100%)'
          : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#ffffff',
        padding: '0.65rem 1.25rem',
        borderRadius: '12px',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
        border: !isOnline ? '1px solid #b45309' : '1px solid #334155',
        fontSize: '0.85rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: !isOnline ? '#f59e0b' : '#3b82f6',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {!isOnline ? <WifiOff size={18} /> : <Database size={18} />}
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {!isOnline ? (
              <span>Modus Kasir Offline (Server Pemeliharaan / Rebuild)</span>
            ) : (
              <span>{pendingCount} Transaksi Offline Menunggu Sinkronisasi</span>
            )}
            <span
              style={{
                fontSize: '0.65rem',
                padding: '0.15rem 0.5rem',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.2)',
                color: '#ffffff',
                fontWeight: 700,
              }}
            >
              100% Data Safe
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: '0.15rem' }}>
            {!isOnline
              ? 'Kasir tetap dapat mencetak & memproses transaksi. Data otomatis di-sync saat server online.'
              : 'Server telah siap. Klik "Sinkron Sekarang" atau tunggu auto-sync berjalan.'}
          </div>
        </div>
      </div>

      {pendingCount > 0 && (
        <button
          onClick={handleSyncNow}
          disabled={isSyncing}
          style={{
            padding: '0.45rem 0.9rem',
            borderRadius: '8px',
            border: 'none',
            background: '#ffffff',
            color: !isOnline ? '#78350f' : '#0f172a',
            fontWeight: 800,
            fontSize: '0.8rem',
            cursor: isSyncing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            transition: 'all 0.15s ease',
          }}
        >
          <RefreshCw size={14} className={isSyncing ? 'spin-icon' : ''} />
          {isSyncing ? 'Menyinkronkan...' : `Sync Sekarang (${pendingCount})`}
        </button>
      )}
    </div>
  );
};
