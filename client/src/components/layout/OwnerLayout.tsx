import React, { useState } from 'react';
import { OwnerSidebar } from './OwnerSidebar';
import { OwnerHeader } from './OwnerHeader';
import { OfflineSyncBanner } from '../common/OfflineSyncBanner';
import { User } from '../../types';

interface OwnerLayoutProps {
  currentUser: User;
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isSseConnected: boolean;
  storeName?: string;
  logoUrl?: string;
  children: React.ReactNode;
}

export const OwnerLayout: React.FC<OwnerLayoutProps> = ({
  currentUser,
  onLogout,
  activeTab,
  onTabChange,
  isSseConnected,
  storeName,
  logoUrl,
  children,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--dashboard-bg, #f8fafc)', transition: 'background 0.3s ease' }}>
      {/* Sidebar Navigation */}
      <OwnerSidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        currentUser={currentUser}
        onLogout={onLogout}
        isOpenMobile={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        storeName={storeName}
        logoUrl={logoUrl}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100dvh', maxHeight: '100dvh', overflow: 'hidden' }}>
        <OwnerHeader
          currentUser={currentUser}
          isSseConnected={isSseConnected}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          storeName={storeName}
          logoUrl={logoUrl}
        />

        <main style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
          <OfflineSyncBanner />
          {children}
        </main>
      </div>
    </div>
  );
};
