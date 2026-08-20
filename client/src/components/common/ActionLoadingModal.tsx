import React from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';

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
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        pointerEvents: 'auto',
      }}
    >
      <style>{`
        @keyframes modalScaleIn {
          0% { opacity: 0; transform: scale(0.94) translateY(8px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes customSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.12); }
        }
      `}</style>

      <div
        style={{
          background: '#ffffff',
          borderRadius: '28px',
          padding: '2.25rem 2rem 1.75rem 2rem',
          maxWidth: '400px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(226, 232, 240, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
          position: 'relative',
          overflow: 'hidden',
          animation: 'modalScaleIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {/* Top Accent Gradient Bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #2563eb 0%, #4f46e5 50%, #059669 100%)',
          }}
        />

        {/* Modern Glowing Ring Spinner Container */}
        <div style={{ position: 'relative', width: '76px', height: '76px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Ambient Glow */}
          <div
            style={{
              position: 'absolute',
              inset: '-4px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(79, 70, 229, 0.22) 0%, rgba(255, 255, 255, 0) 75%)',
              animation: 'pulseGlow 2s ease-in-out infinite',
            }}
          />

          {/* Outer Spinner Track */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '3px solid #e0e7ff',
              borderTopColor: '#4f46e5',
              borderRightColor: '#2563eb',
              animation: 'customSpin 0.9s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite',
            }}
          />

          {/* Inner Icon Box */}
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #e0e7ff 0%, #eff6ff 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.9), 0 4px 12px rgba(79, 70, 229, 0.12)',
            }}
          >
            <Sparkles size={24} color="#4f46e5" />
          </div>
        </div>

        {/* Text Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.01em', lineHeight: 1.3 }}>
            {title}
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
            {message}
          </p>
        </div>

        {/* Sleek Protection / Notice Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            padding: '0.45rem 1rem',
            borderRadius: '9999px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            fontSize: '0.75rem',
            color: '#475569',
            fontWeight: 600,
            maxWidth: '100%',
            lineHeight: 1.3,
          }}
        >
          <ShieldCheck size={15} color="#059669" style={{ flexShrink: 0 }} />
          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {submessage || 'Mencegah duplikasi aksi & memperbarui data pegawai...'}
          </span>
        </div>
      </div>
    </div>
  );
};
