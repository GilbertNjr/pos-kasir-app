import React from 'react';
import { Loader2 } from 'lucide-react';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'danger' | 'warning' | 'secondary' | 'ghost' | 'outline';
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  isLoading = false,
  loadingText,
  icon,
  variant = 'primary',
  children,
  disabled,
  style,
  onClick,
  type = 'button',
  ...props
}) => {
  const isDisabled = disabled || isLoading;

  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'danger':
        return {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
        };
      case 'warning':
        return {
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
        };
      case 'secondary':
        return {
          background: '#f1f5f9',
          color: '#334155',
          border: '1px solid #cbd5e1',
        };
      case 'outline':
        return {
          background: 'transparent',
          color: 'var(--color-primary, #2563eb)',
          border: '1px solid var(--color-primary, #2563eb)',
        };
      case 'ghost':
        return {
          background: 'transparent',
          color: '#64748b',
        };
      case 'primary':
      default:
        return {
          background: 'var(--primary-gradient, linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%))',
          color: '#ffffff',
          boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
        };
    }
  };

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: '0.65rem 1.25rem',
        borderRadius: '10px',
        fontWeight: 700,
        fontSize: '0.875rem',
        border: 'none',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.65 : 1,
        pointerEvents: isDisabled ? 'none' : 'auto',
        transition: 'all 0.15s ease',
        ...getVariantStyles(),
        ...style,
      }}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 0.8s linear infinite' }} />
          <span>{loadingText || 'Memproses Backend...'}</span>
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
};
