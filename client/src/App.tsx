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
import { OwnerTransactionsPage } from './pages/OwnerTransactionsPage';
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
  const [ownerTabState, setOwnerTabState] = useState<string>(() => localStorage.getItem('pos_owner_tab') || 'DASHBOARD');
  const [cashierTabState, setCashierTabState] = useState<string>(() => localStorage.getItem('pos_cashier_tab') || 'DASHBOARD');
  const [activeShiftData, setActiveShiftData] = useState<ActiveShiftDetailsData | null>(() => {
    try {
      const cached = localStorage.getItem('pos_cached_active_shift');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const ownerTab = ownerTabState;
  const cashierTab = cashierTabState;

  const setOwnerTab = (tab: string) => {
    localStorage.setItem('pos_owner_tab', tab);
    setOwnerTabState(tab);
  };

  const setCashierTab = (tab: string) => {
    localStorage.setItem('pos_cashier_tab', tab);
    setCashierTabState(tab);
  };

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
      .then((data) => {
        setActiveShiftData(data);
        if (data && data.shift) {
          localStorage.setItem('pos_cached_active_shift', JSON.stringify(data));
        } else {
          localStorage.removeItem('pos_cached_active_shift');
        }
      })
      .catch(() => {
        setActiveShiftData(null);
        localStorage.removeItem('pos_cached_active_shift');
      });
  };

  // Store Profile Realtime State (hydrated from localStorage cache first)
  const [storeProfile, setStoreProfile] = useState<{ name: string; ownerName: string; logoUrl: string }>(() => {
    try {
      const cached = localStorage.getItem('pos_store_profile');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.name) return parsed;
      }
    } catch {}
    return {
      name: 'KEZHO',
      ownerName: 'Ahmat Gebyar Gumelar',
      logoUrl: '',
    };
  });

  const handleStoreProfileUpdate = (profile: { name: string; ownerName?: string; logoUrl: string }) => {
    setStoreProfile((prev) => {
      const nextProfile = {
        name: profile.name || prev.name,
        ownerName: profile.ownerName ?? prev.ownerName,
        logoUrl: profile.logoUrl,
      };
      try {
        localStorage.setItem('pos_store_profile', JSON.stringify(nextProfile));
      } catch {}
      return nextProfile;
    });

    if (profile.ownerName) {
      setCurrentUser((prev) => {
        if (prev && prev.role === 'OWNER') {
          const updated = { ...prev, full_name: profile.ownerName! };
          const token = apiService.getToken();
          if (token) apiService.setAuth(token, updated);
          return updated;
        }
        return prev;
      });
    }
  };

  const refreshSettingsAndTheme = () => {
    apiService
      .getSettings()
      .then((s) => {
        if (s?.store_profile) {
          const sName = s.store_profile.name || 'KEZHO';
          const oName = s.store_profile.owner_name || 'Ahmat Gebyar Gumelar';
          const lUrl = s.store_profile.logo_url || '';

          const updated = { name: sName, ownerName: oName, logoUrl: lUrl };
          setStoreProfile(updated);
          try {
            localStorage.setItem('pos_store_profile', JSON.stringify(updated));
          } catch {}

          if (oName) {
            setCurrentUser((prev) => {
              if (prev && prev.role === 'OWNER') {
                const updatedUser = { ...prev, full_name: oName };
                const token = apiService.getToken();
                if (token) apiService.setAuth(token, updatedUser);
                return updatedUser;
              }
              return prev;
            });
          }
        }
        if (s?.theme_settings?.theme_color) {
          applyGlobalTheme(s.theme_settings.theme_color, s.theme_settings.sidebar_color, s.theme_settings.dashboard_bg);
        } else {
          applyGlobalTheme('dark_slate');
        }
      })
      .catch(() => {
        applyGlobalTheme('dark_slate');
      });
  };

  // Initial Settings Load & SSE Settings Synchronizer
  useEffect(() => {
    refreshSettingsAndTheme();

    // Realtime EventSource SSE listener for settings & theme changes
    const sse = new EventSource('/api/events');
    sse.addEventListener('SETTINGS_UPDATED', (event: any) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.settings?.store_profile) {
          const sp = payload.settings.store_profile;
          const updated = {
            name: sp.name || 'KEZHO',
            ownerName: sp.owner_name || 'Ahmat Gebyar Gumelar',
            logoUrl: sp.logo_url || '',
          };
          setStoreProfile(updated);
          try {
            localStorage.setItem('pos_store_profile', JSON.stringify(updated));
          } catch {}

          if (sp.owner_name) {
            setCurrentUser((prev) => {
              if (prev && prev.role === 'OWNER') {
                const updatedUser = { ...prev, full_name: sp.owner_name };
                const token = apiService.getToken();
                if (token) apiService.setAuth(token, updatedUser);
                return updatedUser;
              }
              return prev;
            });
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
        refreshSettingsAndTheme();
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
          let updatedUser = user;
          const cachedProfile = localStorage.getItem('pos_store_profile');
          if (user.role === 'OWNER' && cachedProfile) {
            try {
              const parsed = JSON.parse(cachedProfile);
              if (parsed.ownerName) {
                updatedUser = { ...user, full_name: parsed.ownerName };
              }
            } catch {}
          }
          setCurrentUser(updatedUser);
          apiService.setAuth(token, updatedUser);
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
    refreshSettingsAndTheme();
    const roleLabel =
      user.role === 'OWNER'
        ? 'Owner'
        : user.role === 'PENANGGUNG_JAWAB' || Boolean(user.is_pj)
        ? 'Penanggung Jawab (PJ)'
        : 'Kasir Operasional';
    addToast('success', 'Selamat Datang!', `Berhasil masuk sebagai ${user.full_name} (${roleLabel}).`);
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
        {(ownerTab === 'PENJUALAN' || ownerTab === 'TRANSAKSI') && (
          <OwnerTransactionsPage currentUser={currentUser} onTriggerToast={addToast} storeName={storeProfile.name} />
        )}
        {ownerTab === 'PRODUCTS' && <ProductsPage currentUser={currentUser} onTriggerToast={addToast} />}
        {(ownerTab === 'BACKUP' || ownerTab === 'BACKUP_DATA' || ownerTab === 'SYNC' || ownerTab === 'KATEGORI') && (
          <BackupRestorePage currentUser={currentUser} />
        )}
        {ownerTab === 'STOCKS' && <StockPage currentUser={currentUser} onTriggerToast={addToast} storeName={storeProfile.name} />}
        {ownerTab === 'PEGAWAI' && <UsersPage currentUser={currentUser} onTriggerToast={addToast} />}
        {(ownerTab === 'SHIFT' || ownerTab === 'EXPENSES' || ownerTab === 'PENGELUARAN') && (
          <ExpensesPage currentUser={currentUser} activeShiftId={activeShiftData?.shift?.shift_id} />
        )}
        {ownerTab === 'REPORTS' && <ReportsPage currentUser={currentUser} storeName={storeProfile.name} />}
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
  const isShiftLeader =
    (currentUser.role as string) === 'OWNER' ||
    currentUser.role === 'PENANGGUNG_JAWAB' ||
    Boolean(currentUser.is_pj);

  // Verifikasi apakah sesi shift aktif sedang berjalan di backend
  const isUserShiftActive = Boolean(activeShiftData?.shift?.shift_status === 'ACTIVE');

  const userActiveShiftId = isUserShiftActive ? activeShiftData?.shift?.shift_id : undefined;

  return (
    <CashierLayout
      currentUser={currentUser}
      onLogout={handleLogout}
      activeTab={cashierTab}
      onTabChange={setCashierTab}
      isShiftLeader={isShiftLeader}
      activeShiftId={userActiveShiftId}
      storeName={storeProfile.name}
      logoUrl={storeProfile.logoUrl}
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
            activeShiftId={userActiveShiftId}
            onNavigateTab={setCashierTab}
            onTriggerToast={addToast}
            onShiftStatusChange={loadActiveShift}
          />
        )
      )}

      {/* POS REGISTER TAB */}
      {cashierTab === 'POS' && (
        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.25rem', color: '#0f172a' }}>
            Kasir Register POS — Entri Transaksi
          </h2>
          <PosRegister
            currentUser={currentUser}
            activeShiftId={userActiveShiftId}
            onTransactionComplete={() => {
              loadActiveShift();
              addToast('success', 'Transaksi Selesai', 'Transaksi kasir berhasil diproses');
            }}
            onShiftOpened={() => {
              loadActiveShift();
              addToast('success', 'Shift Berhasil Dibuka', 'Sesi shift baru telah aktif dan laci kas terdaftar.');
            }}
          />
        </div>
      )}

      {/* SHIFT MANAGMENT TAB */}
      {cashierTab === 'SHIFT' && (
        <ShiftPage currentUser={currentUser} onShiftStatusChange={loadActiveShift} storeName={storeProfile.name} />
      )}

      {/* STOCKS MANAGEMENT TAB (PENANGGUNG JAWAB & KASIR) */}
      {cashierTab === 'STOCKS' && (
        <StockPage currentUser={currentUser} onTriggerToast={addToast} storeName={storeProfile.name} />
      )}

      {/* EXPENSES TAB */}
      {cashierTab === 'EXPENSES' && (
        <ExpensesPage currentUser={currentUser} activeShiftId={activeShiftData?.shift?.shift_id} onTriggerToast={addToast} />
      )}

      {/* PAYMENT SUMMARY TAB */}
      {cashierTab === 'PAYMENT' && (
        <PaymentSummaryPage currentUser={currentUser} activeShift={activeShiftData?.shift ?? null} onTriggerToast={addToast} storeName={storeProfile.name} />
      )}

      {/* REPORTS DASHBOARD TAB (PENANGGUNG JAWAB & KASIR) */}
      {cashierTab === 'REPORTS' && (
        <ReportsPage currentUser={currentUser} storeName={storeProfile.name} />
      )}

      {/* BACKUP & RESTORE DATA TAB (PENANGGUNG JAWAB & KASIR) */}
      {(cashierTab === 'BACKUP' || cashierTab === 'BACKUP_DATA') && (
        <BackupRestorePage currentUser={currentUser} onTriggerToast={addToast} />
      )}
    </CashierLayout>
  );
};

export default App;
