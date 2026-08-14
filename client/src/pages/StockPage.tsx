import React, { useState, useEffect } from 'react';
import { Package, RefreshCw, Edit3, Search } from 'lucide-react';
import { apiService } from '../services/api';
import { User } from '../types';
import { formatWaktuIndo } from '../utils/formatters';

interface StockItem {
  stock_id: string;
  product_id: string;
  product_name: string;
  business_unit: string;
  current_stock: number;
  last_updated: string;
  manage_stock: boolean;
}

interface StockPageProps {
  currentUser: User;
}

export const StockPage: React.FC<StockPageProps> = ({ currentUser: _currentUser }) => {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');

  // Edit Stock Modal State
  const [editingStock, setEditingStock] = useState<StockItem | null>(null);
  const [newStockQty, setNewStockQty] = useState<number>(0);
  const [submitLoading, setSubmitLoading] = useState(false);

  const loadStocks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getStocks();
      setStocks(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data stok barang');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStocks();
  }, []);

  const handleOpenEditModal = (item: StockItem) => {
    setEditingStock(item);
    setNewStockQty(item.current_stock);
  };

  const handleSaveStockUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStock) return;

    try {
      setSubmitLoading(true);
      setError(null);
      await apiService.updateStock(editingStock.product_id, Number(newStockQty));
      setEditingStock(null);
      await loadStocks();
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui stok barang');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Filtering
  const filteredStocks = stocks.filter((item) => {
    const matchesSearch = item.product_name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filterStatus === 'LOW') return item.current_stock > 0 && item.current_stock < 10;
    if (filterStatus === 'OUT') return item.current_stock === 0;
    return true;
  });

  const lowStockCount = stocks.filter((s) => s.current_stock > 0 && s.current_stock < 10).length;
  const outOfStockCount = stocks.filter((s) => s.current_stock === 0).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package color="var(--primary-500)" />
            Pengelolaan Stok Barang Fisik
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Pantau ketersediaan stok fisik barang dan lakukan restock/penyesuaian manual
          </p>
        </div>
        <button onClick={loadStocks} disabled={loading} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
          <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          {loading ? 'Memuat...' : 'Perbarui Data'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* Overview Indicator Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Total Item Dikelola</div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stocks.length} Produk</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Produk fisik (`manage_stock = true`)</span>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent-fc)', marginBottom: '0.25rem' }}>Stok Menipis (&lt; 10)</div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-fc)' }}>{lowStockCount} Produk</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Perlu segera disiap/restock</span>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--danger)', marginBottom: '0.25rem' }}>Stok Habis (0)</div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)' }}>{outOfStockCount} Produk</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tidak dapat ditransaksikan</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Cari nama produk fisik..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.55rem 0.55rem 0.55rem 2.4rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setFilterStatus('ALL')}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: filterStatus === 'ALL' ? 'var(--primary-500)' : 'var(--bg-card)',
              color: filterStatus === 'ALL' ? '#fff' : 'var(--text-secondary)',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            Semuanya ({stocks.length})
          </button>

          <button
            onClick={() => setFilterStatus('LOW')}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: filterStatus === 'LOW' ? 'var(--accent-fc)' : 'var(--bg-card)',
              color: filterStatus === 'LOW' ? '#fff' : 'var(--text-secondary)',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            Menipis ({lowStockCount})
          </button>

          <button
            onClick={() => setFilterStatus('OUT')}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: filterStatus === 'OUT' ? 'var(--danger)' : 'var(--bg-card)',
              color: filterStatus === 'OUT' ? '#fff' : 'var(--text-secondary)',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            Habis ({outOfStockCount})
          </button>
        </div>
      </div>

      {/* Stock Table */}
      <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Memuat data stok produk...</div>
        ) : filteredStocks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Tidak ada data stok produk fisik yang cocok.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.6rem', textAlign: 'left' }}>Nama Produk Fisik</th>
                  <th style={{ padding: '0.6rem', textAlign: 'center' }}>Bidang Usaha</th>
                  <th style={{ padding: '0.6rem', textAlign: 'center' }}>Status Stok</th>
                  <th style={{ padding: '0.6rem', textAlign: 'right' }}>Jumlah Stok Physical</th>
                  <th style={{ padding: '0.6rem', textAlign: 'left' }}>Update Terakhir</th>
                  <th style={{ padding: '0.6rem', textAlign: 'center' }}>Aksi Restock</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map((item) => {
                  const isOut = item.current_stock === 0;
                  const isLow = item.current_stock > 0 && item.current_stock < 10;

                  return (
                    <tr key={item.stock_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.6rem', fontWeight: 600 }}>{item.product_name}</td>
                      <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                        <span className={item.business_unit === 'FC_PRINT' ? 'badge badge-fc' : 'badge badge-fnb'}>
                          {item.business_unit}
                        </span>
                      </td>
                      <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: isOut ? 'rgba(239,68,68,0.15)' : isLow ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                            color: isOut ? 'var(--danger)' : isLow ? 'var(--accent-fc)' : 'var(--success)',
                          }}
                        >
                          {isOut ? '🔴 HABIS (0)' : isLow ? '⚠️ MENIPIS' : '🟢 AMAN'}
                        </span>
                      </td>
                      <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: 700, fontSize: '1rem' }}>
                        {item.current_stock} pcs
                      </td>
                      <td style={{ padding: '0.6rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {formatWaktuIndo(item.last_updated)}
                      </td>
                      <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="btn-primary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <Edit3 size={14} />
                          Penyesuaian Stok
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Restock / Penyesuaian Stok */}
      {editingStock && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', maxWidth: '420px', width: '100%', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Penyesuaian / Restock Manual</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Produk: <strong>{editingStock.product_name}</strong>
            </p>

            <form onSubmit={handleSaveStockUpdate}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Jumlah Stok Fisik Baru (Pcs):
                </label>
                <input
                  type="number"
                  min={0}
                  value={newStockQty}
                  onChange={(e) => setNewStockQty(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '1.2rem', fontWeight: 700 }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setEditingStock(null)}
                  style={{ padding: '0.55rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-secondary)' }}
                >
                  Batal
                </button>
                <button type="submit" disabled={submitLoading} className="btn-primary" style={{ padding: '0.55rem 1.25rem' }}>
                  {submitLoading ? 'Menyimpan...' : 'Simpan Stok'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
