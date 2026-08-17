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
} from 'lucide-react';
import { NotificationPopover } from '../common/NotificationPopover';
import { User } from '../../types';

interface CashierLayoutProps {
  currentUser: User;
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isShiftLeader?: boolean;
  activeShiftId?: string | null;
  children: React.ReactNode;
}

export const CashierLayout: React.FC<CashierLayoutProps> = ({
  currentUser,
  onLogout,
  activeTab,
  onTabChange,
  isShiftLeader = false,
  activeShiftId,
  children,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const sidebarContent = (
    <div
      style={{
        width: '260px',
        background: 'var(--sidebar-bg, #ffffff)',
        transition: 'background 0.3s ease',
        color: '#1e293b',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.25rem 1rem',
        height: '100%',
        borderRight: '1px solid var(--sidebar-border, #e5e7eb)',
      }}
    >
      <div>
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.5rem 1.5rem 0.5rem', borderBottom: '1px solid #e5e7eb', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
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
              }}
            >
              <Store size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Main Branch
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>
                {isShiftLeader ? 'PJ Terminal Leader' : 'Kasir Operasional'}
              </span>
            </div>
          </div>

          {isMobileOpen && (
            <button
              onClick={() => setIsMobileOpen(false)}
              style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '0.25rem' }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Primary Call-to-Action Button (Tombol Aksi Utama: Slate Gelap #0F172A) */}
        <div style={{ marginBottom: '1.5rem', padding: '0 0.25rem' }}>
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
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem', background: '#f9fafb', padding: '1rem', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.25rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0f172a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
            {currentUser.full_name.charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {currentUser.full_name}
            </div>
            <div style={{ fontSize: '0.7rem', color: isShiftLeader ? '#4f46e5' : '#059669', fontWeight: 700 }}>
              {isShiftLeader ? 'Penanggung Jawab' : 'Kasir Operasional'}
            </div>
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
          transform: isMobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
        }}
      >
        {sidebarContent}
      </div>

      {/* 2. RIGHT MAIN WRAPPER (TOP BAR HEADER + CONTENT BODY) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
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
            zIndex: 40,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            gap: '0.5rem',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: activeShiftId ? '#f0fdf4' : '#fef2f2', padding: '0.3rem 0.6rem', borderRadius: '20px', border: activeShiftId ? '1px solid #bbf7d0' : '1px solid #fecaca' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: activeShiftId ? '#22c55e' : '#ef4444', flexShrink: 0 }}></span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: activeShiftId ? '#15803d' : '#991b1b', whiteSpace: 'nowrap' }}>
                {activeShiftId ? 'ACTIVE' : 'OFFLINE'}
              </span>
            </div>

            <NotificationPopover />

            <button
              onClick={() => onTabChange('SHIFT')}
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: '8px',
                border: 'none',
                background: '#4f46e5',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.75rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              Shift
            </button>
          </div>
        </header>

        {/* Content Body Canvas */}
        <main style={{ padding: '2rem', flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
};
