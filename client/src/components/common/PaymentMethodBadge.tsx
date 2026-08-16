import React from 'react';
import { getPaymentBadgeStyle } from '../../utils/paymentBadge';

interface PaymentMethodBadgeProps {
  method: string;
  size?: 'sm' | 'md' | 'lg';
  showLabelColor?: boolean;
}

export const PaymentMethodBadge: React.FC<PaymentMethodBadgeProps> = ({
  method,
  size = 'md',
  showLabelColor = false,
}) => {
  const badge = getPaymentBadgeStyle(method);
  const mUpper = (method || '').toUpperCase();

  const displayLabel = showLabelColor
    ? badge.text
    : mUpper === 'CASH'
    ? 'TUNAI'
    : mUpper;

  const padding = size === 'sm' ? '0.2rem 0.55rem' : size === 'lg' ? '0.4rem 0.9rem' : '0.25rem 0.7rem';
  const fontSize = size === 'sm' ? '0.72rem' : size === 'lg' ? '0.875rem' : '0.78rem';
  const dotSize = size === 'sm' ? '6px' : size === 'lg' ? '9px' : '7px';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding,
        borderRadius: '20px',
        fontSize,
        fontWeight: 900,
        background: badge.bg,
        color: badge.color,
        border: `1.5px solid ${badge.border}`,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          background: badge.color,
          boxShadow: `0 0 6px ${badge.color}`,
        }}
      />
      {displayLabel}
    </span>
  );
};
