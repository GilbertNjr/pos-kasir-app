import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  ShoppingBag,
  DollarSign,
  UserCheck,
  RefreshCw,
  CheckCheck,
  X,
  Sparkles,
  ShieldCheck,
  Package,
  Trash2,
} from 'lucide-react';
import { apiService } from '../../services/api';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'transaction' | 'stock' | 'expense' | 'user' | 'system' | 'security';
  timestamp: Date;
  read: boolean;
}

export const NotificationPopover: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'unread'>('all');
  const [refreshToastMsg, setRefreshToastMsg] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Auto close popover on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch real-time notification data from Audit Logs and Stock Alerts
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const items: NotificationItem[] = [];

      // 1. Fetch Audit Logs from Backend
      try {
        const logs = await apiService.getAuditLogs();
        if (logs && Array.isArray(logs)) {
          logs.slice(0, 15).forEach((log: any, idx: number) => {
            let type: NotificationItem['type'] = 'system';
            let title = 'Aktivitas Sistem';

            const actionStr = (log.action || '').toUpperCase();
            if (actionStr.includes('TRANSACTION') || actionStr.includes('POS')) {
              type = 'transaction';
              title = 'Transaksi Penjualan Baru';
            } else if (actionStr.includes('EXPENSE')) {
              type = 'expense';
              title = 'Pengeluaran Operasional';
            } else if (actionStr.includes('PASSWORD') || actionStr.includes('PIN') || actionStr.includes('SECURITY')) {
              type = 'security';
              title = 'Keamanan & Akun';
            } else if (actionStr.includes('USER') || actionStr.includes('LOGIN')) {
              type = 'user';
              title = 'Aktivitas Pengguna';
            } else if (actionStr.includes('STOCK') || actionStr.includes('PRODUCT')) {
              type = 'stock';
              title = 'Update Stok & Produk';
            } else if (actionStr.includes('SETTING') || actionStr.includes('BRANDING')) {
              type = 'system';
              title = 'Pengaturan Toko & Branding';
            }

            items.push({
              id: `log-${log.log_id || idx}`,
              title,
              message: log.details || `${log.action} oleh ${log.user_name || 'Pengguna'}`,
              type,
              timestamp: new Date(log.created_at || Date.now()),
              read: false,
            });
          });
        }
      } catch {
        // Audit log fallback
      }

      // 2. Fetch Low Stock Warnings
      try {
        const stocks = await apiService.getStocks();
        if (stocks && Array.isArray(stocks)) {
          stocks
            .filter((s: any) => s.current_stock !== undefined && s.current_stock <= 5)
            .forEach((s: any) => {
              items.unshift({
                id: `stock-${s.product_id}`,
                title: 'Peringatan Stok Menipis!',
                message: `Stok produk "${s.product_name || s.name || 'Barang'}" tersisa ${s.current_stock} unit. Segera isi ulang stok.`,
                type: 'stock',
                timestamp: new Date(),
                read: false,
              });
            });
        }
      } catch {
        // Stock fallback
      }

      // Default system status if no logs exist
      if (items.length === 0) {
        items.push({
          id: 'sys-init',
          title: 'Sistem POS Beroperasi Normal',
          message: 'Seluruh data transaksi, pengeluaran, dan pengaturan tersinkronisasi secara real-time.',
          type: 'system',
          timestamp: new Date(),
          read: false,
        });
      }

      setNotifications((prev) => {
        // Retain local read status for existing notification IDs
        const readMap = new Map(prev.map((n) => [n.id, n.read]));
        return items.map((n) => ({
          ...n,
          read: readMap.has(n.id) ? readMap.get(n.id)! : n.read,
        }));
      });
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  // Real-time Event Listener (SSE stream & Custom Local Events)
  useEffect(() => {
    fetchNotifications();

    // 1. Setup SSE stream for realtime backend notifications across devices
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/events');
      const handleRealtimeSignal = () => {
        fetchNotifications();
      };

      es.addEventListener('TRANSACTION_CREATED', handleRealtimeSignal);
      es.addEventListener('EXPENSE_CREATED', handleRealtimeSignal);
      es.addEventListener('SHIFT_OPENED', handleRealtimeSignal);
      es.addEventListener('SHIFT_CLOSED', handleRealtimeSignal);
      es.addEventListener('PRODUCT_UPDATED', handleRealtimeSignal);
      es.addEventListener('SETTINGS_UPDATED', handleRealtimeSignal);
      es.addEventListener('SECURITY_UPDATED', handleRealtimeSignal);
      es.addEventListener('AUDIT_LOG_CREATED', handleRealtimeSignal);
    } catch {
      // SSE fallback to polling
    }

    // 2. Setup Local App Activity Listener (Instant feedback when filling forms / saving settings)
    const handleLocalActivity = (e: any) => {
      const detail = e.detail;
      if (detail) {
        const newItem: NotificationItem = {
          id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          title: detail.title || 'Pengisian Data Diperbarui',
          message: detail.message || 'Perubahan data sistem telah dicatat.',
          type: detail.type || 'system',
          timestamp: new Date(),
          read: false,
        };
        setNotifications((prev) => [newItem, ...prev.slice(0, 19)]);
      } else {
        fetchNotifications();
      }
    };

    window.addEventListener('pos-app-activity', handleLocalActivity as EventListener);
    window.addEventListener('pos-global-refresh', fetchNotifications as EventListener);

    // Polling fallback every 15s
    const pollInterval = setInterval(fetchNotifications, 15000);

    return () => {
      clearInterval(pollInterval);
      if (es) es.close();
      window.removeEventListener('pos-app-activity', handleLocalActivity as EventListener);
      window.removeEventListener('pos-global-refresh', fetchNotifications as EventListener);
    };
  }, []);

  // System & Notification Manual Refresh Handler
  const handleRefreshSystem = async () => {
    try {
      setIsRefreshing(true);
      await fetchNotifications();
      // Dispatch global refresh so active pages reload state
      window.dispatchEvent(new CustomEvent('pos-global-refresh'));
      setRefreshToastMsg('Sistem & Notifikasi Berhasil Disegarkan!');
      setTimeout(() => setRefreshToastMsg(null), 3000);
    } catch {
      setRefreshToastMsg('Gagal menyegarkan sistem.');
      setTimeout(() => setRefreshToastMsg(null), 3000);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const getRelativeTime = (date: Date) => {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} mnt lalu`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} jam lalu`;
    return `${Math.floor(diffHours / 24)} hr lalu`;
  };

  const renderIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'transaction':
        return <ShoppingBag size={16} color="#059669" />;
      case 'stock':
        return <Package size={16} color="#d97706" />;
      case 'expense':
        return <DollarSign size={16} color="#dc2626" />;
      case 'security':
        return <ShieldCheck size={16} color="#2563eb" />;
      case 'user':
        return <UserCheck size={16} color="#7c3aed" />;
      default:
        return <Sparkles size={16} color="var(--color-primary)" />;
    }
  };

  const renderBgColor = (type: NotificationItem['type']) => {
    switch (type) {
      case 'transaction':
        return '#ecfdf5';
      case 'stock':
        return '#fffbeb';
      case 'expense':
        return '#fef2f2';
      case 'security':
        return '#eff6ff';
      case 'user':
        return '#faf5ff';
      default:
        return '#f8fafc';
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filterType === 'unread') return !n.read;
    return true;
  });

  return (
    <div style={{ position: 'relative' }} ref={popoverRef}>
      {/* Bell Button Icon with Red Badge Dot */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Notifikasi Realtime & Aktivitas Sistem"
        style={{
          position: 'relative',
          background: isOpen ? '#e2e8f0' : '#f1f5f9',
          border: 'none',
          borderRadius: '50%',
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: unreadCount > 0 ? '#0f172a' : '#64748b',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '1px',
              right: '1px',
              minWidth: '16px',
              height: '16px',
              borderRadius: '10px',
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '0.65rem',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
              border: '2px solid #ffffff',
              animation: 'pulse 2s infinite',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '48px',
            right: 0,
            width: '380px',
            maxHeight: '520px',
            background: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.18)',
            border: '1px solid #e2e8f0',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '0.9rem 1.25rem',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h4 style={{ fontSize: '0.925rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Notifikasi System & Log
              </h4>
              {unreadCount > 0 && (
                <span
                  style={{
                    padding: '0.15rem 0.5rem',
                    borderRadius: '12px',
                    background: '#fef2f2',
                    color: '#dc2626',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                  }}
                >
                  {unreadCount} baru
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {/* Refresh System Button */}
              <button
                onClick={handleRefreshSystem}
                disabled={isRefreshing}
                title="Segarkan Data Notifikasi & Sistem"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  cursor: 'pointer',
                  padding: '0.3rem',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '6px',
                }}
              >
                <RefreshCw size={15} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.2rem' }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Toast Notification Banner inside Popover */}
          {refreshToastMsg && (
            <div
              style={{
                background: '#ecfdf5',
                color: '#047857',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.4rem 1rem',
                textAlign: 'center',
                borderBottom: '1px solid #a7f3d0',
              }}
            >
              ✓ {refreshToastMsg}
            </div>
          )}

          {/* Filter Tabs & Bulk Actions */}
          <div
            style={{
              padding: '0.5rem 1.25rem',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={() => setFilterType('all')}
                style={{
                  padding: '0.2rem 0.65rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: filterType === 'all' ? 'var(--color-primary)' : '#f1f5f9',
                  color: filterType === 'all' ? '#ffffff' : '#64748b',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Semua ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('unread')}
                style={{
                  padding: '0.2rem 0.65rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: filterType === 'unread' ? 'var(--color-primary)' : '#f1f5f9',
                  color: filterType === 'unread' ? '#ffffff' : '#64748b',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Belum Dibaca ({unreadCount})
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  title="Tandai semua dibaca"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#059669',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                  }}
                >
                  <CheckCheck size={13} /> Baca Semua
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  title="Bersihkan daftar notifikasi"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                  }}
                >
                  <Trash2 size={13} /> Hapus
                </button>
              )}
            </div>
          </div>

          {/* List Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.25rem 0' }}>
            {loading && notifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.825rem' }}>
                Memuat notifikasi realtime...
              </div>
            ) : filteredNotifications.length > 0 ? (
              filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => markAsRead(item.id)}
                  style={{
                    padding: '0.8rem 1.25rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    borderBottom: '1px solid #f8fafc',
                    background: item.read ? '#ffffff' : '#f0f9ff',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '10px',
                      background: renderBgColor(item.type),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '0.1rem',
                    }}
                  >
                    {renderIcon(item.type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.825rem', fontWeight: 800, color: item.read ? '#334155' : '#0f172a' }}>
                        {item.title}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>
                        {getRelativeTime(item.timestamp)}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.775rem', color: '#64748b', margin: '0.25rem 0 0 0', lineHeight: 1.35 }}>
                      {item.message}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.825rem' }}>
                Belum ada notifikasi {filterType === 'unread' ? 'belum dibaca' : 'baru'}
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div
            style={{
              padding: '0.65rem 1.25rem',
              borderTop: '1px solid #f1f5f9',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>
              Audit Log & Realtime SSE Active
            </span>
            <button
              onClick={handleRefreshSystem}
              disabled={isRefreshing}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <RefreshCw size={13} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} /> Segarkan Sistem
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

