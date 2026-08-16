import React from 'react';
import { Award, ShoppingBag, X, CheckCircle } from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';
import { getCashierColor } from '../common/CashierBadge';

export interface EmployeeSummary {
  user_id: string;
  username: string;
  full_name: string;
  role: string;
  transaction_count: number;
  total_sales: number;
  is_active_in_shift: boolean;
}

interface EmployeePerformanceModalProps {
  employee: EmployeeSummary | null;
  onClose: () => void;
}

export const EmployeePerformanceModal: React.FC<EmployeePerformanceModalProps> = ({ employee, onClose }) => {
  if (!employee) return null;

  const color = getCashierColor(employee.full_name || employee.username);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '1rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '24px',
          padding: '1.75rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: color.avatarBg, color: color.avatarText, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.1rem', boxShadow: `0 4px 12px ${color.bg}` }}>
              {employee.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{employee.full_name}</h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>@{employee.username} • Role: <strong>{employee.role}</strong></p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md, 6px)', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Status Shift Saat Ini:</span>
            {employee.is_active_in_shift ? (
              <span style={{ color: 'var(--success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <CheckCircle size={16} /> Shift Leader / Aktif
              </span>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Shift Offline</span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ padding: '0.85rem', background: 'rgba(37, 99, 235, 0.06)', borderRadius: 'var(--radius-md, 6px)', border: '1px solid rgba(37, 99, 235, 0.2)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <ShoppingBag size={14} color="var(--primary-500)" /> Jumlah Transaksi
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-600)', marginTop: '0.25rem' }}>
                {employee.transaction_count} Tx
              </div>
            </div>

            <div style={{ padding: '0.85rem', background: 'rgba(16, 185, 129, 0.06)', borderRadius: 'var(--radius-md, 6px)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Award size={14} color="var(--success)" /> Total Omzet Dihasilkan
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--success)', marginTop: '0.25rem' }}>
                {formatRupiah(employee.total_sales)}
              </div>
            </div>
          </div>
        </div>

        <button onClick={onClose} className="btn-primary" style={{ width: '100%', padding: '0.65rem' }}>
          Tutup Detail
        </button>
      </div>
    </div>
  );
};
