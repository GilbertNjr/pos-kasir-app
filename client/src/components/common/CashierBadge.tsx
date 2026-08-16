import React from 'react';

export interface CashierColorPalette {
  name: string;
  bg: string;
  border: string;
  text: string;
  avatarBg: string;
  avatarText: string;
}

export const CASHIER_COLOR_PALETTES: CashierColorPalette[] = [
  { name: 'blue', bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', avatarBg: '#3b82f6', avatarText: '#ffffff' },
  { name: 'emerald', bg: '#ecfdf5', border: '#a7f3d0', text: '#047857', avatarBg: '#10b981', avatarText: '#ffffff' },
  { name: 'purple', bg: '#f3e8ff', border: '#ddd6fe', text: '#6d28d9', avatarBg: '#8b5cf6', avatarText: '#ffffff' },
  { name: 'amber', bg: '#fffbeb', border: '#fde68a', text: '#b45309', avatarBg: '#f59e0b', avatarText: '#ffffff' },
  { name: 'rose', bg: '#ffe4e6', border: '#fecdd3', text: '#be123c', avatarBg: '#f43f5e', avatarText: '#ffffff' },
  { name: 'cyan', bg: '#ecfeff', border: '#a5f3fc', text: '#0e7490', avatarBg: '#06b6d4', avatarText: '#ffffff' },
  { name: 'indigo', bg: '#e0e7ff', border: '#c7d2fe', text: '#4338ca', avatarBg: '#6366f1', avatarText: '#ffffff' },
  { name: 'teal', bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', avatarBg: '#14b8a6', avatarText: '#ffffff' },
];

export const getCashierColor = (identifier: string = ''): CashierColorPalette => {
  if (!identifier) return CASHIER_COLOR_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % CASHIER_COLOR_PALETTES.length;
  return CASHIER_COLOR_PALETTES[index];
};

interface CashierBadgeProps {
  name: string;
  role?: string;
  showAvatar?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const CashierBadge: React.FC<CashierBadgeProps> = ({
  name,
  role,
  showAvatar = true,
  size = 'md',
}) => {
  const color = getCashierColor(name);
  const initial = name ? name.trim().charAt(0).toUpperCase() : 'K';

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  const padding = isSmall ? '0.2rem 0.55rem' : isLarge ? '0.45rem 0.85rem' : '0.3rem 0.65rem';
  const fontSize = isSmall ? '0.75rem' : isLarge ? '0.9rem' : '0.825rem';
  const avatarSize = isSmall ? '18px' : isLarge ? '28px' : '22px';
  const avatarFontSize = isSmall ? '0.65rem' : isLarge ? '0.85rem' : '0.75rem';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.45rem',
        padding: padding,
        borderRadius: '20px',
        background: color.bg,
        border: `1px solid ${color.border}`,
        color: color.text,
        fontSize: fontSize,
        fontWeight: 800,
        boxShadow: `0 2px 6px ${color.bg}`,
      }}
    >
      {showAvatar && (
        <span
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: '50%',
            background: color.avatarBg,
            color: color.avatarText,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: avatarFontSize,
            fontWeight: 900,
            flexShrink: 0,
          }}
        >
          {initial}
        </span>
      )}
      <span>{name}</span>
      {role && <span style={{ opacity: 0.7, fontWeight: 600, fontSize: '0.9em' }}>({role})</span>}
    </span>
  );
};
