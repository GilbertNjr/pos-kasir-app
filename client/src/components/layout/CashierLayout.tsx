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
        background: 'var(--sidebar-bg, #1c140e)',
        transition: 'background 0.3s ease',
        color: '#a2a5b9',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.25rem 1rem',
        height: '100%',
        boxShadow: '4px 0 12px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div>
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.5rem 1.5rem 0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: isShiftLeader
                  ? 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)'
                  : 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              }}
            >
              <Store size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
                Main Branch
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#6c7293', fontWeight: 600 }}>
                {isShiftLeader ? 'PJ Terminal Leader' : 'Kasir Operasional'}
              </span>
            </div>
          </div>

          {isMobileOpen && (
            <button
              onClick={() => setIsMobileOpen(false)}
              style={{ background: 'none', border: 'none', color: '#a8a29e', cursor: 'pointer', padding: '0.25rem' }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Primary Call-to-Action Button */}
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
              background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)',
              transition: 'transform 0.15s ease',
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
              background: activeTab === 'DASHBOARD' ? '#4f46e5' : 'transparent',
              color: activeTab === 'DASHBOARD' ? '#ffffff' : '#a2a5b9',
              fontWeight: activeTab === 'DASHBOARD' ? 700 : 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
          >
            <LayoutDashboard size={18} color={activeTab === 'DASHBOARD' ? '#ffffff' : '#6c7293'} />
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
              background: activeTab === 'POS' ? '#4f46e5' : 'transparent',
              color: activeTab === 'POS' ? '#ffffff' : '#a2a5b9',
              fontWeight: activeTab === 'POS' ? 700 : 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
          >
            <ShoppingCart size={18} color={activeTab === 'POS' ? '#ffffff' : '#6c7293'} />
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
              background: activeTab === 'SHIFT' ? '#4f46e5' : 'transparent',
              color: activeTab === 'SHIFT' ? '#ffffff' : '#a2a5b9',
              fontWeight: activeTab === 'SHIFT' ? 700 : 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
          >
            <Clock size={18} color={activeTab === 'SHIFT' ? '#ffffff' : '#6c7293'} />
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
              background: activeTab === 'STOCKS' ? '#4f46e5' : 'transparent',
              color: activeTab === 'STOCKS' ? '#ffffff' : '#a2a5b9',
              fontWeight: activeTab === 'STOCKS' ? 700 : 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
          >
            <Package size={18} color={activeTab === 'STOCKS' ? '#ffffff' : '#6c7293'} />
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
              background: activeTab === 'EXPENSES' ? '#4f46e5' : 'transparent',
              color: activeTab === 'EXPENSES' ? '#ffffff' : '#a2a5b9',
              fontWeight: activeTab === 'EXPENSES' ? 700 : 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
          >
            <Receipt size={18} color={activeTab === 'EXPENSES' ? '#ffffff' : '#6c7293'} />
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
              background: activeTab === 'PAYMENT' ? '#4f46e5' : 'transparent',
              color: activeTab === 'PAYMENT' ? '#ffffff' : '#a2a5b9',
              fontWeight: activeTab === 'PAYMENT' ? 700 : 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
          >
            <CreditCard size={18} color={activeTab === 'PAYMENT' ? '#ffffff' : '#6c7293'} />
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
              background: activeTab === 'REPORTS' ? '#4f46e5' : 'transparent',
              color: activeTab === 'REPORTS' ? '#ffffff' : '#a2a5b9',
              fontWeight: activeTab === 'REPORTS' ? 700 : 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
          >
            <Receipt size={18} color={activeTab === 'REPORTS' ? '#ffffff' : '#6c7293'} />
            Pusat Laporan & Shift
          </button>
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid #2b2b40', paddingTop: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#32324a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
            {currentUser.full_name.charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {currentUser.full_name}
            </div>
            <div style={{ fontSize: '0.7rem', color: isShiftLeader ? '#818cf8' : '#34d399', fontWeight: 600 }}>
              {isShiftLeader ? 'Penanggung Jawab' : 'Kasir Operasional'}
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          style={{
            width: '100%',
            padding: '0.6rem 0.75rem',
            borderRadius: '8px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#fca5a5',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginTop: '0.25rem',
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
            height: '64px',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1rem',
            position: 'sticky',
            top: 0,
            zIndex: 40,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          {/* App Title & Hamburger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => setIsMobileOpen(true)}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#4f46e5', letterSpacing: '-0.03em' }}>ShiftMaster</span>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>POS</span>
            </div>
          </div>

          {/* Right Shift Indicator & Action Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: activeShiftId ? '#f0fdf4' : '#fef2f2', padding: '0.35rem 0.85rem', borderRadius: '20px', border: activeShiftId ? '1px solid #bbf7d0' : '1px solid #fecaca' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeShiftId ? '#22c55e' : '#ef4444' }}></span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: activeShiftId ? '#15803d' : '#991b1b' }}>
                {activeShiftId ? `SHIFT ACTIVE (${activeShiftId})` : 'SHIFT OFFLINE'}
              </span>
            </div>

            <NotificationPopover />

            <button
              onClick={() => onTabChange('SHIFT')}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background: '#4f46e5',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              Start Shift
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
