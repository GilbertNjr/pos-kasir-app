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
        background: 'var(--sidebar-bg, #ffffff)',
        color: '#1e293b',
        width: '260px',
        borderRight: '1px solid var(--sidebar-border, #e5e7eb)',
        transition: 'background 0.3s ease',
      }}
    >
      {/* Brand Logo & Store Name */}
      <div
        style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--sidebar-border, #e5e7eb)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.2rem',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span>{storeName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <h2
              style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                margin: 0,
                color: '#0f172a',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {storeName}
            </h2>
            <span style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 600 }}>Business Analytics</span>
          </div>
        </div>

        {isOpenMobile && (
          <button
            onClick={onCloseMobile}
            style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '0.25rem' }}
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
                background: isActive ? '#ddd6fe' : 'transparent',
                color: isActive ? '#5b21b6' : '#4b5563',
                fontWeight: isActive ? 800 : 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={18} color={isActive ? '#5b21b6' : '#6b7280'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile & Logout Bottom Section */}
      <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--sidebar-border, #e5e7eb)', background: '#f9fafb' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#0f172a',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {logoUrl ? (
                <img src={logoUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                currentUser.full_name.charAt(0).toUpperCase()
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.full_name}</div>
              <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Role: {currentUser.role}</div>
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
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(3px)',
            zIndex: 90,
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
          zIndex: 100,
          transform: isOpenMobile ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
        }}
      >
        {sidebarContent}
      </div>
    </>
  );
};
