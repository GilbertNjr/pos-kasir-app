import React, { useState } from 'react';
import {
  UserCheck,
  Key,
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  UserPlus,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Info,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { apiService } from '../services/api';

import { User } from '../types';

interface ActivateAccountPageProps {
  onSuccess: (user?: User) => void;
}

export const ActivateAccountPage: React.FC<ActivateAccountPageProps> = ({ onSuccess }) => {
  const [activationCode, setActivationCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!activationCode.trim()) {
      setError('Kode Aktivasi wajib diisi.');
      return;
    }
    if (!username.trim() || username.length < 3) {
      setError('Username minimal 3 karakter.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiService.activateAccount(activationCode.trim().toUpperCase(), username.trim(), password);
      setSuccessMsg('Akun berhasil diaktivasi! Mengalihkan ke sistem kasir POS...');
      setTimeout(() => {
        onSuccess(data.user);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Gagal melakukan aktivasi akun. Periksa kembali kode aktivasi Anda.');
    } finally {
      setIsLoading(false);
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
          .auth-left-banner .steps-list {
            display: none !important;
          }
          .auth-left-banner .bottom-status {
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
        {/* LEFT COLUMN: DARK BLUE FEATURE & INSTRUCTION BANNER */}
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
          {/* Subtle decorative glow circle */}
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
              <UserCheck size={28} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0', letterSpacing: '-0.02em', color: '#ffffff' }}>
              Portal Pegawai POS
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0, lineHeight: 1.5, maxWidth: '340px' }}>
              Aktivasi akun karyawan resmi untuk mulai bertugas di kasir & shift toko.
            </p>
          </div>

          {/* Steps Highlight List */}
          <div className="steps-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem', zIndex: 1 }}>
            {/* Step 1 */}
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
                <Key size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 0.2rem 0', color: '#ffffff' }}>
                  Kode Aktivasi Resmi
                </h3>
                <p style={{ fontSize: '0.785rem', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                  Dapatkan kode aktivasi unik dari Owner toko Anda.
                </p>
              </div>
            </div>

            {/* Step 2 */}
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
                <UserIcon size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 0.2rem 0', color: '#ffffff' }}>
                  Buat Username Unik
                </h3>
                <p style={{ fontSize: '0.785rem', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                  Tentukan nama pengguna pribadi untuk login ke sistem kasir.
                </p>
              </div>
            </div>

            {/* Step 3 */}
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
                  Password Aman
                </h3>
                <p style={{ fontSize: '0.785rem', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                  Buat kata sandi pribadi yang hanya diketahui oleh Anda.
                </p>
              </div>
            </div>

            {/* Step 4 */}
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
                <Clock size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 0.2rem 0', color: '#ffffff' }}>
                  Siap Buka Shift
                </h3>
                <p style={{ fontSize: '0.785rem', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                  Setelah teraktivasi, Anda dapat langsung login & membuka shift kasir.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Widget Status Bar */}
          <div
            className="bottom-status"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '0.85rem 1.15rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 1,
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>Status Server System</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.725rem', color: '#4ade80', fontWeight: 700 }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e' }} />
              Ready & Connected
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
            gap: '1.15rem',
          }}
        >
          {/* Top Navigation Row */}
          <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => onSuccess()}
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'none',
                border: 'none',
                color: '#2563eb',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1,
                padding: 0,
              }}
            >
              <ArrowLeft size={16} /> Kembali ke Login
            </button>
          </div>

          {/* Badge Banner Card */}
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
              <UserPlus size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#1e3a8a' }}>Aktivasi Akun Pegawai</div>
              <div style={{ fontSize: '0.775rem', color: '#3b82f6', fontWeight: 500 }}>
                Masukkan kode aktivasi dari owner & buat kredensial login Anda
              </div>
            </div>
          </div>

          {/* Active Loading Notification Banner */}
          {isLoading && (
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
              <span>Memverifikasi kode aktivasi & mendaftarkan ke server POS...</span>
            </div>
          )}

          {/* Notification Alerts */}
          {error && !isLoading && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
              }}
            >
              <AlertCircle size={20} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

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

          {/* Main Activation Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Input 1: Kode Aktivasi */}
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, marginBottom: '0.35rem', color: '#334155' }}>
                Kode Aktivasi (Misal: 7K9-XP2)
              </label>
              <div style={{ position: 'relative' }}>
                <Key
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
                  placeholder="Contoh: 7K9-XP2"
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                  required
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '0.7rem 1rem 0.7rem 2.6rem',
                    borderRadius: '14px',
                    border: '1px solid #cbd5e1',
                    background: isLoading ? '#f8fafc' : '#ffffff',
                    color: '#0f172a',
                    fontSize: '0.95rem',
                    fontFamily: 'monospace',
                    letterSpacing: '2px',
                    fontWeight: 700,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Input 2: Username Pilihan Anda */}
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, marginBottom: '0.35rem', color: '#334155' }}>
                Username Pilihan Anda
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
                  placeholder="Buat username baru"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '0.7rem 1rem 0.7rem 2.6rem',
                    borderRadius: '14px',
                    border: '1px solid #cbd5e1',
                    background: isLoading ? '#f8fafc' : '#ffffff',
                    color: '#0f172a',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Input 3: Password Baru */}
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, marginBottom: '0.35rem', color: '#334155' }}>
                Password Baru
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
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '0.7rem 2.6rem 0.7rem 2.6rem',
                    borderRadius: '14px',
                    border: '1px solid #cbd5e1',
                    background: isLoading ? '#f8fafc' : '#ffffff',
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
                  disabled={isLoading}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Input 4: Konfirmasi Password Baru */}
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, marginBottom: '0.35rem', color: '#334155' }}>
                Konfirmasi Password Baru
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
                  placeholder="Ulangi password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '0.7rem 2.6rem 0.7rem 2.6rem',
                    borderRadius: '14px',
                    border: '1px solid #cbd5e1',
                    background: isLoading ? '#f8fafc' : '#ffffff',
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
                  disabled={isLoading}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.85rem 1.25rem',
                marginTop: '0.25rem',
                borderRadius: '14px',
                background: isLoading ? '#93c5fd' : '#2563eb',
                color: '#ffffff',
                fontSize: '0.95rem',
                fontWeight: 800,
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                boxShadow: isLoading ? 'none' : '0 10px 20px -5px rgba(37, 99, 235, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.55rem',
                transition: 'all 0.2s ease',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="spin-icon" />
                  <span>Memverifikasi Kode & Mengaktivasi...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Aktifkan Akun Saya Sekarang</span>
                </>
              )}
            </button>
          </form>

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
              <div style={{ fontSize: '0.785rem', fontWeight: 800, color: '#1e293b' }}>Catatan Aktivasi</div>
              <div style={{ fontSize: '0.735rem', color: '#64748b', lineHeight: 1.4 }}>
                Setelah akun teraktivasi, Anda dapat langsung login dan terhubung secara otomatis dengan jam shift kasir toko.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
