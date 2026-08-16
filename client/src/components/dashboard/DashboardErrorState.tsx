import React from 'react';
import { AlertCircle, RefreshCw, LogOut } from 'lucide-react';
import { apiService } from '../../services/api';

interface DashboardErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export const DashboardErrorState: React.FC<DashboardErrorStateProps> = ({ message, onRetry }) => {
  const isPermissionError = message?.includes('OWNER') || message?.includes('Akses ditolak');

  const handleResetSession = () => {
    apiService.clearAuth();
    window.location.reload();
  };

  return (
    <div
      style={{
        padding: '3rem 1.5rem',
        textAlign: 'center',
        background: '#ffffff',
        border: '1px solid #fecaca',
        borderRadius: '20px',
        color: '#dc2626',
        maxWidth: '520px',
        margin: '3rem auto',
        boxShadow: '0 10px 25px rgba(220, 38, 38, 0.08)',
      }}
    >
      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
        <AlertCircle size={30} />
      </div>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: '0 0 0.5rem 0', color: '#991b1b' }}>
        {isPermissionError ? 'Sesi Login Memerlukan Login Ulang' : 'Gagal Memuat Data Dashboard'}
      </h3>
      <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>
        {message || 'Koneksi ke server terputus atau terjadi kesalahan saat mengambil analitik bisnis.'}
      </p>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={onRetry}
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: '10px',
            border: 'none',
            background: '#2563eb',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <RefreshCw size={16} /> Coba Lagi
        </button>

        {isPermissionError && (
          <button
            onClick={handleResetSession}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              border: '1px solid #fecaca',
              background: '#fef2f2',
              color: '#dc2626',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <LogOut size={16} /> Login Ulang Akun Owner
          </button>
        )}
      </div>
    </div>
  );
};
