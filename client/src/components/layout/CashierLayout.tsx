import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Clock,
  Receipt,
  CreditCard,
  LogOut,
  Store,
  PlusCircle,
  Package,
  Menu,
  X,
  Crown,
  Database,
} from 'lucide-react';
import { NotificationPopover } from '../common/NotificationPopover';
import { OfflineSyncBanner } from '../common/OfflineSyncBanner';
import { NetworkStatusBadge } from '../common/NetworkStatusBadge';
import { User } from '../../types';

interface CashierLayoutProps {
  currentUser: User;
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isShiftLeader?: boolean;
  activeShiftId?: string | null;
  children: React.ReactNode;
  storeName?: string;
  logoUrl?: string;
}

export const CashierLayout: React.FC<CashierLayoutProps> = ({
  currentUser,
  onLogout,
  activeTab,
  onTabChange,
  isShiftLeader = false,
  activeShiftId,
  children,
  storeName = 'Toko Utama',
  logoUrl,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  React.useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isMobileOpen]);

  const sidebarContent = (
    <div
      style={{
        width: '275px',
        background: 'var(--sidebar-bg, #ffffff)',
        transition: 'background 0.3s ease',
        color: 'var(--sidebar-text, #0f172a)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '100dvh',
        borderRight: '1px solid var(--sidebar-border, #e5e7eb)',
        overflow: 'hidden',
      }}
    >
      {/* Brand Header (Sticky at Top, Dynamic Contrast Text) */}
      <div
        style={{
          padding: '1.25rem 1.15rem',
          borderBottom: '1px solid var(--sidebar-border, #e5e7eb)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'var(--sidebar-bg, #ffffff)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0, width: '100%' }}>
          <div
            className="sidebar-brand-logo"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#0f172a',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(15, 23, 42, 0.15)',
              overflow: 'hidden',
              flexShrink: 0,
              padding: 0,
            }}
          >
            {logoUrl ? (
              <img src={logoUrl} alt="Logo Toko" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <Store size={22} />
            )}
          </div>
          <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2
              style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                color: 'var(--sidebar-text, #0f172a)',
                margin: 0,
                lineHeight: 1.3,
                letterSpacing: '-0.02em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {storeName || 'Pos Kasir'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--sidebar-subtext, #64748b)',
                  fontWeight: 700,
                  lineHeight: 1.3,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {isShiftLeader ? 'PJ Terminal Leader' : 'Kasir Operasional'}
              </span>
              <span
                style={{
                  padding: '0.1rem 0.4rem',
                  borderRadius: '6px',
                  background: 'rgba(37,99,235,0.12)',
                  color: '#2563eb',
                  fontSize: '0.625rem',
                  fontWeight: 900,
                  border: '1px solid rgba(37,99,235,0.2)',
                }}
              >
                v1.7.4
              </span>
            </div>
          </div>
        </div>

        {isMobileOpen && (
          <button
            onClick={() => setIsMobileOpen(false)}
            style={{ background: 'none', border: 'none', color: 'var(--sidebar-subtext, #64748b)', cursor: 'pointer', padding: '0.35rem', flexShrink: 0 }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Middle Scrollable Section (CTA Button + Nav Links) */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {/* Primary Call-to-Action Button */}
        <div style={{ marginBottom: '0.75rem' }}>
          <button
            onClick={() => {
              onTabChange('POS');
              setIsMobileOpen(false);
            }}
            style={{
              width: '100%',
              padding: '0.8rem 1rem',
              borderRadius: '10px',
              border: 'none',
              background: '#0f172a',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            <PlusCircle size={18} />
            + Entri Transaksi Baru
          </button>
        </div>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {/* Overview / Dashboard */}
          <button
            onClick={() => {
              onTabChange('DASHBOARD');
              setIsMobileOpen(false);
            }}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'DASHBOARD' ? '#ddd6fe' : 'transparent',
              color: activeTab === 'DASHBOARD' ? '#5b21b6' : '#4b5563',
              fontWeight: activeTab === 'DASHBOARD' ? 800 : 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
          >
            <LayoutDashboard size={18} color={activeTab === 'DASHBOARD' ? '#5b21b6' : '#6b7280'} />
            Overview Shift
          </button>

          {/* Live Terminals / POS Register */}
          <button
            onClick={() => {
              onTabChange('POS');
              setIsMobileOpen(false);
            }}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'POS' ? '#ddd6fe' : 'transparent',
              color: activeTab === 'POS' ? '#5b21b6' : '#4b5563',
              fontWeight: activeTab === 'POS' ? 800 : 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
          >
            <ShoppingCart size={18} color={activeTab === 'POS' ? '#5b21b6' : '#6b7280'} />
            Live Kasir Register
          </button>

          {/* Sesi Shift Logs */}
          <button
            onClick={() => {
              onTabChange('SHIFT');
              setIsMobileOpen(false);
            }}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'SHIFT' ? '#ddd6fe' : 'transparent',
              color: activeTab === 'SHIFT' ? '#5b21b6' : '#4b5563',
              fontWeight: activeTab === 'SHIFT' ? 800 : 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
          >
            <Clock size={18} color={activeTab === 'SHIFT' ? '#5b21b6' : '#6b7280'} />
            Shift Logs & Modal
          </button>

          {/* Kelola Stok Barang */}
          <button
            onClick={() => {
              onTabChange('STOCKS');
              setIsMobileOpen(false);
            }}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'STOCKS' ? '#ddd6fe' : 'transparent',
              color: activeTab === 'STOCKS' ? '#5b21b6' : '#4b5563',
              fontWeight: activeTab === 'STOCKS' ? 800 : 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
          >
            <Package size={18} color={activeTab === 'STOCKS' ? '#5b21b6' : '#6b7280'} />
            Kelola Stok Barang
          </button>

          {/* Catat Pengeluaran */}
          <button
            onClick={() => {
              onTabChange('EXPENSES');
              setIsMobileOpen(false);
            }}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'EXPENSES' ? '#ddd6fe' : 'transparent',
              color: activeTab === 'EXPENSES' ? '#5b21b6' : '#4b5563',
              fontWeight: activeTab === 'EXPENSES' ? 800 : 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
          >
            <Receipt size={18} color={activeTab === 'EXPENSES' ? '#5b21b6' : '#6b7280'} />
            Catat Pengeluaran
          </button>

          {/* Rekap Pembayaran */}
          <button
            onClick={() => {
              onTabChange('PAYMENT');
              setIsMobileOpen(false);
            }}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'PAYMENT' ? '#ddd6fe' : 'transparent',
              color: activeTab === 'PAYMENT' ? '#5b21b6' : '#4b5563',
              fontWeight: activeTab === 'PAYMENT' ? 800 : 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
          >
            <CreditCard size={18} color={activeTab === 'PAYMENT' ? '#5b21b6' : '#6b7280'} />
            Rekap Pembayaran
          </button>

          {/* Pusat Laporan Penjualan & Stok */}
          <button
            onClick={() => {
              onTabChange('REPORTS');
              setIsMobileOpen(false);
            }}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'REPORTS' ? '#ddd6fe' : 'transparent',
              color: activeTab === 'REPORTS' ? '#5b21b6' : '#4b5563',
              fontWeight: activeTab === 'REPORTS' ? 800 : 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
          >
            <Receipt size={18} color={activeTab === 'REPORTS' ? '#5b21b6' : '#6b7280'} />
            Pusat Laporan & Shift
          </button>

          {/* Backup & Restore Data (Akses Kasir & PJ) */}
          <button
            onClick={() => {
              onTabChange('BACKUP');
              setIsMobileOpen(false);
            }}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'BACKUP' ? '#ddd6fe' : 'transparent',
              color: activeTab === 'BACKUP' ? '#5b21b6' : '#4b5563',
              fontWeight: activeTab === 'BACKUP' ? 800 : 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
          >
            <Database size={18} color={activeTab === 'BACKUP' ? '#5b21b6' : '#6b7280'} />
            Backup & Restore Data
          </button>
        </nav>
      </div>

      {/* Sidebar Footer (Fixed at Bottom, Never Shrinks) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--sidebar-border, #e5e7eb)', background: 'transparent', padding: '1rem', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.25rem' }}>
          <div style={{ position: 'relative', width: '38px', height: '38px', flexShrink: 0 }}>
            <div
              className="sidebar-brand-logo"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: currentUser.role === 'OWNER'
                  ? 'linear-gradient(135deg, #fbbf24 0%, #d97706 50%, #b45309 100%)'
                  : isShiftLeader ? '#f3e8ff' : '#e0f2fe',
                color: currentUser.role === 'OWNER' ? '#ffffff' : isShiftLeader ? '#6b21a8' : '#0369a1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '0.875rem',
                border: currentUser.role === 'OWNER'
                  ? '2px solid #fef08a'
                  : isShiftLeader ? '2px solid #9333ea' : '2px solid #38bdf8',
                boxShadow: currentUser.role === 'OWNER'
                  ? '0 0 10px rgba(245, 158, 11, 0.45)'
                  : isShiftLeader ? '0 0 8px rgba(147, 51, 234, 0.35)' : 'none',
                overflow: 'hidden',
                padding: 0,
              }}
            >
              {currentUser.avatar_url ? (
                <img src={currentUser.avatar_url} alt={currentUser.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : logoUrl ? (
                <img src={logoUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                currentUser.full_name.charAt(0).toUpperCase()
              )}
            </div>
            {currentUser.role === 'OWNER' ? (
              <span
                title="Pemilik Toko Utama"
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
                  color: '#ffffff',
                  fontSize: '0.55rem',
                  borderRadius: '50%',
                  width: '15px',
                  height: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid #ffffff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                👑
              </span>
            ) : isShiftLeader && (
              <span
                title="Penanggung Jawab Shift"
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  background: '#7e22ce',
                  color: '#ffffff',
                  fontSize: '0.55rem',
                  borderRadius: '50%',
                  width: '15px',
                  height: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid #ffffff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              >
                ⭐
              </span>
            )}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--sidebar-text, #0f172a)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {currentUser.full_name}
            </div>
            {currentUser.role === 'OWNER' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.15rem' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 50%, #b45309 100%)',
                    color: '#ffffff',
                    fontSize: '0.625rem',
                    fontWeight: 900,
                    letterSpacing: '0.04em',
                    boxShadow: '0 2px 6px rgba(245, 158, 11, 0.35)',
                    border: '1px solid #fef08a',
                    lineHeight: 1.2,
                  }}
                >
                  <Crown size={10} color="#ffffff" /> PEMILIK TOKO
                </span>
              </div>
            ) : (
              <div
                style={{
                  fontSize: '0.7rem',
                  color: isShiftLeader ? '#7e22ce' : '#0369a1',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                {isShiftLeader ? '⭐ Penanggung Jawab' : '👤 Kasir Operasional'}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onLogout}
          style={{
            width: '100%',
            padding: '0.55rem 0.75rem',
            borderRadius: '8px',
            border: 'none',
            background: '#fee2e2',
            color: '#991b1b',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginTop: '0.25rem',
            transition: 'all 0.15s ease',
          }}
        >
          <LogOut size={16} />
          Log Out Sesi Kasir
        </button>

        <div style={{ fontSize: '0.675rem', fontWeight: 800, color: 'var(--sidebar-subtext, #94a3b8)', textAlign: 'center', marginTop: '0.6rem', letterSpacing: '0.03em' }}>
          POS Kasir App • <span style={{ color: '#2563eb' }}>v1.7.4</span>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--dashboard-bg, #f8fafc)', transition: 'background 0.3s ease', color: '#0f172a', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Desktop Sidebar */}
      <aside
        className="desktop-sidebar-container"
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          flexShrink: 0,
          zIndex: 50,
        }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 999,
            touchAction: 'none',
          }}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          height: '100dvh',
          maxHeight: '100dvh',
          zIndex: 1000,
          background: 'var(--sidebar-bg, #ffffff)',
          transform: isMobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isMobileOpen ? '4px 0 24px rgba(0, 0, 0, 0.35)' : 'none',
          overflow: 'hidden',
        }}
      >
        {sidebarContent}
      </div>

      {/* 2. RIGHT MAIN WRAPPER (TOP BAR HEADER + CONTENT BODY) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100dvh', maxHeight: '100dvh', overflow: 'hidden' }}>
        {/* Top Header Bar */}
        <header
          style={{
            minHeight: '56px',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.4rem 0.75rem',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            gap: '0.5rem',
            flexShrink: 0,
          }}
        >
          {/* App Title & Hamburger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
            <button
              onClick={() => setIsMobileOpen(true)}
              className="mobile-hamburger-btn"
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '0.2rem',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Menu size={22} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#4f46e5', letterSpacing: '-0.03em' }}>ShiftMaster</span>
              <span className="header-hide-mobile" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>POS</span>
            </div>
          </div>

          {/* Right Shift Indicator & Action Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
            {/* Status Online / Offline Wifi Indicator (Logo Only on Mobile) */}
            <NetworkStatusBadge />

            {/* Status Shift: AKTIF / NONAKTIF (Kelihatan Jelas di Ponsel & Desktop) */}
            <div
              title={activeShiftId ? 'Sesi Shift Aktif' : 'Shift Nonaktif'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                background: activeShiftId ? '#f0fdf4' : '#fef2f2',
                padding: '0.28rem 0.55rem',
                borderRadius: '20px',
                border: activeShiftId ? '1px solid #bbf7d0' : '1px solid #fecaca',
                flexShrink: 0,
              }}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: activeShiftId ? '#22c55e' : '#ef4444', flexShrink: 0 }}></span>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: activeShiftId ? '#15803d' : '#991b1b', whiteSpace: 'nowrap' }}>
                {activeShiftId ? 'AKTIF' : 'NONAKTIF'}
              </span>
            </div>

            <NotificationPopover />

            {/* Tombol Shift (Tetap Terlihat Teks & Ikon Shift) */}
            <button
              onClick={() => onTabChange('SHIFT')}
              title="Kelola Sesi Shift Kasir"
              style={{
                padding: '0.35rem 0.6rem',
                borderRadius: '8px',
                border: 'none',
                background: '#4f46e5',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.75rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <Clock size={13} color="#ffffff" />
              <span>Shift</span>
            </button>
          </div>
        </header>

        {/* Content Body Canvas */}
        <main style={{ padding: '1.25rem', flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', overflowY: 'auto' }}>
          <OfflineSyncBanner />
          {children}
        </main>
      </div>
    </div>
  );
};
