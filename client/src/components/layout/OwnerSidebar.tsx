import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Package,
  Database,
  Store,
  Users,
  DollarSign,
  FileText,
  Settings,
  LogOut,
  X,
  Crown,
  Sparkles,
} from 'lucide-react';
import { User } from '../../types';

interface OwnerSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentUser: User;
  onLogout: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  storeName?: string;
  logoUrl?: string;
}

export const OwnerSidebar: React.FC<OwnerSidebarProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  onLogout,
  isOpenMobile,
  onCloseMobile,
  storeName = 'Toko Utama',
  logoUrl,
}) => {
  React.useEffect(() => {
    if (isOpenMobile) {
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
  }, [isOpenMobile]);
  const menuItems = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'PENJUALAN', label: 'Penjualan', icon: TrendingUp },
    { id: 'PRODUCTS', label: 'Produk', icon: Package },
    { id: 'STOCKS', label: 'Stok', icon: Store },
    { id: 'PEGAWAI', label: 'Pegawai', icon: Users },
    { id: 'EXPENSES', label: 'Pengeluaran', icon: DollarSign },
    { id: 'REPORTS', label: 'Laporan', icon: FileText },
    { id: 'SETTINGS', label: 'Pengaturan', icon: Settings },
    { id: 'BACKUP', label: 'Backup Data', icon: Database },
  ];

  const sidebarContent = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '100dvh',
        background: 'var(--sidebar-bg, #ffffff)',
        color: 'var(--sidebar-text, #0f172a)',
        width: '275px',
        borderRight: '1px solid var(--sidebar-border, #e5e7eb)',
        transition: 'background 0.3s ease',
        overflow: 'hidden',
      }}
    >
      {/* Brand Logo & Store Name */}
      <div
        style={{
          padding: '1.25rem 1.15rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--sidebar-border, #e5e7eb)',
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
              background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 50%, #b45309 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '1.2rem',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
              border: '1px solid #fef08a',
              overflow: 'hidden',
              flexShrink: 0,
              padding: 0,
            }}
          >
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <span>{(storeName || 'P').charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2
              style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                margin: 0,
                lineHeight: 1.3,
                color: 'var(--sidebar-text, #0f172a)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {storeName || 'Pos Kasir'}
            </h2>
            <div style={{ marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 50%, #b45309 100%)',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: 900,
                  letterSpacing: '0.04em',
                  boxShadow: '0 2px 6px rgba(245, 158, 11, 0.35)',
                  border: '1px solid #fef08a',
                  lineHeight: 1.2,
                }}
              >
                <Crown size={10} color="#ffffff" /> PEMILIK TOKO
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
                v1.7.5
              </span>
            </div>
          </div>
        </div>

        {isOpenMobile && (
          <button
            onClick={onCloseMobile}
            style={{ background: 'none', border: 'none', color: 'var(--sidebar-subtext, #64748b)', cursor: 'pointer', padding: '0.35rem', flexShrink: 0 }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Sidebar Menu Items */}
      <nav style={{ flex: 1, padding: '1rem 0.85rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                if (isOpenMobile) onCloseMobile();
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                border: 'none',
                background: isActive ? 'var(--sidebar-active-bg, #ddd6fe)' : 'transparent',
                color: isActive ? 'var(--sidebar-active-text, #5b21b6)' : 'var(--sidebar-muted-text, #4b5563)',
                fontWeight: isActive ? 800 : 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={18} color={isActive ? 'var(--sidebar-active-text, #5b21b6)' : 'var(--sidebar-subtext, #6b7280)'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile & Logout Bottom Section */}
      <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--sidebar-border, #e5e7eb)', background: 'transparent' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
            <div style={{ position: 'relative', width: '40px', height: '40px', flexShrink: 0 }}>
              <div
                className="sidebar-brand-logo"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: currentUser.role === 'OWNER'
                    ? 'linear-gradient(135deg, #fbbf24 0%, #d97706 50%, #b45309 100%)'
                    : '#0f172a',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '0.9rem',
                  overflow: 'hidden',
                  border: currentUser.role === 'OWNER' ? '2px solid #fef08a' : '2px solid #cbd5e1',
                  boxShadow: currentUser.role === 'OWNER' ? '0 0 12px rgba(245, 158, 11, 0.45)' : 'none',
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
              {currentUser.role === 'OWNER' && (
                <span
                  title="Pemilik Toko Utama (Owner)"
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
                    color: '#ffffff',
                    fontSize: '0.55rem',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1.5px solid #ffffff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  }}
                >
                  👑
                </span>
              )}
            </div>
            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--sidebar-text, #0f172a)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.full_name}
              </div>
              {currentUser.role === 'OWNER' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.22rem 0.65rem',
                      borderRadius: '20px',
                      background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 50%, #b45309 100%)',
                      color: '#ffffff',
                      fontSize: '0.675rem',
                      fontWeight: 900,
                      letterSpacing: '0.06em',
                      boxShadow: '0 3px 10px rgba(245, 158, 11, 0.45)',
                      border: '1px solid #fef08a',
                      textTransform: 'uppercase',
                      lineHeight: 1.2,
                    }}
                  >
                    <Crown size={12} color="#ffffff" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))' }} />
                    <span>PEMILIK TOKO</span>
                    <Sparkles size={10} color="#fef08a" />
                  </span>
                </div>
              ) : (
                <div style={{ fontSize: '0.7rem', color: 'var(--sidebar-subtext, #6b7280)' }}>
                  Role: {currentUser.is_pj || currentUser.role === 'PENANGGUNG_JAWAB' ? 'Penanggung Jawab (PJ)' : 'Kasir Operasional'}
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.55rem',
            borderRadius: '8px',
            border: 'none',
            background: '#fee2e2',
            color: '#991b1b',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <LogOut size={16} />
          Keluar
        </button>

        <div style={{ fontSize: '0.675rem', fontWeight: 800, color: 'var(--sidebar-subtext, #94a3b8)', textAlign: 'center', marginTop: '0.6rem', letterSpacing: '0.03em' }}>
          POS Kasir App • <span style={{ color: '#2563eb' }}>v1.7.5</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Sticky Fixed Positioning) */}
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

      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
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
          transform: isOpenMobile ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isOpenMobile ? '4px 0 24px rgba(0, 0, 0, 0.35)' : 'none',
          overflow: 'hidden',
        }}
      >
        {sidebarContent}
      </div>
    </>
  );
};
