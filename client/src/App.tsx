import React, { useState, useEffect } from 'react';
import { LoginPage } from './pages/LoginPage';
import { ProductsPage } from './pages/ProductsPage';
import { ShiftPage } from './pages/ShiftPage';
import { PaymentSummaryPage } from './pages/PaymentSummaryPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { StockPage } from './pages/StockPage';
import { UsersPage } from './pages/UsersPage';
import { OwnerDashboardPage } from './pages/OwnerDashboardPage';
import { ShiftLeaderDashboardPage } from './pages/ShiftLeaderDashboardPage';
import { CashierDashboardPage } from './pages/CashierDashboardPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { BackupRestorePage } from './pages/BackupRestorePage';
import { PosRegister } from './components/PosRegister';
import { ToastNotification, ToastMessage, ToastType } from './components/ToastNotification';
import { OwnerLayout } from './components/layout/OwnerLayout';
import { CashierLayout } from './components/layout/CashierLayout';
import { apiService, ActiveShiftDetailsData } from './services/api';
import { User } from './types';
import { applyGlobalTheme } from './utils/themeHelper';
import { ActivateAccountPage } from './pages/ActivateAccountPage';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hash, setHash] = useState<string>(window.location.hash);
  const [ownerTab, setOwnerTab] = useState<string>('DASHBOARD');
  const [cashierTab, setCashierTab] = useState<string>('DASHBOARD');
  const [activeShiftData, setActiveShiftData] = useState<ActiveShiftDetailsData | null>(null);

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Global Toast Notification State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: ToastType, title: string, message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const loadActiveShift = () => {
    apiService
      .getActiveShift()
      .then((data) => setActiveShiftData(data))
      .catch(() => setActiveShiftData(null));
  };

  // Store Profile Realtime State
  const [storeProfile, setStoreProfile] = useState<{ name: string; ownerName: string; logoUrl: string }>({
    name: 'kui',
    ownerName: 'Ahmat Gebyar Gumelar',
    logoUrl: '',
  });

  const handleStoreProfileUpdate = (profile: { name: string; ownerName?: string; logoUrl: string }) => {
    setStoreProfile((prev) => ({
      ...prev,
      name: profile.name,
      logoUrl: profile.logoUrl,
      ownerName: profile.ownerName ?? prev.ownerName,
    }));

    if (profile.ownerName) {
      setCurrentUser((prev) => (prev && prev.role === 'OWNER' ? { ...prev, full_name: profile.ownerName! } : prev));
    }
  };

  // Initial Settings Load & SSE Settings Synchronizer
  useEffect(() => {
    // Fetch initial settings to hydrate active theme & store profile
    apiService
      .getSettings()
      .then((s) => {
        if (s?.store_profile) {
          const sName = s.store_profile.name || 'kui';
          const oName = s.store_profile.owner_name || 'Ahmat Gebyar Gumelar';
          const lUrl = s.store_profile.logo_url || '';

          setStoreProfile({ name: sName, ownerName: oName, logoUrl: lUrl });
          if (oName) {
            setCurrentUser((prev) => (prev && prev.role === 'OWNER' ? { ...prev, full_name: oName } : prev));
          }
        }
        if (s?.theme_settings?.theme_color) {
          applyGlobalTheme(s.theme_settings.theme_color, s.theme_settings.sidebar_color, s.theme_settings.dashboard_bg);
        } else {
          applyGlobalTheme('brown');
        }
      })
      .catch(() => {
        applyGlobalTheme('brown');
      });

    // Realtime EventSource SSE listener for settings & theme changes
    const sse = new EventSource('/api/events');
    sse.addEventListener('SETTINGS_UPDATED', (event: any) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.settings?.store_profile) {
          const sp = payload.settings.store_profile;
          setStoreProfile({
            name: sp.name || 'kui',
            ownerName: sp.owner_name || 'Ahmat Gebyar Gumelar',
            logoUrl: sp.logo_url || '',
          });
          if (sp.owner_name) {
            setCurrentUser((prev) => (prev && prev.role === 'OWNER' ? { ...prev, full_name: sp.owner_name } : prev));
          }
        }
        if (payload?.settings?.theme_settings?.theme_color) {
          applyGlobalTheme(
            payload.settings.theme_settings.theme_color,
            payload.settings.theme_settings.sidebar_color,
            payload.settings.theme_settings.dashboard_bg
          );
          addToast('info', 'Tema Sistem Diperbarui', 'Pemilik toko baru saja mengubah preferensi/warna tema secara real-time.');
        }
      } catch {
        apiService.getSettings().then((s) => {
          if (s?.store_profile) {
            setStoreProfile({
              name: s.store_profile.name || 'kui',
              ownerName: s.store_profile.owner_name || 'Ahmat Gebyar Gumelar',
              logoUrl: s.store_profile.logo_url || '',
            });
            if (s.store_profile.owner_name) {
              setCurrentUser((prev) => (prev && prev.role === 'OWNER' ? { ...prev, full_name: s.store_profile.owner_name } : prev));
            }
          }
          if (s?.theme_settings?.theme_color) {
            applyGlobalTheme(s.theme_settings.theme_color, s.theme_settings.sidebar_color, s.theme_settings.dashboard_bg);
          }
        });
      }
    });

    return () => {
      sse.close();
    };
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => {
      setCurrentUser(null);
      addToast('warning', 'Sesi Berakhir', 'Sesi otentikasi Anda telah kadaluwarsa. Silakan login kembali.');
    };
    window.addEventListener('pos_auth_expired', handleAuthExpired);
    return () => window.removeEventListener('pos_auth_expired', handleAuthExpired);
  }, []);

  useEffect(() => {
    const token = apiService.getToken();
    const storedUser = apiService.getStoredUser();

    if (token) {
      if (storedUser) {
        setCurrentUser(storedUser);
      }
      // Verifikasi token JWT dengan backend untuk memastikan role & profil 100% sinkron
      apiService
        .getProfile()
        .then((user) => {
          setCurrentUser(user);
          apiService.setAuth(token, user);
          loadActiveShift();
        })
        .catch((err) => {
          console.warn('[App] Profile fetch warning (cold start or temporary network lag):', err?.message);
          if (!storedUser) {
            apiService.clearAuth();
            setCurrentUser(null);
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    loadActiveShift();
    addToast('success', 'Selamat Datang!', `Berhasil masuk sebagai ${user.full_name} (${user.role}).`);
  };

  const handleLogout = () => {
    apiService.clearAuth();
    setCurrentUser(null);
    setActiveShiftData(null);
    addToast('info', 'Sesi Berakhir', 'Anda telah keluar dari aplikasi POS.');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Memuat Otentikasi POS...
      </div>
    );
  }

  if (!currentUser) {
    if (hash === '#activate') {
      return (
        <ActivateAccountPage
          onSuccess={(activatedUser?: User) => {
            window.location.hash = '';
            setHash('');
            if (activatedUser) {
              handleLoginSuccess(activatedUser);
            }
          }}
        />
      );
    }
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // ==========================================
  // 1. WORKSPACE KHUSUS OWNER (OWNER LAYOUT)
  // ==========================================
  if (currentUser.role === 'OWNER') {
    return (
      <OwnerLayout
        currentUser={currentUser}
        onLogout={handleLogout}
        activeTab={ownerTab}
        onTabChange={setOwnerTab}
        isSseConnected={true}
        storeName={storeProfile.name}
        logoUrl={storeProfile.logoUrl}
      >
        <ToastNotification toasts={toasts} onClose={removeToast} />

        {ownerTab === 'DASHBOARD' && (
          <OwnerDashboardPage onTriggerToast={addToast} onNavigateTab={setOwnerTab} />
        )}
        {(ownerTab === 'PENJUALAN' || ownerTab === 'TRANSAKSI') && <ReportsPage currentUser={currentUser} />}
        {ownerTab === 'PRODUCTS' && <ProductsPage currentUser={currentUser} onTriggerToast={addToast} />}
        {(ownerTab === 'BACKUP' || ownerTab === 'BACKUP_DATA' || ownerTab === 'SYNC' || ownerTab === 'KATEGORI') && (
          <BackupRestorePage currentUser={currentUser} />
        )}
        {ownerTab === 'STOCKS' && <StockPage currentUser={currentUser} onTriggerToast={addToast} />}
        {ownerTab === 'PEGAWAI' && <UsersPage currentUser={currentUser} onTriggerToast={addToast} />}
        {(ownerTab === 'SHIFT' || ownerTab === 'EXPENSES' || ownerTab === 'PENGELUARAN') && (
          <ExpensesPage currentUser={currentUser} activeShiftId={activeShiftData?.shift?.shift_id} />
        )}
        {ownerTab === 'REPORTS' && <ReportsPage currentUser={currentUser} />}
        {ownerTab === 'SETTINGS' && (
          <SettingsPage
            onTriggerToast={addToast}
            onStoreProfileUpdate={handleStoreProfileUpdate}
          />
        )}
      </OwnerLayout>
    );
  }

  // ==========================================
  // 2. WORKSPACE PENANGGUNG JAWAB & KARYAWAN
  // ==========================================
  const isShiftLeader = activeShiftData?.shift?.shift_leader_user_id === currentUser.user_id;

  return (
    <CashierLayout
      currentUser={currentUser}
      onLogout={handleLogout}
      activeTab={cashierTab}
      onTabChange={setCashierTab}
      isShiftLeader={isShiftLeader}
      activeShiftId={activeShiftData?.shift?.shift_id}
    >
      <ToastNotification toasts={toasts} onClose={removeToast} />

      {/* DASHBOARD TAB (PENANGGUNG JAWAB VS KARYAWAN) */}
      {cashierTab === 'DASHBOARD' && (
        isShiftLeader ? (
          <ShiftLeaderDashboardPage
            currentUser={currentUser}
            onNavigateTab={setCashierTab}
            onTriggerToast={addToast}
          />
        ) : (
          <CashierDashboardPage
            currentUser={currentUser}
            onNavigateTab={setCashierTab}
            onTriggerToast={addToast}
          />
        )
      )}

      {/* POS REGISTER TAB */}
      {cashierTab === 'POS' && (
        <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem', color: '#0f172a' }}>
            Kasir Register POS — Entri Transaksi
          </h2>
          <PosRegister
            currentUser={currentUser}
            activeShiftId={activeShiftData?.shift?.shift_id}
            onTransactionComplete={() => {
              loadActiveShift();
              addToast('success', 'Transaksi Selesai', 'Transaksi kasir berhasil diproses');
            }}
          />
        </div>
      )}

      {/* SHIFT MANAGMENT TAB */}
      {cashierTab === 'SHIFT' && (
        <ShiftPage currentUser={currentUser} onShiftStatusChange={loadActiveShift} />
      )}

      {/* STOCKS MANAGEMENT TAB (PENANGGUNG JAWAB & KASIR) */}
      {cashierTab === 'STOCKS' && (
        <StockPage currentUser={currentUser} onTriggerToast={addToast} />
      )}

      {/* EXPENSES TAB */}
      {cashierTab === 'EXPENSES' && (
        <ExpensesPage currentUser={currentUser} activeShiftId={activeShiftData?.shift?.shift_id} />
      )}

      {/* PAYMENT SUMMARY TAB */}
      {cashierTab === 'PAYMENT' && (
        <PaymentSummaryPage activeShift={activeShiftData?.shift ?? null} />
      )}
    </CashierLayout>
  );
};

export default App;
