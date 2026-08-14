import React, { useState, useEffect } from 'react';
import { Package, Search, PlusCircle, Layers, CheckCircle2, XCircle } from 'lucide-react';
import { apiService } from '../services/api';
import { Product, Category, User, BusinessUnit } from '../types';
import { formatRupiah } from '../utils/formatters';
import { RoleGuard } from '../components/RoleGuard';

interface ProductsPageProps {
  currentUser: User;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({ currentUser }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State Tambah Produk (Owner Only)
  const [showModal, setShowModal] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newBusinessUnit, setNewBusinessUnit] = useState<BusinessUnit>('FC_PRINT');
  const [newPrice, setNewPrice] = useState<number>(5000);
  const [newManageStock, setNewManageStock] = useState(true);
  const [formLoading, setFormLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [prodData, catData] = await Promise.all([
        apiService.getProducts(selectedUnit),
        apiService.getCategories(),
      ]);
      setProducts(prodData);
      setCategories(catData);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat katalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedUnit]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim() || !newCategoryId) {
      alert('Nama produk dan kategori wajib dipilih.');
      return;
    }

    try {
      setFormLoading(true);
      await apiService.createProduct({
        product_name: newProductName,
        category_id: newCategoryId,
        business_unit: newBusinessUnit,
        selling_price: Number(newPrice),
        manage_stock: newManageStock,
        is_active: true,
      });

      setShowModal(false);
      setNewProductName('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal membuat produk baru.');
    } finally {
      setFormLoading(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.product_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package color="var(--primary-500)" />
            Katalog Master Produk & Jasa
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Daftar item non-hardcoded terkelola untuk FC/Printing dan FNB
          </p>
        </div>

        <RoleGuard userRole={currentUser.role} allow={['OWNER']}>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}
          >
            <PlusCircle size={18} />
            Tambah Produk Master
          </button>
        </RoleGuard>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setSelectedUnit('ALL')}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: 600,
              border: '1px solid var(--border-color)',
              background: selectedUnit === 'ALL' ? 'var(--primary-500)' : 'var(--bg-card)',
              color: selectedUnit === 'ALL' ? '#fff' : 'var(--text-secondary)',
            }}
          >
            Semua Unit
          </button>

          <button
            onClick={() => setSelectedUnit('FC_PRINT')}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: 600,
              border: '1px solid var(--border-color)',
              background: selectedUnit === 'FC_PRINT' ? 'var(--accent-fc)' : 'var(--bg-card)',
              color: selectedUnit === 'FC_PRINT' ? '#fff' : 'var(--text-secondary)',
            }}
          >
            FC / Printing
          </button>

          <button
            onClick={() => setSelectedUnit('FNB')}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: 600,
              border: '1px solid var(--border-color)',
              background: selectedUnit === 'FNB' ? 'var(--accent-fnb)' : 'var(--bg-card)',
              color: selectedUnit === 'FNB' ? '#fff' : 'var(--text-secondary)',
            }}
          >
            F&B Store
          </button>
        </div>

        <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Cari nama produk / jasa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.45rem 0.85rem 0.45rem 2.2rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
            }}
          />
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* Product Table Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Memuat katalog produk...</div>
      ) : (
        <div style={{ overflowX: 'auto', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', background: 'var(--bg-main)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>ID Produk</th>
                <th style={{ padding: '0.75rem 1rem' }}>Nama Item</th>
                <th style={{ padding: '0.75rem 1rem' }}>Bidang Usaha</th>
                <th style={{ padding: '0.75rem 1rem' }}>Harga Jual</th>
                <th style={{ padding: '0.75rem 1rem' }}>Pengaturan Stok</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.product_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{p.product_id}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{p.product_name}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span className={p.business_unit === 'FC_PRINT' ? 'badge badge-fc' : 'badge badge-fnb'}>
                      {p.business_unit}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--primary-600)' }}>
                    {formatRupiah(p.selling_price)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {p.manage_stock ? (
                      <span style={{ color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 600 }}>
                        <CheckCircle2 size={15} /> Kelola Stok (Fisik)
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                        <XCircle size={15} /> Tanpa Stok (Jasa)
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--success)', fontWeight: 600 }}>AKTIF</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form Tambah Produk (Owner Only) */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card-glass" style={{ width: '100%', maxWidth: '480px', padding: '2rem', background: 'var(--bg-card)' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={22} color="var(--primary-500)" />
              Tambah Produk Master Baru
            </h3>

            <form onSubmit={handleCreateProduct}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Bidang Usaha
                </label>
                <select
                  value={newBusinessUnit}
                  onChange={(e) => {
                    setNewBusinessUnit(e.target.value as BusinessUnit);
                    setNewCategoryId('');
                  }}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                >
                  <option value="FC_PRINT">FC_PRINT (Fotokopi / Printing)</option>
                  <option value="FNB">FNB (Food & Beverage)</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Kategori Produk
                </label>
                <select
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                  required
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories
                    .filter((c) => c.business_unit === newBusinessUnit)
                    .map((c) => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.category_name}
                      </option>
                    ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Nama Produk / Jasa
                </label>
                <input
                  type="text"
                  placeholder="misal: Cetak Stiker A3 / Seblak Pedas"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Harga Jual (Rp)
                </label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                  min={1}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="manageStockCheck"
                  checked={newManageStock}
                  onChange={(e) => setNewManageStock(e.target.checked)}
                />
                <label htmlFor="manageStockCheck" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                  Kelola Stok (Centang jika barang fisik, uncheck jika barang jasa)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary" disabled={formLoading} style={{ padding: '0.5rem 1rem' }}>
                  {formLoading ? 'Menyimpan...' : 'Simpan Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
