import React, { useState, useEffect } from 'react';
import { DollarSign, FileText, PlusCircle, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';
import { Expense, User } from '../types';
import { formatRupiah, formatWaktuIndo } from '../utils/formatters';

interface ExpensesPageProps {
  currentUser: User;
  activeShiftId?: string;
  onExpenseCreated?: () => void;
}

const EXPENSE_CATEGORIES = [
  { value: 'BAHAN_BAKU', label: 'Pembelian Bahan Baku (FNB / Operasional)' },
  { value: 'OPERASIONAL', label: 'Biaya Operasional Toko (Gas, Kebersihan, dll)' },
  { value: 'ATK', label: 'Pembelian ATK & Perlengkapan Printing' },
  { value: 'LAIN_LAIN', label: 'Pengeluaran Lain-lain' },
];

export const ExpensesPage: React.FC<ExpensesPageProps> = ({ currentUser: _currentUser, activeShiftId }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [category, setCategory] = useState('BAHAN_BAKU');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(10000);

  const loadExpenses = async () => {
    if (!activeShiftId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getExpenses(activeShiftId);
      setExpenses(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat riwayat pengeluaran kas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [activeShiftId]);

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShiftId) {
      alert('Tidak ada sesi shift aktif. Harap buka shift terlebih dahulu.');
      return;
    }

    try {
      setSubmitLoading(true);
      setError(null);
      await apiService.createExpense(category, description, Number(amount));
      setDescription('');
      setAmount(10000);
      await loadExpenses();
    } catch (err: any) {
      setError(err.message || 'Gagal mencatat pengeluaran kas');
    } finally {
      setSubmitLoading(false);
    }
  };

  const totalExpensesAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign color="var(--danger)" />
            Pencatatan Pengeluaran Kas Toko
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Pengeluaran kas memotong saldo kas teoritis laci kas bersama secara real-time
          </p>
        </div>
      </div>

      {!activeShiftId && (
        <div style={{ padding: '0.85rem 1.25rem', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--danger)' }}>
          <AlertCircle size={20} />
          <span><strong>SHIFT OFFLINE:</strong> Pengeluaran kas terikat pada sesi shift. Harap buka shift terlebih dahulu di tab <strong>Manajemen Shift</strong>.</span>
        </div>
      )}

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Panel Form Input Pengeluaran Baru */}
        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <PlusCircle size={20} color="var(--danger)" />
            Catat Pengeluaran Baru
          </h3>

          <form onSubmit={handleSubmitExpense}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Kategori Pengeluaran:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                required
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Nominal Pengeluaran Kas (Rp):
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '1rem', fontWeight: 700 }}
                min={1000}
                step={1000}
                required
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Keterangan / Rincian Pengeluaran:
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: Beli minyak goreng 2 Liter untuk seblak, Beli kertas HVS A4 1 rim"
                style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem', minHeight: '80px', fontFamily: 'inherit' }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitLoading || !activeShiftId}
              className="btn-primary"
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', background: 'var(--danger)', borderColor: 'var(--danger)' }}
            >
              {submitLoading ? 'Simpan Pengeluaran...' : '- Simpan Pengeluaran Kas'}
            </button>
          </form>
        </div>

        {/* Panel Tabel Riwayat Pengeluaran Sesi Shift */}
        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText size={20} color="var(--primary-500)" />
              Riwayat Shift Ini ({expenses.length})
            </h3>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--danger)' }}>
              Total: {formatRupiah(totalExpensesAmount)}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Memuat riwayat pengeluaran...</div>
          ) : expenses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Belum ada pengeluaran kas yang dicatat pada shift berjalan ini.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Kategori & Keterangan</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Pencatat</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Nominal</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => (
                    <tr key={exp.expense_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.5rem' }}>
                        <span className="badge badge-fnb" style={{ fontSize: '0.65rem', marginBottom: '0.2rem', display: 'inline-block' }}>
                          {exp.category}
                        </span>
                        <div style={{ fontWeight: 600 }}>{exp.description}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatWaktuIndo(exp.expense_time)}</div>
                      </td>
                      <td style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>{exp.recorded_by_user_id}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 700, color: 'var(--danger)' }}>
                        -{formatRupiah(exp.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
