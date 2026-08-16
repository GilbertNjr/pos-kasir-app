import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  FileText,
  PlusCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  PieChart,
  Calendar,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Tag,
} from 'lucide-react';
import { apiService } from '../services/api';
import { Expense, User } from '../types';
import { formatRupiah, formatWaktuIndo } from '../utils/formatters';

interface ExpensesPageProps {
  currentUser: User;
  activeShiftId?: string;
  onExpenseCreated?: () => void;
}

const EXPENSE_CATEGORIES = [
  { value: 'BAHAN_BAKU', label: 'Pembelian Bahan Baku (FNB / Operasional)', color: '#d97706', bg: '#fef3c7' },
  { value: 'OPERASIONAL', label: 'Biaya Operasional Toko (Gas, Kebersihan, dll)', color: '#dc2626', bg: '#fef2f2' },
  { value: 'ATK', label: 'Pembelian ATK & Perlengkapan Printing', color: '#2563eb', bg: '#eff6ff' },
  { value: 'LAIN_LAIN', label: 'Pengeluaran Lain-lain', color: '#475569', bg: '#f1f5f9' },
];

export const ExpensesPage: React.FC<ExpensesPageProps> = ({ currentUser, activeShiftId }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search, Filter & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState('BAHAN_BAKU');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(10000);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getExpenses(activeShiftId);
      setExpenses(data || []);
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
    try {
      setSubmitLoading(true);
      setError(null);
      await apiService.createExpense(category, description, Number(amount));
      setDescription('');
      setAmount(10000);
      setShowModal(false);
      await loadExpenses();
    } catch (err: any) {
      setError(err.message || 'Gagal mencatat pengeluaran kas');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Metrics Calculations (useMemo)
  const totalExpensesAmount = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [expenses]);

  const todayExpensesAmount = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return expenses
      .filter((e) => e.expense_time && e.expense_time.startsWith(todayStr))
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [expenses]);

  const topCategoryName = useMemo(() => {
    if (expenses.length === 0) return '-';
    const catMap: Record<string, number> = {};
    expenses.forEach((e) => {
      catMap[e.category] = (catMap[e.category] || 0) + (e.amount || 0);
    });
    let topCat = '-';
    let maxVal = -1;
    Object.entries(catMap).forEach(([cat, val]) => {
      if (val > maxVal) {
        maxVal = val;
        topCat = cat;
      }
    });
    return topCat;
  }, [expenses]);

  // Filtering Logic
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const desc = (item.description || '').toLowerCase();
      const user = (item.recorded_by_user_id || '').toLowerCase();
      const cat = (item.category || '').toLowerCase();

      const matchQuery = !q || desc.includes(q) || user.includes(q) || cat.includes(q);
      const matchCategory = selectedCategoryFilter === 'ALL' || item.category === selectedCategoryFilter;

      return matchQuery && matchCategory;
    });
  }, [expenses, searchQuery, selectedCategoryFilter]);

  // Pagination Calculations
  const totalPages = Math.ceil(filteredExpenses.length / pageSize) || 1;
  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredExpenses.slice(start, start + pageSize);
  }, [filteredExpenses, currentPage, pageSize]);

  // Category Breakdown Calculations
  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {
      BAHAN_BAKU: 0,
      OPERASIONAL: 0,
      ATK: 0,
      LAIN_LAIN: 0,
    };
    expenses.forEach((e) => {
      if (map[e.category] !== undefined) {
        map[e.category] += e.amount || 0;
      } else {
        map.LAIN_LAIN += e.amount || 0;
      }
    });
    return map;
  }, [expenses]);

  const getCategoryBadgeStyle = (catVal: string) => {
    const cat = EXPENSE_CATEGORIES.find((c) => c.value === catVal);
    if (cat) return { bg: cat.bg, color: cat.color, label: cat.value };
    return { bg: '#f1f5f9', color: '#475569', label: catVal };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', paddingBottom: '3rem' }}>
      {/* 1. HEADER BANNER SECTION */}
      <div
        style={{
          background: 'var(--primary-gradient, linear-gradient(135deg, #0f172a 0%, #1e293b 100%))',
          borderRadius: '24px',
          padding: '2rem 2.25rem',
          color: '#ffffff',
          boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ padding: '0.55rem', borderRadius: '14px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
              <DollarSign size={26} />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: '#ffffff' }}>
              Manajemen Pengeluaran Kas Toko
            </h1>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0, maxWidth: '650px' }}>
            Pencatatan real-time pengeluaran operasional, bahan baku, ATK, dan keperluan kas usaha.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={loadExpenses}
            disabled={loading}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backdropFilter: 'blur(10px)',
            }}
          >
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            Refresh Data
          </button>

          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
            }}
          >
            <PlusCircle size={18} />
            Catat Pengeluaran Baru
          </button>
        </div>
      </div>

      {!activeShiftId && currentUser?.role !== 'OWNER' && (
        <div style={{ padding: '0.85rem 1.25rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '16px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} />
          <span><strong>SHIFT OFFLINE:</strong> Pengeluaran kas kasir terikat pada sesi shift. Harap buka shift terlebih dahulu.</span>
        </div>
      )}

      {error && (
        <div style={{ padding: '1rem 1.25rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '16px', fontSize: '0.875rem', fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* 2. TOP METRIC CARDS BAR (4 DYNAMIC REAL-TIME CARDS) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        {/* CARD 1: TOTAL PENGELUARAN */}
        <div style={{ background: '#ffffff', padding: '1.35rem 1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '1.1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <TrendingDown size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.775rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Pengeluaran</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>{formatRupiah(totalExpensesAmount)}</div>
          </div>
        </div>

        {/* CARD 2: PENGELUARAN HARI INI */}
        <div style={{ background: '#ffffff', padding: '1.35rem 1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '1.1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Calendar size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.775rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pengeluaran Hari Ini</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>{formatRupiah(todayExpensesAmount)}</div>
          </div>
        </div>

        {/* CARD 3: TRANSAKSI PENGELUARAN */}
        <div style={{ background: '#ffffff', padding: '1.35rem 1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '1.1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileText size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.775rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Transaksi Pengeluaran</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>{expenses.length} <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8' }}>Item</span></div>
          </div>
        </div>

        {/* CARD 4: KATEGORI TERBANYAK */}
        <div style={{ background: '#ffffff', padding: '1.35rem 1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '1.1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Tag size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.775rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kategori Dominan</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.2, textTransform: 'uppercase' }}>{topCategoryName}</div>
          </div>
        </div>
      </div>

      {/* 3. MAIN DASHBOARD CONTENT (2 COLUMNS: LEFT TABLE + RIGHT SIDE PANEL) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.75rem', alignItems: 'start' }}>
        {/* LEFT COLUMN: TOOLBAR & TABLE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* SEARCH & FILTER BAR */}
          <div
            style={{
              background: '#ffffff',
              padding: '1.25rem 1.5rem',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              display: 'flex',
              gap: '1.25rem',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Cari berdasarkan keterangan, pencatatan, atau kategori..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '0.7rem 1rem 0.7rem 2.6rem',
                  borderRadius: '14px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem',
                  outline: 'none',
                  background: '#f8fafc',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={18} color="#64748b" />
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => {
                    setSelectedCategoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '0.65rem 1rem',
                    borderRadius: '14px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: '#334155',
                    background: '#ffffff',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="ALL">Semua Kategori</option>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.value}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Baris:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '0.55rem 0.75rem',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    background: '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  <option value={10}>10 / hlm</option>
                  <option value={25}>25 / hlm</option>
                  <option value={50}>50 / hlm</option>
                </select>
              </div>
            </div>
          </div>

          {/* TABLE CARD */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '1.25rem 1.75rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc',
              }}
            >
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Catatan Pengeluaran Kas Terdaftar ({filteredExpenses.length})
              </h3>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#dc2626' }}>
                Total Filter: {formatRupiah(filteredExpenses.reduce((s, e) => s + e.amount, 0))}
              </span>
            </div>

            {filteredExpenses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#94a3b8' }}>
                <FileText size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#475569' }}>Tidak Ada Data Pengeluaran</div>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
                  Belum ada catatan pengeluaran kas yang sesuai dengan kata kunci pencarian.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--accent-bg, #f8fafc)', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Waktu & Pencatat
                      </th>
                      <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Kategori
                      </th>
                      <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Rincian Keterangan
                      </th>
                      <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>
                        Nominal Kas
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedExpenses.map((exp, idx) => {
                      const badge = getCategoryBadgeStyle(exp.category);
                      return (
                        <tr
                          key={exp.expense_id || idx}
                          style={{
                            borderBottom: idx === paginatedExpenses.length - 1 ? 'none' : '1px solid #f1f5f9',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: '1.1rem 1.5rem', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                              <Clock size={14} color="#94a3b8" />
                              {formatWaktuIndo(exp.expense_time)}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                              Oleh: <strong style={{ color: '#475569' }}>{exp.recorded_by_user_id}</strong>
                            </div>
                          </td>

                          <td style={{ padding: '1.1rem 1.5rem' }}>
                            <span
                              style={{
                                padding: '0.3rem 0.7rem',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                background: badge.bg,
                                color: badge.color,
                                display: 'inline-block',
                              }}
                            >
                              {exp.category}
                            </span>
                          </td>

                          <td style={{ padding: '1.1rem 1.5rem', color: '#1e293b', fontSize: '0.875rem', fontWeight: 600 }}>
                            {exp.description}
                          </td>

                          <td style={{ padding: '1.1rem 1.5rem', textAlign: 'right', fontWeight: 900, fontSize: '0.95rem', color: '#dc2626' }}>
                            -{formatRupiah(exp.amount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* PAGINATION CONTROL BAR */}
            {filteredExpenses.length > 0 && (
              <div
                style={{
                  padding: '1.1rem 1.75rem',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#f8fafc',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div style={{ fontSize: '0.825rem', color: '#64748b', fontWeight: 600 }}>
                  Menampilkan <span style={{ color: '#0f172a', fontWeight: 800 }}>{(currentPage - 1) * pageSize + 1}</span> -{' '}
                  <span style={{ color: '#0f172a', fontWeight: 800 }}>{Math.min(currentPage * pageSize, filteredExpenses.length)}</span> dari{' '}
                  <span style={{ color: '#0f172a', fontWeight: 800 }}>{filteredExpenses.length}</span> item
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: currentPage === 1 ? '#cbd5e1' : '#334155',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                  >
                    <ChevronLeft size={16} /> Prev
                  </button>

                  <span style={{ fontSize: '0.825rem', fontWeight: 800, color: '#0f172a', padding: '0 0.5rem' }}>
                    Halaman {currentPage} dari {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: currentPage === totalPages ? '#cbd5e1' : '#334155',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ANALYTICS SIDE PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* CATEGORY BREAKDOWN CARD */}
          <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieChart size={18} color="#2563eb" />
              Distribusi Pengeluaran
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {EXPENSE_CATEGORIES.map((cat) => {
                const totalCatVal = categoryStats[cat.value] || 0;
                const pct = totalExpensesAmount > 0 ? Math.round((totalCatVal / totalExpensesAmount) * 100) : 0;

                return (
                  <div key={cat.value}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      <span style={{ color: '#334155' }}>{cat.value}</span>
                      <span style={{ color: '#0f172a' }}>{formatRupiah(totalCatVal)} ({pct}%)</span>
                    </div>

                    <div style={{ width: '100%', height: '8px', borderRadius: '9999px', background: '#f1f5f9', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: cat.color,
                          borderRadius: '9999px',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* QUICK SUMMARY CARD */}
          <div style={{ background: 'var(--primary-gradient, linear-gradient(135deg, #1e293b 0%, #0f172a 100%))', padding: '1.5rem', borderRadius: '24px', color: '#ffffff', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.15)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              Ringkasan Operasional Kas
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Rata-rata Per Transaksi</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#f87171' }}>
                  {formatRupiah(expenses.length > 0 ? Math.round(totalExpensesAmount / expenses.length) : 0)}
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Pengeluaran Terbesar</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fbbf24' }}>
                  {formatRupiah(expenses.reduce((max, e) => Math.max(max, e.amount || 0), 0))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. MODAL CATAT PENGELUARAN BARU */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '520px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              overflow: 'hidden',
              animation: 'modalSlide 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* MODAL HEADER */}
            <div style={{ padding: '1.35rem 1.75rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ padding: '0.4rem', borderRadius: '10px', background: '#fef2f2', color: '#dc2626' }}>
                  <PlusCircle size={20} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Catat Pengeluaran Kas Baru
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', padding: '0.2rem' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* MODAL BODY FORM */}
            <form onSubmit={handleSubmitExpense} style={{ padding: '1.75rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                  Kategori Pengeluaran:
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.7rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    outline: 'none',
                  }}
                  required
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                  Nominal Pengeluaran Kas (Rp):
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    fontSize: '1.1rem',
                    fontWeight: 900,
                    color: '#dc2626',
                    outline: 'none',
                  }}
                  min={1000}
                  step={1000}
                  required
                />

                {/* PRESET NOMINAL QUICK BUTTONS */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  {[10000, 20000, 50000, 100000, 250000].map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setAmount(val)}
                      style={{
                        padding: '0.3rem 0.6rem',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        background: amount === val ? '#fef2f2' : '#f8fafc',
                        color: amount === val ? '#dc2626' : '#475569',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {formatRupiah(val)}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                  Keterangan / Rincian Pengeluaran:
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Beli minyak goreng 2 Liter untuk seblak, Beli kertas HVS A4 1 rim"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    minHeight: '90px',
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                  required
                />
              </div>

              {/* FOOTER ACTION BUTTONS */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '0.7rem 1.25rem',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  style={{
                    padding: '0.7rem 1.5rem',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                  }}
                >
                  {submitLoading ? 'Menyimpan...' : 'Simpan Pengeluaran Kas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
