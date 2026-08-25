import React from 'react';
import { AlertTriangle, Power, PackageCheck, HelpCircle, X } from 'lucide-react';

export interface ConfirmDetailItem {
  label: string;
  value: string;
  color?: string;
  highlight?: boolean;
}

export interface CustomConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  subtitle?: string;
  message?: string;
  warningNote?: string;
  details?: ConfirmDetailItem[];
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'primary' | 'warning' | 'success';
  iconType?: 'power' | 'package' | 'alert' | 'help';
  loading?: boolean;
  zIndex?: number;
}

export const CustomConfirmModal: React.FC<CustomConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  subtitle,
  message,
  warningNote,
  details = [],
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  confirmVariant = 'danger',
  iconType = 'alert',
  loading = false,
  zIndex = 100050,
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (confirmVariant) {
      case 'danger':
        return {
          iconBg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
          iconColor: '#dc2626',
          btnBg: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
          btnShadow: '0 4px 14px rgba(220, 38, 38, 0.3)',
          borderColor: '#fecaca',
        };
      case 'success':
        return {
          iconBg: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
          iconColor: '#16a34a',
          btnBg: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
          btnShadow: '0 4px 14px rgba(22, 163, 74, 0.3)',
          borderColor: '#bbf7d0',
        };
      case 'warning':
        return {
          iconBg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          iconColor: '#d97706',
          btnBg: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
          btnShadow: '0 4px 14px rgba(217, 119, 6, 0.3)',
          borderColor: '#fde68a',
        };
      case 'primary':
      default:
        return {
          iconBg: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
          iconColor: '#0284c7',
          btnBg: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          btnShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
          borderColor: '#bae6fd',
        };
    }
  };

  const vStyles = getVariantStyles();

  const renderIcon = () => {
    switch (iconType) {
      case 'power':
        return <Power size={32} color={vStyles.iconColor} />;
      case 'package':
        return <PackageCheck size={32} color={vStyles.iconColor} />;
      case 'help':
        return <HelpCircle size={32} color={vStyles.iconColor} />;
      case 'alert':
      default:
        return <AlertTriangle size={32} color={vStyles.iconColor} />;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: zIndex,
        padding: '1rem',
      }}
      onClick={() => !loading && onClose()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          maxWidth: '460px',
          width: '100%',
          padding: '1.75rem 1.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: `1px solid ${vStyles.borderColor}`,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          animation: 'scaleUp 0.2s ease-out',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={loading}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#64748b',
          }}
        >
          <X size={18} />
        </button>

        {/* Icon Header Badge */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: vStyles.iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.15rem',
            boxShadow: vStyles.btnShadow,
          }}
        >
          {renderIcon()}
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: '1.25rem',
            fontWeight: 900,
            color: '#0f172a',
            margin: '0 0 0.35rem 0',
            letterSpacing: '-0.02em',
            lineHeight: 1.3,
          }}
        >
          {title}
        </h3>

        {/* Subtitle */}
        {subtitle && (
          <p
            style={{
              fontSize: '0.85rem',
              color: '#64748b',
              margin: '0 0 1rem 0',
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </p>
        )}

        {/* Message Content */}
        {message && (
          <p
            style={{
              fontSize: '0.875rem',
              color: '#334155',
              margin: '0 0 1rem 0',
              lineHeight: 1.45,
              fontWeight: 600,
            }}
          >
            {message}
          </p>
        )}

        {/* Warning Note Box */}
        {warningNote && (
          <div
            style={{
              background: confirmVariant === 'danger' ? '#fef2f2' : '#fffbeb',
              border: `1px solid ${confirmVariant === 'danger' ? '#fecaca' : '#fde68a'}`,
              borderRadius: '14px',
              padding: '0.85rem 1rem',
              textAlign: 'left',
              marginBottom: '1.25rem',
              fontSize: '0.8rem',
              color: confirmVariant === 'danger' ? '#991b1b' : '#92400e',
              lineHeight: 1.45,
              width: '100%',
            }}
          >
            <strong style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
              ⚠️ PERHATIAN:
            </strong>
            {warningNote}
          </div>
        )}

        {/* Key-Value Details Summary Card */}
        {details.length > 0 && (
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '0.85rem 1rem',
              width: '100%',
              marginBottom: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              textAlign: 'left',
            }}
          >
            {details.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.825rem',
                  borderBottom: idx < details.length - 1 ? '1px dashed #e2e8f0' : 'none',
                  paddingBottom: idx < details.length - 1 ? '0.4rem' : 0,
                }}
              >
                <span style={{ color: '#64748b' }}>{item.label}</span>
                <span
                  style={{
                    fontWeight: item.highlight ? 900 : 700,
                    color: item.color || (item.highlight ? '#0f172a' : '#334155'),
                    fontSize: item.highlight ? '0.9rem' : '0.825rem',
                  }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', width: '100%' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '0.8rem 1rem',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              color: '#334155',
              fontWeight: 800,
              fontSize: '0.875rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '0.8rem 1rem',
              borderRadius: '12px',
              border: 'none',
              background: vStyles.btnBg,
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '0.875rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: vStyles.btnShadow,
              transition: 'all 0.15s ease',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Memproses...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
