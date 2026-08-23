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
          bg: '#064e3b',
          border: '#10b981',
          text: '#ecfdf5',
          icon: <CheckCircle2 size={22} color="#34d399" />,
        };
      case 'danger':
        return {
          bg: '#450a0a',
          border: '#ef4444',
          text: '#fef2f2',
          icon: <XCircle size={22} color="#f87171" />,
        };
      case 'warning':
        return {
          bg: '#451a03',
          border: '#f59e0b',
          text: '#fffbeb',
          icon: <AlertTriangle size={22} color="#fbbf24" />,
        };
      case 'info':
      default:
        return {
          bg: '#0f172a',
          border: '#3b82f6',
          text: '#f8fafc',
          icon: <Info size={22} color="#60a5fa" />,
        };
    }
  };

  const style = getStyle();

  return (
    <div
      style={{
        pointerEvents: 'auto',
        background: style.bg,
        color: style.text,
        padding: '0.95rem 1.15rem',
        borderRadius: '16px',
        border: `1.5px solid ${style.border}`,
        boxShadow: '0 20px 35px -10px rgba(15, 23, 42, 0.4), 0 0 15px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.85rem',
        animation: 'slideInRight 0.25s ease-out forwards',
        fontSize: '0.875rem',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div style={{ marginTop: '2px', flexShrink: 0 }}>{style.icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: '0.925rem', lineHeight: 1.25, marginBottom: '0.25rem', letterSpacing: '-0.01em' }}>
          {toast.title}
        </div>
        <div style={{ fontSize: '0.835rem', opacity: 0.95, lineHeight: 1.45, fontWeight: 500 }}>
          {toast.message}
        </div>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          border: 'none',
          color: style.text,
          borderRadius: '8px',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: '2px',
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
};
