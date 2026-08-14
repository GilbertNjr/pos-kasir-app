import React, { useState, useEffect } from 'react';
import { ShoppingCart, Store, ShieldCheck, Users, DollarSign, LogOut, UserCheck, Lock, AlertTriangle, CheckCircle, Package, Clock, TrendingUp, Receipt, LayoutDashboard, FileText, Database, Activity } from 'lucide-react';
import { formatRupiah } from './utils/formatters';
import { LoginPage } from './pages/LoginPage';
import { ProductsPage } from './pages/ProductsPage';
import { ShiftPage } from './pages/ShiftPage';
import { PaymentSummaryPage } from './pages/PaymentSummaryPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { StockPage } from './pages/StockPage';
import { OwnerDashboardPage } from './pages/OwnerDashboardPage';
import { ReportsPage } from './pages/ReportsPage';
import { BackupRestorePage } from './pages/BackupRestorePage';
import { AuditLogPage } from './pages/AuditLogPage';
import { PosRegister } from './components/PosRegister';
import { RoleGuard } from './components/RoleGuard';
import { apiService, ActiveShiftDetailsData } from './services/api';
import { User } from './types';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'POS' | 'PRODUCTS' | 'SHIFT' | 'PAYMENT' | 'EXPENSES' | 'STOCKS' | 'DASHBOARD' | 'REPORTS' | 'BACKUP' | 'AUDIT'>('POS');
  const [activeShiftData, setActiveShiftData] = useState<ActiveShiftDetailsData | null>(null);

  const [usersList, setUsersList] = useState<User[]>([]);
  const [rbacTestStatus, setRbacTestStatus] = useState<string | null>(null);
  const [rbacTestError, setRbacTestError] = useState<string | null>(null);

  const loadActiveShift = () => {
    apiService
      .getActiveShift()
      .then((data) => setActiveShiftData(data))
      .catch(() => setActiveShiftData(null));
  };

  useEffect(() => {
    // Check active session on load
    const storedUser = apiService.getStoredUser();
    const token = apiService.getToken();

    if (storedUser && token) {
      apiService
        .getProfile()
        .then((user) => {
          setCurrentUser(user);
          loadActiveShift();
        })
        .catch(() => {
          apiService.clearAuth();
          setCurrentUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    loadActiveShift();
    setUsersList([]);
    setRbacTestStatus(null);
    setRbacTestError(null);
  };

  const handleLogout = () => {
    apiService.clearAuth();
    setCurrentUser(null);
    setActiveShiftData(null);
    setUsersList([]);
    setRbacTestStatus(null);
    setRbacTestError(null);
  };

  const handleTestOwnerApi = async () => {
    setRbacTestStatus('Menguji Endpoint Owner Only (GET /api/auth/users)...');
    setRbacTestError(null);
    try {
      const data = await apiService.getUsers();
      setUsersList(data);
      setRbacTestStatus(`BERHASIL (HTTP 200 OK): Ditemukan ${data.length} akun terdaftar.`);
    } catch (err: any) {
      setRbacTestError(`DITOLAK (HTTP 403 Forbidden): ${err.message}`);
      setUsersList([]);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Memuat Otentikasi POS...
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Main App Navigation Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Store size={32} color="var(--primary-500)" />
          <div>
            <h1 style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>POS Kasir Usaha Campuran</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Fotokopi / Printing & Food & Beverage (FNB)</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.9rem' }}>
              <UserCheck size={16} color="var(--primary-600)" />
              <span>{currentUser.full_name}</span>
            </div>
            <span className={currentUser.role === 'OWNER' ? 'badge badge-fc' : 'badge badge-fnb'}>
              Role: {currentUser.role}
            </span>
          </div>

          <button
            onClick={handleLogout}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      {/* Primary Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('POS')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            border: '1px solid var(--border-color)',
            background: activeTab === 'POS' ? 'linear-gradient(135deg, var(--primary-500), var(--primary-600))' : 'var(--bg-card)',
            color: activeTab === 'POS' ? '#fff' : 'var(--text-secondary)',
          }}
        >
          <ShoppingCart size={18} />
          Kasir & Dashboard
        </button>

        <button
          onClick={() => setActiveTab('SHIFT')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            border: '1px solid var(--border-color)',
            background: activeTab === 'SHIFT' ? 'linear-gradient(135deg, var(--primary-500), var(--primary-600))' : 'var(--bg-card)',
            color: activeTab === 'SHIFT' ? '#fff' : 'var(--text-secondary)',
          }}
        >
          <Clock size={18} />
          Manajemen Shift {activeShiftData?.shift ? '🟢 (ACTIVE)' : '🔴 (OFFLINE)'}
        </button>

        <button
          onClick={() => setActiveTab('EXPENSES')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            border: '1px solid var(--border-color)',
            background: activeTab === 'EXPENSES' ? 'linear-gradient(135deg, var(--danger), #dc2626)' : 'var(--bg-card)',
            color: activeTab === 'EXPENSES' ? '#fff' : 'var(--text-secondary)',
          }}
        >
          <Receipt size={18} />
          Pengeluaran Kas
        </button>

        <button
          onClick={() => setActiveTab('PAYMENT')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            border: '1px solid var(--border-color)',
            background: activeTab === 'PAYMENT' ? 'linear-gradient(135deg, var(--primary-500), var(--primary-600))' : 'var(--bg-card)',
            color: activeTab === 'PAYMENT' ? '#fff' : 'var(--text-secondary)',
          }}
        >
          <TrendingUp size={18} />
          Rekap Pembayaran
        </button>

        <button
          onClick={() => setActiveTab('REPORTS')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            border: '1px solid var(--border-color)',
            background: activeTab === 'REPORTS' ? 'linear-gradient(135deg, var(--primary-500), var(--primary-600))' : 'var(--bg-card)',
            color: activeTab === 'REPORTS' ? '#fff' : 'var(--text-secondary)',
          }}
        >
          <FileText size={18} />
          Laporan Penjualan
        </button>

        {currentUser.role === 'OWNER' && (
          <>
            <button
              onClick={() => setActiveTab('BACKUP')}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                border: '1px solid var(--border-color)',
                background: activeTab === 'BACKUP' ? 'linear-gradient(135deg, var(--primary-600), #0891b2)' : 'var(--bg-card)',
                color: activeTab === 'BACKUP' ? '#fff' : 'var(--text-secondary)',
              }}
            >
              <Database size={18} />
              Backup & Restore
            </button>

            <button
              onClick={() => setActiveTab('AUDIT')}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                border: '1px solid var(--border-color)',
                background: activeTab === 'AUDIT' ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'var(--bg-card)',
                color: activeTab === 'AUDIT' ? '#fff' : 'var(--text-secondary)',
              }}
            >
              <Activity size={18} />
              Audit Log
            </button>

            <button
              onClick={() => setActiveTab('DASHBOARD')}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              border: '1px solid var(--border-color)',
              background: activeTab === 'DASHBOARD' ? 'linear-gradient(135deg, var(--primary-600), #1d4ed8)' : 'var(--bg-card)',
              color: activeTab === 'DASHBOARD' ? '#fff' : 'var(--text-secondary)',
            }}
          >
            <LayoutDashboard size={18} />
            👑 Dashboard Owner
          </button>
        </>
        )}

        <button
          onClick={() => setActiveTab('STOCKS')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            border: '1px solid var(--border-color)',
            background: activeTab === 'STOCKS' ? 'linear-gradient(135deg, var(--primary-500), var(--primary-600))' : 'var(--bg-card)',
            color: activeTab === 'STOCKS' ? '#fff' : 'var(--text-secondary)',
          }}
        >
          <Package size={18} />
          Stok Produk Fisik
        </button>

        <button
          onClick={() => setActiveTab('PRODUCTS')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            border: '1px solid var(--border-color)',
            background: activeTab === 'PRODUCTS' ? 'linear-gradient(135deg, var(--primary-500), var(--primary-600))' : 'var(--bg-card)',
            color: activeTab === 'PRODUCTS' ? '#fff' : 'var(--text-secondary)',
          }}
        >
          <Package size={18} />
          Katalog Master Produk
        </button>
      </div>

      <main className="card-glass" style={{ padding: '2rem' }}>
        {activeTab === 'POS' && (
          <div>
            {/* Metric Overview Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  <ShoppingCart size={20} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Shift Status</span>
                </div>
                <h3 style={{ fontSize: '1.25rem', color: activeShiftData?.shift ? 'var(--success)' : 'var(--danger)' }}>
                  {activeShiftData?.shift ? 'SHIFT ACTIVE' : 'TIDAK ADA SHIFT'}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {activeShiftData?.shift ? `PJ Shift: ${activeShiftData.shift.shift_leader_user_id}` : 'Buka Shift untuk Transaksi'}
                </p>
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  <DollarSign size={20} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Penjualan Tunai Shift</span>
                </div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--success)' }}>
                  {formatRupiah(activeShiftData?.shift?.net_cash_sales ?? 0)}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Pengeluaran Kas: {formatRupiah(activeShiftData?.shift?.total_cash_expenses ?? 0)}
                </p>
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  <Users size={20} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Identitas Kasir</span>
                </div>
                <h3 style={{ fontSize: '1.25rem' }}>{currentUser.username}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>User ID: {currentUser.user_id}</p>
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  <ShieldCheck size={20} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>RBAC Engine</span>
                </div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-600)' }}>{currentUser.role} GUARD</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>C/R/U/D/A/X Permission Matrix</p>
              </div>
            </div>

            {/* Component POS Register (Fast Checkout) */}
            <div style={{ marginBottom: '2rem' }}>
              <PosRegister
                currentUser={currentUser}
                activeShiftId={activeShiftData?.shift?.shift_id}
                onTransactionComplete={loadActiveShift}
              />
            </div>

            {/* Demo Section: Pengujian Hak Akses RBAC */}
            <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={20} color="var(--primary-500)" />
                Pengujian Keamanan RBAC (Backend & Frontend Middleware)
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Setiap endpoint sensitif dilindungi oleh RBAC Guard (`requireOwner`). Anda saat ini terautentikasi sebagai <strong>{currentUser.username} ({currentUser.role})</strong>.
              </p>

              <button onClick={handleTestOwnerApi} className="btn-primary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                Uji Akses API Owner Only (GET /api/auth/users)
              </button>

              {rbacTestStatus && !rbacTestError && (
                <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', borderRadius: 'var(--radius-md)', color: 'var(--success)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={18} />
                  <span>{rbacTestStatus}</span>
                </div>
              )}

              {rbacTestError && (
                <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={18} />
                  <span>{rbacTestError}</span>
                </div>
              )}

              {/* Render User List jika Owner */}
              {usersList.length > 0 && (
                <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '0.5rem' }}>User ID</th>
                        <th style={{ padding: '0.5rem' }}>Username</th>
                        <th style={{ padding: '0.5rem' }}>Nama Lengkap</th>
                        <th style={{ padding: '0.5rem' }}>Role Akun</th>
                        <th style={{ padding: '0.5rem' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersList.map((u) => (
                        <tr key={u.user_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.5rem' }}>{u.user_id}</td>
                          <td style={{ padding: '0.5rem', fontWeight: 600 }}>{u.username}</td>
                          <td style={{ padding: '0.5rem' }}>{u.full_name}</td>
                          <td style={{ padding: '0.5rem' }}>
                            <span className={u.role === 'OWNER' ? 'badge badge-fc' : 'badge badge-fnb'}>{u.role}</span>
                          </td>
                          <td style={{ padding: '0.5rem', color: 'var(--success)' }}>{u.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Dynamic UI Component Guard Example */}
            <RoleGuard
              userRole={currentUser.role}
              allow={['OWNER']}
              fallback={
                <div style={{ padding: '1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)', color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.875rem' }}>
                  🔒 Panel Kontrol Owner Admin Tersembunyi (Anda masuk sebagai Karyawan/Kasir).
                </div>
              }
            >
              <div style={{ padding: '1rem', background: 'rgba(37, 99, 235, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-500)', color: 'var(--primary-700)', fontSize: '0.875rem' }}>
                👑 <strong>Panel Owner Control Unlocked:</strong> Anda memiliki hak akses penuh untuk mengelola pengguna, memantau laporan keuangan, dan menyesuaikan stok.
              </div>
            </RoleGuard>

            <div style={{ textAlign: 'center', padding: '2rem 0 0', color: 'var(--text-secondary)' }}>
              <p style={{ fontWeight: 600 }}>Pengeluaran Kas Berhasil Diimplementasikan (Tahap 9)</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Siap dilanjutkan ke Tahap 10: Pengelolaan Stok Sederhana.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'SHIFT' && (
          <ShiftPage currentUser={currentUser} onShiftStatusChange={loadActiveShift} />
        )}

        {activeTab === 'EXPENSES' && (
          <ExpensesPage currentUser={currentUser} activeShiftId={activeShiftData?.shift?.shift_id} />
        )}

        {activeTab === 'PAYMENT' && (
          <PaymentSummaryPage activeShift={activeShiftData?.shift ?? null} />
        )}

        {activeTab === 'REPORTS' && (
          <ReportsPage currentUser={currentUser} />
        )}

        {activeTab === 'BACKUP' && (
          <BackupRestorePage currentUser={currentUser} />
        )}

        {activeTab === 'AUDIT' && (
          <AuditLogPage currentUser={currentUser} />
        )}

        {activeTab === 'DASHBOARD' && (
          <OwnerDashboardPage currentUser={currentUser} />
        )}

        {activeTab === 'STOCKS' && (
          <StockPage currentUser={currentUser} />
        )}

        {activeTab === 'PRODUCTS' && (
          <ProductsPage currentUser={currentUser} />
        )}
      </main>
    </div>
  );
};

export default App;
