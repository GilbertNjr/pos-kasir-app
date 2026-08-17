import React, { useState } from 'react';
import { Menu, User as UserIcon, HelpCircle } from 'lucide-react';
import { User } from '../../types';
import { formatWaktuIndo } from '../../utils/formatters';
import { NotificationPopover } from '../common/NotificationPopover';
import { HelpModal } from '../common/HelpModal';

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
        padding: '1rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={onOpenMobileMenu}
          className="mobile-hamburger-btn"
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Menu size={24} />
        </button>

        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: 'clamp(0.95rem, 3.5vw, 1.25rem)', fontWeight: 800, color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Selamat datang, {currentUser.full_name}
          </h1>
          <p style={{ fontSize: '0.725rem', color: '#64748b', margin: '0.15rem 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {formatWaktuIndo(new Date().toISOString())} • POS Realtime
          </p>
        </div>
      </div>

      {/* Right Actions: Realtime Badge, Notification, Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>

        {/* Status Realtime SSE Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '20px',
            background: isSseConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${isSseConnected ? '#10b981' : '#ef4444'}`,
            fontSize: '0.75rem',
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
            }}
          />
          <span>{isSseConnected ? 'Realtime Active' : 'Offline'}</span>
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

        {/* User / Store Avatar (Gambar No 2) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderLeft: '1px solid #e2e8f0', paddingLeft: '0.85rem' }}>
          <div
            title={currentUser.full_name}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'var(--primary-gradient)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.875rem',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              border: '2px solid #ffffff',
              flexShrink: 0,
            }}
          >
            {logoUrl ? (
              <img src={logoUrl} alt="Avatar Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <UserIcon size={18} />
            )}
          </div>
        </div>
      </div>

      {/* Help Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </header>
  );
};
