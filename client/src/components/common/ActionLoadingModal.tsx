import React from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';

interface ActionLoadingModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  submessage?: string;
}

export const ActionLoadingModal: React.FC<ActionLoadingModalProps> = ({
  isOpen,
  title = 'Memproses Permintaan Ke Server...',
  message = 'Sistem backend POS sedang memverifikasi & menyimpan data. Mohon tunggu sejenak...',
  submessage,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        animation: 'fadeIn 0.2s ease-out forwards',
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          padding: '2.5rem 2rem',
          maxWidth: '440px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top Accent Gradient Bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)',
          }}
        />

        {/* Spinner Box */}
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '20px',
            background: 'rgba(59, 130, 246, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563eb',
            boxShadow: '0 8px 16px -4px rgba(37, 99, 235, 0.2)',
          }}
        >
          <Loader2 size={36} className="animate-spin" style={{ animation: 'spin 0.8s linear infinite' }} />
        </div>

        {/* Text Content */}
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            {title}
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.5rem 0 0 0', lineHeight: 1.5 }}>
            {message}
          </p>
        </div>

        {/* Notice Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.85rem',
            borderRadius: '20px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            fontSize: '0.75rem',
            color: '#475569',
            fontWeight: 600,
          }}
        >
          <ShieldAlert size={14} color="#3b82f6" />
          {submessage || 'Mencegah Duplikasi Data Penjualan & Input'}
        </div>
      </div>
    </div>
  );
};
