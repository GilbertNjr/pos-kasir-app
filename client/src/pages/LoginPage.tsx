import React, { useState } from 'react';
import {
  Store,
  Lock,
  User as UserIcon,
  AlertCircle,
  Eye,
  EyeOff,
  TrendingUp,
  Package,
  Users,
  ShieldCheck,
  Shield,
  LogIn,
  UserPlus,
  ChevronRight,
  Info,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { apiService } from '../services/api';
import { User } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Recovery Modal State
  const [showRecoverModal, setShowRecoverModal] = useState(false);
  const [recoverUsername, setRecoverUsername] = useState('owner');
  const [recoverNewPassword, setRecoverNewPassword] = useState('');
  const [recoverConfirmPassword, setRecoverConfirmPassword] = useState('');
  const [recovering, setRecovering] = useState(false);
  const [recoverError, setRecoverError] = useState<string | null>(null);
  const [recoverSuccess, setRecoverSuccess] = useState<string | null>(null);

  const handleRecoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoverError(null);
    setRecoverSuccess(null);

    if (!recoverUsername.trim() || !recoverNewPassword.trim()) {
      setRecoverError('Username dan Password Baru wajib diisi.');
      return;
    }
    if (recoverNewPassword.length < 6) {
      setRecoverError('Password baru minimal 6 karakter.');
      return;
    }
    if (recoverNewPassword !== recoverConfirmPassword) {
      setRecoverError('Konfirmasi password tidak cocok.');
      return;
    }

    try {
      setRecovering(true);
      const msg = await apiService.recoverPassword(recoverUsername.trim(), recoverNewPassword.trim());
      setRecoverSuccess(msg || 'Password berhasil diperbarui!');
      
      // Auto fill new password in main form
      setUsername(recoverUsername);
      setPassword(recoverNewPassword);

      setTimeout(() => {
        setShowRecoverModal(false);
        setSuccessMsg('Password berhasil diperbarui! Kredensial baru sudah diisikan. Klik Masuk.');
      }, 1200);
    } catch (err: any) {
      setRecoverError(err.message || 'Username tidak ditemukan.');
    } finally {
      setRecovering(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Username dan password tidak boleh kosong.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);
      const data = await apiService.login(username, password);
      setSuccessMsg(`Login Berhasil! Selamat datang kembali, ${data.user.full_name || data.user.username}. Mengalihkan...`);
      setTimeout(() => {
        onLoginSuccess(data.user);
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Gagal melakukan login. Periksa username dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f1f5f9',
        padding: '1rem',
        boxSizing: 'border-box',
      }}
    >
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-icon {
          animation: spin 1s linear infinite;
        }
        @media (max-width: 768px) {
          .auth-grid-container {
            grid-template-columns: 1fr !important;
            max-width: 480px !important;
            border-radius: 20px !important;
          }
          .auth-left-banner {
            padding: 2rem 1.5rem !important;
          }
          .auth-right-form {
            padding: 1.75rem 1.5rem !important;
          }
          .auth-left-banner .feature-list {
            display: none !important;
          }
          .auth-left-banner .bottom-widget {
            display: none !important;
          }
        }
      `}</style>

      {/* MAIN CONTAINER SPLIT CARD */}
      <div
        className="auth-grid-container"
        style={{
          maxWidth: '1000px',
          width: '100%',
          borderRadius: '28px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(15, 23, 42, 0.05)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          background: '#ffffff',
          margin: 'auto',
        }}
      >
        {/* LEFT COLUMN: DARK BLUE FEATURE SHOWCASE */}
        <div
          className="auth-left-banner"
          style={{
            background: 'linear-gradient(180deg, #0b192c 0%, #1e293b 100%)',
            padding: '3rem 2.5rem',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '2rem',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle decorative glow circle at bottom */}
          <div
            style={{
              position: 'absolute',
              bottom: '-80px',
              left: '-80px',
              width: '260px',
              height: '260px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(37, 99, 235, 0.25) 0%, rgba(37, 99, 235, 0) 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Top Brand Header */}
          <div>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                marginBottom: '1.25rem',
                boxShadow: '0 10px 20px -5px rgba(37, 99, 235, 0.5)',
              }}
            >
              <Store size={28} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#ffffff' }}>
                POS Kasir Usaha
              </h1>
              <span style={{ padding: '0.15rem 0.55rem', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.25)', color: '#60a5fa', fontSize: '0.75rem', fontWeight: 900, border: '1px solid rgba(96, 165, 250, 0.35)' }}>v1.7.9</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0, lineHeight: 1.5, maxWidth: '340px' }}>
              Sistem kasir & manajemen operasional toko dalam satu platform.
            </p>
          </div>

          {/* Feature Highlight List */}
          <div className="feature-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem', zIndex: 1 }}>
            {/* Feature 1 */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(37, 99, 235, 0.2)',
                  color: '#60a5fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <TrendingUp size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 0.2rem 0', color: '#ffffff' }}>
                  Pantau Penjualan Real-time
                </h3>
                <p style={{ fontSize: '0.785rem', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                  Lihat transaksi dan omzet toko secara real-time dari mana saja.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(37, 99, 235, 0.2)',
                  color: '#60a5fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Package size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 0.2rem 0', color: '#ffffff' }}>
                  Kelola Stok & Produk
                </h3>
                <p style={{ fontSize: '0.785rem', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                  Atur produk, stok, dan kategori dengan mudah dan cepat.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(37, 99, 235, 0.2)',
                  color: '#60a5fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Users size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 0.2rem 0', color: '#ffffff' }}>
                  Manajemen Pegawai
                </h3>
                <p style={{ fontSize: '0.785rem', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                  Kelola akses pegawai dan pantau aktivitas operasional toko.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(37, 99, 235, 0.2)',
                  color: '#60a5fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 0.2rem 0', color: '#ffffff' }}>
                  Aman & Terpercaya
                </h3>
                <p style={{ fontSize: '0.785rem', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                  Data toko aman, terbackup otomatis dan hanya bisa diakses oleh Anda.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Widget Graphic Preview */}
          <div
            className="bottom-widget"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '1rem 1.25rem',
              marginTop: '0.5rem',
              zIndex: 1,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>Ringkasan Operasional Real-time</div>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
            </div>
            <div style={{ height: '36px', display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
              <div style={{ flex: 1, height: '40%', background: '#3b82f6', borderRadius: '4px' }} />
              <div style={{ flex: 1, height: '65%', background: '#3b82f6', borderRadius: '4px' }} />
              <div style={{ flex: 1, height: '50%', background: '#3b82f6', borderRadius: '4px' }} />
              <div style={{ flex: 1, height: '85%', background: '#60a5fa', borderRadius: '4px' }} />
              <div style={{ flex: 1, height: '100%', background: '#2563eb', borderRadius: '4px' }} />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: WHITE FORM CONTAINER */}
        <div
          className="auth-right-form"
          style={{
            background: '#ffffff',
            padding: '2.5rem 2.75rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1.25rem',
          }}
        >
          {/* Badge Banner: Akses Owner */}
          <div
            style={{
              background: '#eff6ff',
              border: '1px solid #dbeafe',
              borderRadius: '16px',
              padding: '0.85rem 1.15rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: '#1d4ed8',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Shield size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#1e3a8a' }}>Portal Akses POS</div>
              <div style={{ fontSize: '0.775rem', color: '#3b82f6', fontWeight: 500 }}>
                Masuk untuk mengakses workspace Owner, Supervisor, & Kasir
              </div>
            </div>
          </div>

          {/* Main Titles */}
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.25rem 0', letterSpacing: '-0.02em' }}>
              Masuk ke Sistem POS
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
              Silakan masuk dengan akun Anda (Owner, Penanggung Jawab, & Kasir)
            </p>
          </div>

          {/* Active Loading Notification Banner */}
          {loading && (
            <div
              style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#1d4ed8',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
              }}
            >
              <Loader2 size={20} className="spin-icon" style={{ flexShrink: 0 }} />
              <span>Memverifikasi akun & menghubungkan ke server POS...</span>
            </div>
          )}

          {/* Active Success Notification Banner */}
          {successMsg && (
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#16a34a',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
              }}
            >
              <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Alert Error Message */}
          {error && !loading && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <AlertCircle size={20} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
              {error.toLowerCase().includes('aktivasi') && (
                <button
                  type="button"
                  onClick={() => {
                    window.location.hash = '#activate';
                  }}
                  style={{
                    alignSelf: 'flex-start',
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: '0.25rem',
                  }}
                >
                  Aktivasi Akun Sekarang →
                </button>
              )}
            </div>
          )}

          {/* Form Controls */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Username Input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', color: '#334155' }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <UserIcon
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                  }}
                />
                <input
                  type="text"
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.6rem',
                    borderRadius: '14px',
                    border: '1px solid #cbd5e1',
                    background: loading ? '#f8fafc' : '#ffffff',
                    color: '#0f172a',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', color: '#334155' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                  }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.75rem 2.6rem 0.75rem 2.6rem',
                    borderRadius: '14px',
                    border: '1px solid #cbd5e1',
                    background: loading ? '#f8fafc' : '#ffffff',
                    color: '#0f172a',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
                  disabled={loading}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#334155', fontWeight: 600, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  style={{ borderRadius: '4px', accentColor: '#2563eb' }}
                />
                Ingat saya
              </label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  setShowRecoverModal(true);
                }}
                style={{ color: '#2563eb', fontWeight: 700, textDecoration: 'none', cursor: 'pointer' }}
              >
                Lupa password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.85rem 1.25rem',
                borderRadius: '14px',
                background: loading ? '#93c5fd' : '#2563eb',
                color: '#ffffff',
                fontSize: '0.95rem',
                fontWeight: 800,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 10px 20px -5px rgba(37, 99, 235, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.55rem',
                transition: 'all 0.2s ease',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spin-icon" />
                  <span>Memverifikasi Kredensial...</span>
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Masuk ke Sistem POS</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.25rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            <span style={{ fontSize: '0.775rem', color: '#94a3b8', fontWeight: 600 }}>Pegawai baru?</span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          </div>

          {/* Employee Activation Card Button */}
          <div
            onClick={() => {
              if (!loading) window.location.hash = '#activate';
            }}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '0.85rem 1.15rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <UserPlus size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a' }}>Aktivasi Akun Pegawai</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Gunakan kode aktivasi yang diberikan owner untuk membuat akun baru.
                </div>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: '#94a3b8', flexShrink: 0 }} />
          </div>

          {/* Bottom Info Alert Box */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem',
            }}
          >
            <Info size={18} style={{ color: '#2563eb', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '0.785rem', fontWeight: 800, color: '#1e293b' }}>Portal Akses Utama POS</div>
              <div style={{ fontSize: '0.735rem', color: '#64748b', lineHeight: 1.4 }}>
                Halaman ini digunakan untuk login harian seluruh pengguna (Owner & Kasir yang sudah aktif). Bagi pegawai baru yang baru memiliki kode dari Owner, silakan klik 'Aktivasi Akun Pegawai' di bawah.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SIMPLE DIRECT PASSWORD RESET MODAL */}
      {showRecoverModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', padding: '1.75rem', maxWidth: '440px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Reset Password Akun</h3>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Masukkan username & password baru untuk memperbarui akun</div>
              </div>
            </div>

            {recoverSuccess && (
              <div style={{ padding: '0.75rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', color: '#166534', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <CheckCircle2 size={16} color="#16a34a" />
                <span>{recoverSuccess}</span>
              </div>
            )}

            {recoverError && (
              <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', color: '#991b1b', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <AlertCircle size={16} color="#dc2626" />
                <span>{recoverError}</span>
              </div>
            )}

            <form onSubmit={handleRecoverSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>Username Akun *</label>
                <input
                  type="text"
                  value={recoverUsername}
                  onChange={(e) => setRecoverUsername(e.target.value)}
                  placeholder="e.g. owner / budi"
                  required
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#0f172a', fontWeight: 700 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>Password Baru * (Min 6 Karakter)</label>
                <input
                  type="password"
                  value={recoverNewPassword}
                  onChange={(e) => setRecoverNewPassword(e.target.value)}
                  placeholder="Masukkan password baru"
                  required
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#0f172a' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>Konfirmasi Password Baru *</label>
                <input
                  type="password"
                  value={recoverConfirmPassword}
                  onChange={(e) => setRecoverConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  required
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#0f172a' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowRecoverModal(false)}
                  style={{ flex: 1, padding: '0.65rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={recovering}
                  style={{ flex: 1.3, padding: '0.65rem', borderRadius: '10px', border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}
                >
                  {recovering ? <Loader2 size={16} className="spin-icon" /> : null}
                  <span>{recovering ? 'Memproses...' : 'Simpan Password Baru'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
