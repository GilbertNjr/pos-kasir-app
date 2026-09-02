import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Upload,
  AlertTriangle,
  RefreshCw,
  Image as ImageIcon,
  Check,
  RotateCcw,
  Trash2,
  Sparkles,
  Key,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { apiService } from '../services/api';
import { THEME_PALETTES, applyGlobalTheme } from '../utils/themeHelper';
import { HelpModal } from '../components/common/HelpModal';
import { ActionLoadingModal } from '../components/common/ActionLoadingModal';


interface SettingsPageProps {
  onTriggerToast?: (type: 'success' | 'danger' | 'info' | 'warning', title: string, message: string) => void;
  onStoreProfileUpdate?: (profile: { name: string; ownerName?: string; logoUrl: string }) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onTriggerToast, onStoreProfileUpdate }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Hidden File Input Ref for Logo Upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper untuk membersihkan nilai placeholder bawaan
  const sanitizeField = (val?: string) => {
    if (!val) return '';
    const trimmed = val.trim();
    if (trimmed.startsWith('Masukan ') || trimmed.startsWith('Masukkan ')) {
      return '';
    }
    return trimmed;
  };

  // Store Profile State
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // Address State
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');

  // Theme & Branding State
  const [selectedThemeColor, setSelectedThemeColor] = useState<string>('dark_slate');
  const [customColorHex, setCustomColorHex] = useState<string>('#2563eb');
  const [sidebarColor, setSidebarColor] = useState<string>('#090d16');
  const [dashboardBgColor, setDashboardBgColor] = useState<string>('#f8fafc');

  // Operating Hours State
  const [isOpHoursEnabled, setIsOpHoursEnabled] = useState<boolean>(true);
  const [openTime, setOpenTime] = useState<string>('07:00');
  const [closeTime, setCloseTime] = useState<string>('22:00');
  const [operatingDays, setOperatingDays] = useState<string[]>(['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']);

  // Store Preferences State (Functional Logic Toggles)
  const [showZeroStock, setShowZeroStock] = useState<boolean>(false);
  const [lowStockAlert, setLowStockAlert] = useState<boolean>(true);
  const [autoPrintReceipt, setAutoPrintReceipt] = useState<boolean>(true);
  const [fastCashierMode, setFastCashierMode] = useState<boolean>(false);
  const [totalRounding, setTotalRounding] = useState<boolean>(false);

  // Restore & Reset Modal State
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [restoreJson, setRestoreJson] = useState('');
  const [restoring, setRestoring] = useState(false);

  // Owner Security & Password Management State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMsg(null);
    setPasswordSuccessMsg(null);

    if (!currentPassword) {
      setPasswordErrorMsg('Password saat ini wajib diisi');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordErrorMsg('Password baru minimal 6 karakter');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('Konfirmasi password baru tidak cocok');
      return;
    }

    try {
      setChangingPassword(true);
      const msg = await apiService.changePassword(currentPassword, newPassword);
      setPasswordSuccessMsg(msg || 'Password Owner berhasil diperbarui!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      window.dispatchEvent(
        new CustomEvent('pos-app-activity', {
          detail: {
            title: 'Keamanan Akun Owner Diperbarui',
            message: 'Password akun Owner telah berhasil diperbarui & tersimpan di database.',
            type: 'security',
          },
        })
      );

      if (onTriggerToast) {
        onTriggerToast('success', 'Password Diperbarui', 'Password akun Owner berhasil diubah secara rahasia & tersimpan di database.');
      }
    } catch (err: any) {
      setPasswordErrorMsg(err.message || 'Gagal memperbarui password');
      if (onTriggerToast) {
        onTriggerToast('danger', 'Gagal Ubah Password', err.message || 'Periksa kembali password saat ini.');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  // Load Settings on Mount
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const s = await apiService.getSettings();
      if (s) {
        // Store Profile
        if (s.store_profile) {
          const sName = sanitizeField(s.store_profile.name);
          const oName = sanitizeField(s.store_profile.owner_name);
          const lUrl = s.store_profile.logo_url || '';

          setStoreName(sName);
          setOwnerName(oName);
          setEmail(sanitizeField(s.store_profile.email));
          setPhone(sanitizeField(s.store_profile.phone));
          setDescription(s.store_profile.description || '');
          setLogoUrl(lUrl);
          setAddress(sanitizeField(s.store_profile.address));
          setDistrict(sanitizeField(s.store_profile.district));
          setCity(sanitizeField(s.store_profile.city));
          setPostalCode(sanitizeField(s.store_profile.postal_code));
          setCountry(sanitizeField(s.store_profile.country));

          if (onStoreProfileUpdate) {
            onStoreProfileUpdate({
              name: sName,
              ownerName: oName,
              logoUrl: lUrl,
            });
          }
        }

        // Theme Settings
        if (s.theme_settings) {
          const themeKey = s.theme_settings.theme_color || 'dark_slate';
          setSelectedThemeColor(themeKey);
          if (s.theme_settings.primary_hex) {
            setCustomColorHex(s.theme_settings.primary_hex);
          }
          const sbBg = s.theme_settings.sidebar_color || '#090d16';
          setSidebarColor(sbBg);
          const dbBg = (s.theme_settings as any).dashboard_bg || localStorage.getItem('pos_app_dashboard_bg') || '#f8fafc';
          setDashboardBgColor(dbBg);
          applyGlobalTheme(themeKey, sbBg, dbBg);
        }

        // Operating Hours
        if (s.operating_hours) {
          setIsOpHoursEnabled(s.operating_hours.is_enabled ?? true);
          setOpenTime(s.operating_hours.open_time || '07:00');
          setCloseTime(s.operating_hours.close_time || '22:00');
          if (Array.isArray(s.operating_hours.operating_days)) {
            setOperatingDays(s.operating_hours.operating_days);
          }
        }

        // Store Preferences
        if (s.store_preferences) {
          setShowZeroStock(!!s.store_preferences.show_zero_stock);
          setLowStockAlert(!!s.store_preferences.low_stock_alert);
          setAutoPrintReceipt(!!s.store_preferences.auto_print_receipt);
          setFastCashierMode(!!s.store_preferences.fast_cashier_mode);
          setTotalRounding(!!s.store_preferences.total_rounding);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat pengaturan sistem');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Image File Upload (Direct File Picker + Auto Compression & Error Toasting)
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so re-selecting the same file works
    e.target.value = '';

    // 1. Format validation
    if (!file.type.startsWith('image/')) {
      if (onTriggerToast) {
        onTriggerToast('danger', 'Gagal Unggah Gambar', 'Format file tidak didukung. Harap pilih file gambar (PNG, JPG, JPEG, WEBP, SVG).');
      }
      return;
    }

    // 2. File size validation
    if (file.size > 10 * 1024 * 1024) {
      if (onTriggerToast) {
        onTriggerToast('danger', 'Ukuran File Terlalu Besar', 'Ukuran file gambar melebihi 10MB. Harap pilih file yang lebih kecil.');
      }
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => {
      if (onTriggerToast) {
        onTriggerToast('danger', 'Gagal Membaca File', 'Terjadi kesalahan saat membaca file dari perangkat Anda.');
      }
    };

    reader.onload = (event) => {
      const rawBase64 = event.target?.result as string;

      // Auto compress image via Canvas to max 250px dimension and JPEG format for ultra-small size (~20KB)
      const img = new Image();

      img.onerror = () => {
        if (onTriggerToast) {
          onTriggerToast('danger', 'Gambar Tidak Dapat Diproses', 'File gambar yang dipilih rusak atau formatnya tidak valid.');
        }
      };

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 250;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
            setLogoUrl(compressedBase64);
            if (onStoreProfileUpdate) {
              onStoreProfileUpdate({
                name: storeName,
                ownerName,
                logoUrl: compressedBase64,
              });
            }
            if (onTriggerToast) {
              onTriggerToast('success', 'Logo Diperbarui', 'Gambar logo toko berhasil dikompresi & dimuat.');
            }
          } else {
            setLogoUrl(rawBase64);
            if (onStoreProfileUpdate) {
              onStoreProfileUpdate({ name: storeName, ownerName, logoUrl: rawBase64 });
            }
            if (onTriggerToast) {
              onTriggerToast('success', 'Logo Diperbarui', 'Gambar logo toko berhasil dimuat.');
            }
          }
        } catch (err: any) {
          if (onTriggerToast) {
            onTriggerToast('danger', 'Gagal Mengompres Gambar', err.message || 'Terjadi kesalahan saat memproses gambar.');
          }
        }
      };

      img.src = rawBase64;
    };

    reader.readAsDataURL(file);
  };

  // Theme Palette Select Handler (Real-time change preview)
  const handleSelectThemeColor = (colorKey: string) => {
    setSelectedThemeColor(colorKey);
    const pal = THEME_PALETTES[colorKey];
    if (pal) {
      setCustomColorHex(pal.primaryHex);
      setSidebarColor(pal.sidebarBg);
      setDashboardBgColor(pal.dashboardBg);
      applyGlobalTheme(colorKey, pal.sidebarBg, pal.dashboardBg);
    } else {
      applyGlobalTheme(colorKey, sidebarColor, dashboardBgColor);
    }
  };

  // Custom Color Hex Change Handler
  const handleCustomColorChange = (hex: string) => {
    setCustomColorHex(hex);
    setSelectedThemeColor(hex);
    applyGlobalTheme(hex, sidebarColor, dashboardBgColor);
  };

  // Sidebar Color Select Handler
  const handleSidebarColorChange = (sbColor: string) => {
    setSidebarColor(sbColor);
    applyGlobalTheme(selectedThemeColor, sbColor, dashboardBgColor);
  };

  // Dashboard Background Color Select Handler
  const handleDashboardBgChange = (dbColor: string) => {
    setDashboardBgColor(dbColor);
    applyGlobalTheme(selectedThemeColor, sidebarColor, dbColor);
  };

  // Save Settings Handler (Persists to backend & broadcasts SSE to all users)
  const handleSaveAllSettings = async (sectionName = 'Pengaturan') => {
    try {
      setSaving(true);
      setError(null);

      const activePalette = THEME_PALETTES[selectedThemeColor];
      const primaryHex = activePalette ? activePalette.primaryHex : customColorHex;

      const payload = {
        store_profile: {
          name: storeName,
          owner_name: ownerName,
          email,
          phone,
          description,
          logo_url: logoUrl,
          address,
          district,
          city,
          postal_code: postalCode,
          country,
        },
        theme_settings: {
          theme_color: selectedThemeColor,
          sidebar_color: sidebarColor,
          primary_hex: primaryHex,
          dashboard_bg: dashboardBgColor,
        },
        operating_hours: {
          is_enabled: isOpHoursEnabled,
          open_time: openTime,
          close_time: closeTime,
          operating_days: operatingDays,
        },
        store_preferences: {
          show_zero_stock: showZeroStock,
          low_stock_alert: lowStockAlert,
          auto_print_receipt: autoPrintReceipt,
          fast_cashier_mode: fastCashierMode,
          total_rounding: totalRounding,
        },
      };

      await apiService.updateSettings(payload);
      applyGlobalTheme(selectedThemeColor, sidebarColor, dashboardBgColor);

      const profileData = { name: storeName, ownerName, logoUrl, address, phone, email };
      try {
        localStorage.setItem('pos_store_profile', JSON.stringify(profileData));
      } catch {}

      if (onStoreProfileUpdate) {
        onStoreProfileUpdate(profileData);
      }

      window.dispatchEvent(
        new CustomEvent('pos-app-activity', {
          detail: {
            title: `Pengaturan ${sectionName} Diperbarui`,
            message: `Perubahan ${sectionName} berhasil disimpan & disinkronkan ke seluruh sistem.`,
            type: 'system',
          },
        })
      );

      if (onTriggerToast) {
        onTriggerToast('success', `${sectionName} Berhasil Disimpan`, 'Perubahan telah disimpan & disinkronkan ke seluruh sistem secara real-time.');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan perubahan pengaturan.');
      if (onTriggerToast) {
        onTriggerToast('danger', 'Gagal Menyimpan', err.message || 'Terjadi kesalahan sistem.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Backup Trigger
  const handleBackupNow = async () => {
    try {
      setSaving(true);
      const snapshot = await apiService.exportBackup();

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(snapshot, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `pos_backup_${snapshot.backup_id}_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      if (onTriggerToast) {
        onTriggerToast('success', 'Backup Berhasil', `Snapshot database ${snapshot.backup_id} berhasil diunduh.`);
      }
    } catch (err: any) {
      if (onTriggerToast) {
        onTriggerToast('danger', 'Backup Gagal', err.message || 'Gagal membuat file backup snapshot.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Restore Submit Handler
  const handleRestoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreJson.trim()) return;

    try {
      setRestoring(true);
      const parsed = JSON.parse(restoreJson);
      const res = await apiService.restoreBackup(parsed);

      setShowRestoreModal(false);
      setRestoreJson('');

      if (onTriggerToast) {
        onTriggerToast(
          'success',
          'Pemulihan Berhasil',
          `Restored ${res.restored_counts.products} produk & ${res.restored_counts.stocks} stok.`
        );
      }
      loadData();
    } catch (err: any) {
      alert(`Gagal merestore backup: ${err.message}`);
    } finally {
      setRestoring(false);
    }
  };

  // Reset to Defaults
  const handleResetDefaults = () => {
    setShowResetModal(true);
  };

  const executeResetDefaults = () => {
    setSelectedThemeColor('dark_slate');
    setSidebarColor('#090d16');
    setStoreName('');
    setOwnerName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setDistrict('');
    setCity('');
    setPostalCode('');
    setCountry('');
    setIsOpHoursEnabled(true);
    setOpenTime('07:00');
    setCloseTime('22:00');
    applyGlobalTheme('dark_slate', '#090d16', '#f8fafc');
    handleSaveAllSettings('Reset Pengaturan');
    if (onTriggerToast) {
      onTriggerToast('warning', 'Pengaturan Direset', 'Preferensi toko berhasil dikembalikan ke default.');
    }
  };

  // Clear Cache
  const handleClearCache = () => {
    localStorage.clear();
    sessionStorage.clear();
    applyGlobalTheme(selectedThemeColor, sidebarColor, dashboardBgColor);
    if (onTriggerToast) {
      onTriggerToast('info', 'Cache Dibersihkan', 'Penyimpanan lokal browser telah disegarkan.');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
        <RefreshCw size={32} className="spinning" style={{ marginBottom: '0.75rem' }} />
        <div style={{ fontWeight: 700, fontSize: '1rem' }}>Memuat Pengaturan Sistem Toko...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1400px', margin: '0 auto', paddingBottom: '3.5rem' }}>
      
      {/* Hidden File Input for Logo Selection */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleImageFileUpload}
        style={{ display: 'none' }}
      />

      {/* 1. TOP HEADER & BREADCRUMBS BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
            <span>Dashboard</span> &rsaquo; <span style={{ color: 'var(--color-primary)', fontWeight: 800 }}>Pengaturan</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            Pengaturan Toko
          </h1>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.85rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', color: '#991b1b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
          {(error.toLowerCase().includes('otentikasi') || error.toLowerCase().includes('kadaluwarsa') || error.toLowerCase().includes('sesi')) && (
            <button
              type="button"
              onClick={() => {
                apiService.clearAuth();
                window.location.href = '/';
              }}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                background: '#dc2626',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.78rem',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)',
              }}
            >
              Login Ulang Sekarang
            </button>
          )}
        </div>
      )}

      {/* 2. MAIN CONTENT GRID (2 COLUMNS LAYOUT MATCHING IMAGE 2) */}
      <div className="responsive-main-grid">
        
        {/* LEFT COLUMN: Informasi Toko, Logo & Branding, Preferensi Toko, Alamat & Kontak */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* TOP 2-CARD ROW: Informasi Toko + Alamat & Kontak */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {/* SECTION 1: Informasi Toko */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1.25rem 0' }}>Informasi Toko</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Nama Toko</label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStoreName(val);
                        if (onStoreProfileUpdate) {
                          onStoreProfileUpdate({ name: val, ownerName, logoUrl });
                        }
                      }}
                      placeholder="Masukkan Nama Toko Anda"
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', color: '#0f172a', fontWeight: 700 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Nama Pemilik</label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setOwnerName(val);
                        if (onStoreProfileUpdate) {
                          onStoreProfileUpdate({ name: storeName, ownerName: val, logoUrl });
                        }
                      }}
                      placeholder="Masukan Nama Anda"
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', color: '#0f172a' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Email Toko</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Masukan Email Anda"
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', color: '#0f172a' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>No. Telepon</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Masukan Nomor Telepon Anda"
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', color: '#0f172a' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Deskripsi Toko (Opsional)</label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Toko sembako dan kebutuhan sehari-hari."
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#0f172a', resize: 'vertical' }}
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSaveAllSettings('Informasi Toko')}
                disabled={saving}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--primary-gradient)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  alignSelf: 'flex-start',
                }}
              >
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>

            {/* SECTION 2: Alamat & Kontak Toko */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1.25rem 0' }}>Alamat & Kontak Toko</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Alamat Lengkap Toko</label>
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Masukan Alamat Anda"
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#0f172a', resize: 'vertical' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Kecamatan</label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="Masukan Kecamatan Anda"
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#0f172a' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Kota / Kabupaten</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Masukan Kota Anda"
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#0f172a' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Kode Pos</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="Masukan Kode Pos Anda"
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#0f172a' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Negara</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Masukan Negara Anda"
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#0f172a' }}
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSaveAllSettings('Alamat & Kontak')}
                disabled={saving}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--primary-gradient)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  alignSelf: 'flex-start',
                }}
              >
                {saving ? 'Menyimpan...' : 'Simpan Alamat'}
              </button>
            </div>
          </div>

          {/* SECTION 2: Logo & Branding + Direct File Picker + Rich Palette Picker */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1.25rem 0' }}>Logo & Branding</h3>

            {/* Direct File Picker Clickable Container */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                title="Klik untuk memilih file logo toko dari komputer"
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '16px',
                  border: '2px dashed var(--color-primary, #cbd5e1)',
                  background: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                {logoUrl ? (
                  <img src={logoUrl} alt="Store Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : (
                  <div style={{ textAlign: 'center', padding: '0.5rem', color: '#94a3b8' }}>
                    <ImageIcon size={28} />
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, marginTop: '0.2rem' }}>Pilih File</div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>Logo Toko (Upload File Langsung)</div>
                <div style={{ fontSize: '0.725rem', color: '#64748b' }}>Klik ikon atau tombol di bawah untuk memilih file gambar dari komputer Anda.</div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: 'var(--color-primary)',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    Ubah Logo
                  </button>

                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setLogoUrl('');
                        if (onStoreProfileUpdate) {
                          onStoreProfileUpdate({ name: storeName, ownerName, logoUrl: '' });
                        }
                      }}
                      style={{
                        padding: '0.45rem 0.85rem',
                        borderRadius: '8px',
                        border: '1px solid #fecaca',
                        background: '#fef2f2',
                        color: '#dc2626',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <Trash2 size={14} /> Hapus
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* DYNAMIC COLOR PALETTE & CUSTOM COLOR PICKERS */}
            <div style={{ marginBottom: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={16} color="var(--color-primary)" />
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Warna Tema Utama (Buttons, Accents & Highlight)</label>
                </div>
                
                {/* HTML Color Picker Input for Primary Custom Color */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Pilih Kustom Hex:</span>
                  <input
                    type="color"
                    value={customColorHex.startsWith('#') ? customColorHex : '#2563eb'}
                    onChange={(e) => handleCustomColorChange(e.target.value)}
                    title="Pilih warna kustom utama secara bebas"
                    style={{ width: '34px', height: '34px', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', background: 'none', padding: '2px' }}
                  />
                </div>
              </div>

              {/* Color Circles Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.75rem 0', flexWrap: 'wrap' }}>
                {Object.values(THEME_PALETTES).map((pal) => {
                  const isSelected = selectedThemeColor === pal.id;
                  return (
                    <button
                      key={pal.id}
                      type="button"
                      onClick={() => handleSelectThemeColor(pal.id)}
                      title={`${pal.name} (${pal.primaryHex})`}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: pal.primaryHex,
                        border: isSelected ? '3px solid #ffffff' : 'none',
                        boxShadow: isSelected ? `0 0 0 3px ${pal.primaryHex}` : '0 2px 6px rgba(0,0,0,0.15)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.15s ease',
                        transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                      }}
                    >
                      {isSelected && <Check size={16} color="#ffffff" strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '1.25rem' }}>
                Warna Terpilih: {THEME_PALETTES[selectedThemeColor]?.name || customColorHex}
              </div>

              {/* Custom Sidebar Background Color */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Latar Belakang Left Sidebar Navigasi Kiri</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Color Picker:</span>
                    <input
                      type="color"
                      value={sidebarColor.startsWith('#') ? sidebarColor : '#1c140e'}
                      onChange={(e) => handleSidebarColorChange(e.target.value)}
                      title="Pilih warna latar belakang sidebar kustom"
                      style={{ width: '28px', height: '28px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', background: 'none', padding: '1px' }}
                    />
                  </div>
                </div>
                <select
                  value={sidebarColor}
                  onChange={(e) => handleSidebarColorChange(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#0f172a', background: '#ffffff', fontWeight: 700 }}
                >
                  <option value="#1c140e">Coklat Mocha Dark (#1c140e)</option>
                  <option value="#0f172a">Midnight Slate (#0f172a)</option>
                  <option value="#064e3b">Deep Forest (#064e3b)</option>
                  <option value="#2e1065">Deep Purple (#2e1065)</option>
                  <option value="#451a03">Warm Amber Dark (#451a03)</option>
                  <option value="#09090b">Pitch Black Charcoal (#09090b)</option>
                  {!['#1c140e', '#0f172a', '#064e3b', '#2e1065', '#451a03', '#09090b'].includes(sidebarColor) && (
                    <option value={sidebarColor}>Warna Kustom ({sidebarColor})</option>
                  )}
                </select>
              </div>

              {/* Custom Dashboard Layout Background Color */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Latar Belakang Layout Halaman & Dashboard</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Color Picker:</span>
                    <input
                      type="color"
                      value={dashboardBgColor.startsWith('#') ? dashboardBgColor : '#f8fafc'}
                      onChange={(e) => handleDashboardBgChange(e.target.value)}
                      title="Pilih warna latar belakang dashboard kustom"
                      style={{ width: '28px', height: '28px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', background: 'none', padding: '1px' }}
                    />
                  </div>
                </div>
                <select
                  value={dashboardBgColor}
                  onChange={(e) => handleDashboardBgChange(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#0f172a', background: '#ffffff', fontWeight: 700 }}
                >
                  <option value="#f8fafc">Light Gray Standard (#f8fafc)</option>
                  <option value="#fcf8f6">Warm Soft Tint (#fcf8f6)</option>
                  <option value="#f4fbf7">Fresh Emerald Tint (#f4fbf7)</option>
                  <option value="#faf5ff">Soft Lavender Purple (#faf5ff)</option>
                  <option value="#fffbeb">Warm Amber Tint (#fffbeb)</option>
                  <option value="#ffffff">Pure Clean White (#ffffff)</option>
                  <option value="#0f172a">Dark Executive Slate (#0f172a)</option>
                  {!['#f8fafc', '#fcf8f6', '#f4fbf7', '#faf5ff', '#fffbeb', '#ffffff', '#0f172a'].includes(dashboardBgColor) && (
                    <option value={dashboardBgColor}>Warna Kustom ({dashboardBgColor})</option>
                  )}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSaveAllSettings('Logo & Branding')}
              disabled={saving}
              style={{
                padding: '0.55rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--primary-gradient)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.825rem',
                cursor: 'pointer',
              }}
            >
              Simpan Branding & Tema
            </button>
          </div>

          {/* SECTION 3: Preferensi Toko (Toggles Berfungsi Real-Time dengan Logika Nyata) */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1.25rem 0' }}>Preferensi Toko (Aktif & Berfungsi)</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', marginBottom: '1.25rem' }}>
              {/* Toggle 1: Tampilkan Stok Nol */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Tampilkan Stok Nol</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Jika mati, produk dengan stok 0 disembunyikan otomatis dari katalog kasir</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowZeroStock(!showZeroStock)}
                  style={{
                    width: '46px',
                    height: '24px',
                    borderRadius: '12px',
                    background: showZeroStock ? 'var(--color-primary)' : '#cbd5e1',
                    border: 'none',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                  }}
                >
                  <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: showZeroStock ? '25px' : '3px', transition: 'left 0.2s ease' }} />
                </button>
              </div>


              {/* Toggle 3: Nota Otomatis */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Nota Otomatis</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Secara otomatis mencetak / menampilkan nota setelah checkout transaksi</div>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoPrintReceipt(!autoPrintReceipt)}
                  style={{
                    width: '46px',
                    height: '24px',
                    borderRadius: '12px',
                    background: autoPrintReceipt ? 'var(--color-primary)' : '#cbd5e1',
                    border: 'none',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                  }}
                >
                  <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: autoPrintReceipt ? '25px' : '3px', transition: 'left 0.2s ease' }} />
                </button>
              </div>

              {/* Toggle 4: Mode Kasir Cepat */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Mode Kasir Cepat</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Proses checkout 1-klik tanpa dialog konfirmasi tambahan</div>
                </div>
                <button
                  type="button"
                  onClick={() => setFastCashierMode(!fastCashierMode)}
                  style={{
                    width: '46px',
                    height: '24px',
                    borderRadius: '12px',
                    background: fastCashierMode ? 'var(--color-primary)' : '#cbd5e1',
                    border: 'none',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                  }}
                >
                  <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: fastCashierMode ? '25px' : '3px', transition: 'left 0.2s ease' }} />
                </button>
              </div>

              {/* Toggle 5: Pembulatan Total */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Pembulatan Total</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Membulatkan total tagihan transaksi ke kelipatan Rp 100 terdekat</div>
                </div>
                <button
                  type="button"
                  onClick={() => setTotalRounding(!totalRounding)}
                  style={{
                    width: '46px',
                    height: '24px',
                    borderRadius: '12px',
                    background: totalRounding ? 'var(--color-primary)' : '#cbd5e1',
                    border: 'none',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                  }}
                >
                  <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: totalRounding ? '25px' : '3px', transition: 'left 0.2s ease' }} />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSaveAllSettings('Preferensi Toko')}
              disabled={saving}
              style={{
                padding: '0.55rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--primary-gradient)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.825rem',
                cursor: 'pointer',
              }}
            >
              Simpan Preferensi
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: Jam Operasional, Ringkasan Pengaturan, Aksi Cepat */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* SECTION 5: Jam Operasional */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Jam Operasional</h3>
              <button
                type="button"
                onClick={() => setIsOpHoursEnabled(!isOpHoursEnabled)}
                style={{
                  width: '44px',
                  height: '24px',
                  borderRadius: '12px',
                  background: isOpHoursEnabled ? 'var(--color-primary)' : '#cbd5e1',
                  border: 'none',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
              >
                <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: isOpHoursEnabled ? '23px' : '3px', transition: 'left 0.2s ease' }} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.3rem' }}>Buka</label>
                <input
                  type="text"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', textAlign: 'center' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.3rem' }}>Tutup</label>
                <input
                  type="text"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', textAlign: 'center' }}
                />
              </div>
            </div>

            {/* Day Chips */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.4rem' }}>Hari Operasional</label>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day) => {
                  const isSelected = operatingDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        if (isSelected) setOperatingDays(operatingDays.filter((d) => d !== day));
                        else setOperatingDays([...operatingDays, day]);
                      }}
                      style={{
                        padding: '0.3rem 0.6rem',
                        borderRadius: '6px',
                        border: 'none',
                        background: isSelected ? 'var(--color-primary)' : '#f1f5f9',
                        color: isSelected ? '#ffffff' : '#64748b',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSaveAllSettings('Jam Operasional')}
              disabled={saving}
              style={{
                width: '100%',
                padding: '0.55rem',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--primary-gradient)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.825rem',
                cursor: 'pointer',
              }}
            >
              Simpan Jam Operasional
            </button>
          </div>

          {/* SECTION: Keamanan Akun & Ganti Password Owner */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <ShieldCheck size={20} color="var(--color-primary)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Keamanan & Akun Owner</h3>
            </div>

            {passwordSuccessMsg && (
              <div style={{ padding: '0.75rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', color: '#166534', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <CheckCircle2 size={16} color="#16a34a" />
                <span>{passwordSuccessMsg}</span>
              </div>
            )}

            {passwordErrorMsg && (
              <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#991b1b', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <AlertTriangle size={16} color="#dc2626" />
                <span>{passwordErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>Password Saat Ini</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Masukkan password lama"
                    style={{ width: '100%', padding: '0.55rem 2.2rem 0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.825rem', color: '#0f172a' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}
                  >
                    {showCurrentPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>Password Baru (Min. 6 Karakter)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan password baru"
                    style={{ width: '100%', padding: '0.55rem 2.2rem 0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.825rem', color: '#0f172a' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}
                  >
                    {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>Konfirmasi Password Baru</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                    style={{ width: '100%', padding: '0.55rem 2.2rem 0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.825rem', color: '#0f172a' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}
                  >
                    {showConfirmPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={changingPassword}
                style={{
                  width: '100%',
                  padding: '0.55rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--primary-gradient)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                <Key size={15} />
                <span>{changingPassword ? 'Memperbarui Password...' : 'Ubah Password Rahasia'}</span>
              </button>
            </form>

          </div>

          {/* SECTION 6: Ringkasan Pengaturan */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem 0' }}>Ringkasan Pengaturan</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #f1f5f9', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748b' }}>Nama Toko</span>
                <strong style={{ color: 'var(--color-primary)', fontWeight: 800 }}>{storeName}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #f1f5f9', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748b' }}>Email</span>
                <strong style={{ color: '#0f172a' }}>{email}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #f1f5f9', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748b' }}>No. Telepon</span>
                <strong style={{ color: '#0f172a' }}>{phone}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #f1f5f9', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748b' }}>Jam Operasional</span>
                <strong style={{ color: '#0f172a' }}>{openTime} - {closeTime}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #f1f5f9', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748b' }}>Zona Waktu</span>
                <strong style={{ color: '#0f172a' }}>Asia/Jakarta (WIB)</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Mata Uang</span>
                <strong style={{ color: '#0f172a' }}>Rupiah (IDR)</strong>
              </div>
            </div>
          </div>

          {/* SECTION 7: Aksi Cepat */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem 0' }}>Aksi Cepat</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={handleBackupNow}
                style={{
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  color: '#0f172a',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-primary)' }}>
                  <Download size={16} /> <span>Backup Data</span>
                </div>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 500 }}>Buat backup sekarang</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRestoreModal(true)}
                style={{
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  color: '#0f172a',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#10b981' }}>
                  <Upload size={16} /> <span>Restore Data</span>
                </div>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 500 }}>Pulihkan data backup</span>
              </button>

              <button
                type="button"
                onClick={handleResetDefaults}
                style={{
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  color: '#0f172a',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#d97706' }}>
                  <RotateCcw size={16} /> <span>Reset Pengaturan</span>
                </div>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 500 }}>Kembalikan ke default</span>
              </button>

              <button
                type="button"
                onClick={handleClearCache}
                style={{
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  color: '#0f172a',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#7c3aed' }}>
                  <RefreshCw size={16} /> <span>Bersihkan Cache</span>
                </div>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 500 }}>Optimalkan performa</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* RESTORE DATA MODAL */}
      {showRestoreModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.5rem', maxWidth: '500px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>Pemulihan Snapshot Database</h3>
            <p style={{ fontSize: '0.825rem', color: '#64748b', marginBottom: '1rem' }}>
              Tempelkan isi format file JSON backup snapshot Anda di bawah ini untuk merestore data:
            </p>

            <form onSubmit={handleRestoreSubmit}>
              <textarea
                rows={5}
                placeholder="Tempel teks JSON di sini..."
                value={restoreJson}
                onChange={(e) => setRestoreJson(e.target.value)}
                required
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontFamily: 'monospace', marginBottom: '1.25rem' }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowRestoreModal(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={restoring}
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  {restoring ? 'Memulihkan...' : 'Jalankan Restore'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET DEFAULT WARNING & CONSEQUENCES MODAL */}
      {showResetModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', maxWidth: '540px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', animation: 'modalSlide 0.2s ease' }}>
            
            {/* MODAL HEADER */}
            <div style={{ padding: '1.25rem 1.5rem', background: '#fffbeb', borderBottom: '1px solid #fef3c7', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.55rem', borderRadius: '12px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#92400e', margin: 0 }}>
                  Peringatan & Konsekuensi Reset Pengaturan
                </h3>
                <p style={{ fontSize: '0.775rem', color: '#b45309', margin: '0.15rem 0 0 0' }}>
                  Harap baca konsekuensi di bawah sebelum mengembalikan preferensi sistem ke default.
                </p>
              </div>
            </div>

            {/* MODAL BODY */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>
                Aksi ini akan mereset seluruh konfigurasi preferensi toko kembali ke <strong>Pengaturan Default Pabrik</strong>.
              </div>

              {/* CONSEQUENCES CHECKLIST BOX */}
              <div style={{ background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Rincian Perubahan Yang Akan Terjadi:
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.825rem', color: '#dc2626' }}>
                  <span style={{ fontWeight: 800 }}>•</span>
                  <span><strong>Warna Tema & Layout:</strong> Kembali ke tema dasar Mocha Brown & Dark Sidebar.</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.825rem', color: '#dc2626' }}>
                  <span style={{ fontWeight: 800 }}>•</span>
                  <span><strong>Identitas Toko:</strong> Nama toko, email, no telepon, dan deskripsi di-set ke konfigurasi awal.</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.825rem', color: '#dc2626' }}>
                  <span style={{ fontWeight: 800 }}>•</span>
                  <span><strong>Preferensi Kasir:</strong> Mode kasir cepat, pembulatan harga, dan filter stok di-reset ke nilai bawaan.</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.825rem', color: '#dc2626' }}>
                  <span style={{ fontWeight: 800 }}>•</span>
                  <span><strong>Jam Operasional:</strong> Kembali ke jadwal standar pabrik (07:00 - 22:00).</span>
                </div>

                <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '0.65rem', marginTop: '0.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.825rem', color: '#059669' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>✓</span>
                  <span><strong>DATA UTAMA AMAN:</strong> Data Transaksi Penjualan, Stok Barang, Katalog Produk, dan Akun Pengguna <strong>TIDAK AKAN DIHAPUS</strong>.</span>
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                style={{ padding: '0.6rem 1.25rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetModal(false);
                  executeResetDefaults();
                }}
                style={{ padding: '0.6rem 1.25rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', color: '#ffffff', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)' }}
              >
                <RotateCcw size={16} /> Ya, Reset Pengaturan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Center Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <ActionLoadingModal
        isOpen={saving || restoring}
        message={saving ? 'Menyimpan preferensi & konfigurasi toko ke backend...' : 'Memproses restore database ke server...'}
        submessage="Mencegah konflik data & memperbarui tampilan..."
      />
    </div>
  );
};
