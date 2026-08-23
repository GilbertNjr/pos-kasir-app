import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface NetworkStatusBadgeProps {
  showLabelOnMobile?: boolean;
}

export const NetworkStatusBadge: React.FC<NetworkStatusBadgeProps> = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div
      title={
        isOnline
          ? 'Terhubung ke Internet / WiFi (Sistem Sinkron)'
          : 'Koneksi Terputus - Kasir Berjalan Mode Offline (Data Aman)'
      }
      className="network-badge-container"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.3rem 0.6rem',
        borderRadius: '20px',
        background: isOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.12)',
        border: `1px solid ${isOnline ? '#10b981' : '#ef4444'}`,
        color: isOnline ? '#059669' : '#dc2626',
        fontSize: '0.7rem',
        fontWeight: 800,
        letterSpacing: '0.03em',
        transition: 'all 0.3s ease',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {isOnline ? (
        <>
          <Wifi size={13} color="#059669" />
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 6px #10b981',
              flexShrink: 0,
            }}
          />
          <span className="network-badge-label" style={{ whiteSpace: 'nowrap' }}>ONLINE</span>
        </>
      ) : (
        <>
          <WifiOff size={13} color="#dc2626" />
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#ef4444',
              boxShadow: '0 0 6px #ef4444',
              flexShrink: 0,
            }}
          />
          <span className="network-badge-label" style={{ whiteSpace: 'nowrap' }}>OFFLINE</span>
        </>
      )}
    </div>
  );
};
