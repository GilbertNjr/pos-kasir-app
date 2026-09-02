import React, { useState } from 'react';
import { Menu, User as UserIcon, HelpCircle } from 'lucide-react';
import { User } from '../../types';
import { formatWaktuIndo } from '../../utils/formatters';
import { NotificationPopover } from '../common/NotificationPopover';
import { HelpModal } from '../common/HelpModal';
import { NetworkStatusBadge } from '../common/NetworkStatusBadge';

interface OwnerHeaderProps {
  currentUser: User;
  isSseConnected: boolean;
  onOpenMobileMenu: () => void;
  storeName?: string;
  logoUrl?: string;
}

export const OwnerHeader: React.FC<OwnerHeaderProps> = ({
  currentUser,
  isSseConnected,
  onOpenMobileMenu,
  logoUrl,
}) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  return (
    <header
      style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '0.65rem 0.85rem',
        paddingTop: 'calc(0.65rem + env(safe-area-inset-top, 0px))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        flexShrink: 0,
        gap: '0.5rem',
        width: '100%',
        maxWidth: '100vw',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1 }}>
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={onOpenMobileMenu}
          className="mobile-hamburger-btn"
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            padding: '0.2rem',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <Menu size={22} />
        </button>

        <div style={{ minWidth: 0, flex: 1 }}>
          <h1
            style={{
              fontSize: 'clamp(0.85rem, 3.2vw, 1.2rem)',
              fontWeight: 800,
              color: '#0f172a',
              margin: 0,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
            }}
          >
            Selamat datang, {currentUser.full_name && !currentUser.full_name.includes('Masukan') ? currentUser.full_name : (currentUser.username || 'Owner')}
          </h1>
          <p
            style={{
              fontSize: '0.675rem',
              color: '#64748b',
              margin: '0.1rem 0 0 0',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <span>{formatWaktuIndo(new Date().toISOString())}</span>
            <span className="header-hide-mobile">• POS Realtime</span>
            <span
              className="header-hide-mobile"
              style={{
                padding: '0.05rem 0.35rem',
                borderRadius: '4px',
                background: 'rgba(37,99,235,0.1)',
                color: '#2563eb',
                fontWeight: 800,
                fontSize: '0.65rem',
              }}
            >
              v1.7.2
            </span>
          </p>
        </div>
      </div>

      {/* Right Actions: Realtime Badge, Notification, Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
        {/* Network Online / Offline Status Badge */}
        <NetworkStatusBadge />

        {/* Status Realtime SSE Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.3rem 0.55rem',
            borderRadius: '20px',
            background: isSseConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${isSseConnected ? '#10b981' : '#ef4444'}`,
            fontSize: '0.725rem',
            fontWeight: 600,
            color: isSseConnected ? '#059669' : '#dc2626',
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: isSseConnected ? '#10b981' : '#ef4444',
              boxShadow: isSseConnected ? '0 0 8px #10b981' : 'none',
              flexShrink: 0,
            }}
          />
          <span className="header-badge-text-compact">{isSseConnected ? 'Realtime' : 'Offline'}</span>
        </div>

        {/* Bantuan Button */}
        <button
          onClick={() => setIsHelpOpen(true)}
          title="Pusat Bantuan & Panduan Sistem POS"
          className="header-hide-mobile"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.4rem 0.8rem',
            borderRadius: '20px',
            border: '1px solid var(--color-primary, #cbd5e1)',
            background: 'var(--accent-bg, #f8fafc)',
            color: 'var(--color-primary, #0f172a)',
            fontSize: '0.75rem',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <HelpCircle size={15} color="var(--color-primary)" />
          <span>Bantuan</span>
        </button>

        {/* Notification Bell */}
        <NotificationPopover />

        {/* User / Store Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', borderLeft: '1px solid #e2e8f0', paddingLeft: '0.55rem', marginLeft: '0.15rem' }}>
          <div
            className="sidebar-brand-logo"
            title={currentUser.full_name}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--primary-gradient)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
              overflow: 'hidden',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
              border: '2px solid #ffffff',
              flexShrink: 0,
              padding: 0,
            }}
          >
            {currentUser.avatar_url ? (
              <img src={currentUser.avatar_url} alt={currentUser.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : logoUrl ? (
              <img src={logoUrl} alt="Avatar Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <UserIcon size={16} />
            )}
          </div>
        </div>
      </div>

      {/* Help Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </header>
  );
};
