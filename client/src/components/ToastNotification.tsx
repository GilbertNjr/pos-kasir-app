import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'danger' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

interface ToastNotificationProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onClose }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '1.25rem',
        right: '1.25rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        maxWidth: '380px',
        width: 'calc(100vw - 2.5rem)',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <SingleToast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};

const SingleToast: React.FC<{ toast: ToastMessage; onClose: (id: string) => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const getStyle = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'rgba(16, 185, 129, 0.95)',
          border: '#059669',
          icon: <CheckCircle2 size={20} color="#fff" />,
        };
      case 'danger':
        return {
          bg: 'rgba(239, 68, 68, 0.95)',
          border: '#dc2626',
          icon: <XCircle size={20} color="#fff" />,
        };
      case 'warning':
        return {
          bg: 'rgba(245, 158, 11, 0.95)',
          border: '#d97706',
          icon: <AlertTriangle size={20} color="#fff" />,
        };
      case 'info':
      default:
        return {
          bg: 'rgba(37, 99, 235, 0.95)',
          border: '#1d4ed8',
          icon: <Info size={20} color="#fff" />,
        };
    }
  };

  const style = getStyle();

  return (
    <div
      style={{
        pointerEvents: 'auto',
        background: style.bg,
        backdropFilter: 'blur(8px)',
        color: '#ffffff',
        padding: '0.85rem 1rem',
        borderRadius: 'var(--radius-md, 8px)',
        borderLeft: `5px solid ${style.border}`,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        animation: 'slideInRight 0.25s ease-out forwards',
        fontSize: '0.875rem',
      }}
    >
      <div style={{ marginTop: '2px', flexShrink: 0 }}>{style.icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.2, marginBottom: '0.2rem' }}>
          {toast.title}
        </div>
        <div style={{ fontSize: '0.825rem', opacity: 0.95, lineHeight: 1.35 }}>
          {toast.message}
        </div>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#ffffff',
          opacity: 0.7,
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
      >
        <X size={16} />
      </button>
    </div>
  );
};
