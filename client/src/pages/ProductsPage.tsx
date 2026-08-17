import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  RefreshCw,
  Search,
  PlusCircle,
  Layers,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  PackageX,
  LayoutGrid,
  List,
  Tag,
  Edit3,
  Filter,
  PieChart,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { apiService } from '../services/api';
import { Product, Category, User, BusinessUnit } from '../types';
import { formatRupiah } from '../utils/formatters';
import { RoleGuard } from '../components/RoleGuard';
import { ActionLoadingModal } from '../components/common/ActionLoadingModal';


interface ProductsPageProps {
  currentUser: User;
  onTriggerToast?: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({ currentUser, onTriggerToast }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>('ALL');
  const [selectedStockFilter, setSelectedStockFilter] = useState<'ALL' | 'PHYSICAL' | 'SERVICE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View & Pagination
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form State Modal Tambah Produk (Owner Only)
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newBusinessUnit, setNewBusinessUnit] = useState<BusinessUnit>('FC_PRINT');
  const [newPrice, setNewPrice] = useState<number | string>(5000);
  const [newManageStock, setNewManageStock] = useState(true);
  const [formLoading, setFormLoading] = useState(false);

  // Form State Modal Edit Produk (Owner Only)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProductId, setEditProductId] = useState('');
  const [editProductName, setEditProductName] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editBusinessUnit, setEditBusinessUnit] = useState<BusinessUnit>('FC_PRINT');
  const [editPrice, setEditPrice] = useState<number | string>(0);
  const [editManageStock, setEditManageStock] = useState(true);

  // State Modal Hapus Produk (Owner Only)
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [prodData, catData, stocksData] = await Promise.all([
        apiService.getProducts(selectedUnit),
        apiService.getCategories(),
        apiService.getStocks().catch(() => []),
      ]);
      setProducts(prodData || []);
      setCategories(catData || []);
      setStocks(stocksData || []);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat katalog produk');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Polling interval 5 detik sebagai fallback sync otomatis ke database
    const interval = setInterval(() => {
      apiService.getProducts(selectedUnit).then((prodData) => {
        if (prodData) setProducts(prodData);
      }).catch(() => {});
      apiService.getStocks().then((stocksData) => {
        if (stocksData) setStocks(stocksData);
      }).catch(() => {});
    }, 5000);

    // SSE Realtime Listener untuk pembaruan stok langsung dari Kasir / PJ / Database
    let sse: EventSource | null = null;
    try {
      sse = new EventSource('/api/events');
      const handleSync = () => {
        loadData();
      };
      sse.addEventListener('STOCK_UPDATED', handleSync);
      sse.addEventListener('PRODUCT_UPDATED', handleSync);
      sse.addEventListener('TRANSACTION_CREATED', handleSync);
    } catch {
      // Ignore SSE error, fallback to polling
    }

    return () => {
      clearInterval(interval);
      if (sse) sse.close();
    };
  }, [selectedUnit]);

  // Handle Add Product Submit
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim() || !newCategoryId) {
      if (onTriggerToast) onTriggerToast('warning', 'Validasi Gagal', 'Nama produk dan kategori wajib dipilih.');
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

      if (onTriggerToast) {
        onTriggerToast('success', 'Produk Ditambahkan', `Produk "${newProductName}" berhasil disimpan ke database.`);
      }

      setShowAddModal(false);
      setNewProductName('');
      setNewPrice(5000);
      loadData();
    } catch (err: any) {
      if (onTriggerToast) {
        onTriggerToast('danger', 'Gagal Menambah Produk', err.message || 'Terjadi kesalahan sistem.');
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (product: Product) => {
    setEditProductId(product.product_id);
    setEditProductName(product.product_name);
    setEditCategoryId(product.category_id);
    setEditBusinessUnit(product.business_unit);
    setEditPrice(product.selling_price);
    setEditManageStock(product.manage_stock);
    setShowEditModal(true);
  };

  // Handle Update Product Submit
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProductName.trim() || !editCategoryId) {
      if (onTriggerToast) onTriggerToast('warning', 'Validasi Gagal', 'Nama produk dan kategori wajib diisi.');
      return;
    }

    try {
      setFormLoading(true);
      await apiService.updateProduct(editProductId, {
        product_name: editProductName,
        category_id: editCategoryId,
        business_unit: editBusinessUnit,
        selling_price: Number(editPrice),
        manage_stock: editManageStock,
      });

      if (onTriggerToast) {
        onTriggerToast('success', 'Produk Diperbarui', `Perubahan untuk "${editProductName}" berhasil disimpan.`);
      }

      setShowEditModal(false);
      loadData();
    } catch (err: any) {
      if (onTriggerToast) {
        onTriggerToast('danger', 'Gagal Memperbarui', err.message || 'Terjadi kesalahan sistem.');
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Delete Product
  const handleDeleteProduct = async () => {
    if (!deleteConfirmItem) return;
    try {
      setDeleteLoading(true);
      await apiService.deleteProduct(deleteConfirmItem.product_id);
      if (onTriggerToast) {
        onTriggerToast('success', 'Produk Dihapus', `Produk "${deleteConfirmItem.product_name}" berhasil dihapus dari database.`);
      }
      setDeleteConfirmItem(null);
      loadData();
    } catch (err: any) {
      if (onTriggerToast) {
        onTriggerToast('danger', 'Gagal Menghapus Produk', err.message || 'Terjadi kesalahan sistem.');
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  // Helper map category ID -> Name
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.category_id, c.category_name));
    return map;
  }, [categories]);

  // Helper map stock quantity (product_id -> actual_stock)
  const stockMap = useMemo(() => {
    const map = new Map<string, number>();
    stocks.forEach((s) => {
      map.set(s.product_id, s.actual_stock ?? s.current_stock ?? s.stock ?? 0);
    });
    return map;
  }, [stocks]);

  // Filtering Logic
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const catName = categoryMap.get(p.category_id) || '';
      const matchesSearch = !q || p.product_name.toLowerCase().includes(q) || p.product_id.toLowerCase().includes(q) || catName.toLowerCase().includes(q);
      if (!matchesSearch) return false;

      if (selectedStockFilter === 'PHYSICAL' && !p.manage_stock) return false;
      if (selectedStockFilter === 'SERVICE' && p.manage_stock) return false;

      return true;
    });
  }, [products, searchQuery, selectedStockFilter, categoryMap]);

  // Auto reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStockFilter]);

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const activePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedProducts = useMemo(() => {
    const start = (activePage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, activePage, pageSize]);

  // Dynamic Dashboard Metrics (100% Real-Time & Accurate)
  const totalProductCount = products.length;
  const activeProductCount = products.filter((p) => p.is_active !== false).length;
  const inactiveProductCount = products.filter((p) => p.is_active === false).length;

  const lowStockCount = useMemo(() => {
    return products.filter((p) => {
      if (!p.manage_stock) return false;
      const qty = stockMap.get(p.product_id) ?? 0;
      return qty > 0 && qty < 10;
    }).length;
  }, [products, stockMap]);

  const outOfStockCount = useMemo(() => {
    return products.filter((p) => {
      if (!p.manage_stock) return false;
      const qty = stockMap.get(p.product_id) ?? 0;
      return qty === 0;
    }).length;
  }, [products, stockMap]);

  const physicalProductCount = products.filter((p) => p.manage_stock).length;
  const serviceProductCount = products.filter((p) => !p.manage_stock).length;

  const fcProductCount = products.filter((p) => p.business_unit === 'FC_PRINT').length;
  const fnbProductCount = products.filter((p) => p.business_unit === 'FNB').length;

  // Donut Chart Math
  const fcPercent = totalProductCount > 0 ? Math.round((fcProductCount / totalProductCount) * 100) : 0;
  const fnbPercent = totalProductCount > 0 ? 100 - fcPercent : 0;
  const circumference = 2 * Math.PI * 40;
  const fcStrokeDash = (fcPercent / 100) * circumference;
  const fnbStrokeDash = (fnbPercent / 100) * circumference;

  // Category Distribution Calculation
  const categoryDistribution = useMemo(() => {
    if (products.length === 0) return [];

    const counts = new Map<string, number>();
    products.forEach((p) => {
      const catName = categoryMap.get(p.category_id) || 'Kategori Lain';
      counts.set(catName, (counts.get(catName) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / products.length) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [products, categoryMap]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', paddingBottom: '3rem' }}>
      {/* 1. TOP METRIC CARDS BAR (5 DYNAMIC REAL-TIME GRID COLUMNS: 2 CARDS PER ROW ON MOBILE) */}
      <div className="responsive-kpi-grid">
        {/* CARD 1: TOTAL PRODUK */}
        <div className="responsive-kpi-card" style={{ background: '#ffffff', padding: '1.25rem 1.35rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="kpi-icon" style={{ width: '46px', height: '46px', borderRadius: '14px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Package size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Produk</div>
            <div className="kpi-value" style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>{totalProductCount} <span style={{ fontSize: '0.775rem', fontWeight: 700, color: '#94a3b8' }}>Item</span></div>
          </div>
        </div>

        {/* CARD 2: PRODUK AKTIF */}
        <div className="responsive-kpi-card" style={{ background: '#ffffff', padding: '1.25rem 1.35rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="kpi-icon" style={{ width: '46px', height: '46px', borderRadius: '14px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Produk Aktif</div>
            <div className="kpi-value" style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>{activeProductCount} <span style={{ fontSize: '0.775rem', fontWeight: 700, color: '#059669' }}>Aktif</span></div>
          </div>
        </div>

        {/* CARD 3: PRODUK NON-AKTIF */}
        <div className="responsive-kpi-card" style={{ background: '#ffffff', padding: '1.25rem 1.35rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="kpi-icon" style={{ width: '46px', height: '46px', borderRadius: '14px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <XCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Produk Non-Aktif</div>
            <div className="kpi-value" style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>{inactiveProductCount} <span style={{ fontSize: '0.775rem', fontWeight: 700, color: '#dc2626' }}>Item</span></div>
          </div>
        </div>

        {/* CARD 4: STOK MENIPIS */}
        <div className="responsive-kpi-card" style={{ background: '#ffffff', padding: '1.25rem 1.35rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="kpi-icon" style={{ width: '46px', height: '46px', borderRadius: '14px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stok Menipis</div>
            <div className="kpi-value" style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>{lowStockCount} <span style={{ fontSize: '0.775rem', fontWeight: 700, color: '#d97706' }}>Item</span></div>
          </div>
        </div>

        {/* CARD 5: STOK HABIS */}
        <div className="responsive-kpi-card" style={{ background: '#ffffff', padding: '1.25rem 1.35rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="kpi-icon" style={{ width: '46px', height: '46px', borderRadius: '14px', background: '#fff1f2', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <PackageX size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stok Habis</div>
            <div className="kpi-value" style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>{outOfStockCount} <span style={{ fontSize: '0.775rem', fontWeight: 700, color: '#e11d48' }}>Habis</span></div>
          </div>
        </div>
      </div>

      {/* 2. UNIFIED ACTION TOOLBAR CARD BAR (REFRESH & ADD PRODUCT) */}
      <div className="responsive-action-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ padding: '0.45rem', borderRadius: '10px', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a' }}>Katalog Produk Master</div>
            <div style={{ fontSize: '0.775rem', fontWeight: 700, color: '#64748b' }}>Kelola daftar item produk fisik & jasa terdaftar</div>
          </div>
        </div>

        <div className="responsive-btn-group">
          <button
            onClick={loadData}
            disabled={loading}
            style={{
              padding: '0.6rem 1.15rem',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              transition: 'all 0.15s ease',
            }}
          >
            <RefreshCw size={15} className={loading ? 'spinning' : ''} color="#4f46e5" />
            Refresh Data
          </button>

          <RoleGuard userRole={currentUser.role} allow={['OWNER']}>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
                transition: 'all 0.15s ease',
              }}
            >
              <PlusCircle size={17} />
              + Tambah Produk Master Baru
            </button>
          </RoleGuard>
        </div>
      </div>

      {/* 3. MAIN DASHBOARD CONTENT GRID (LEFT: MAIN TABLE/GRID | RIGHT: ANALYTICS SIDEBAR) */}
      <div className="responsive-main-grid">
        {/* LEFT COLUMN: PRODUCT LIST TABLE & CONTROLS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>
          {/* CONTROL TOOLBAR CARD */}
          <div style={{ background: '#ffffff', borderRadius: '22px', border: '1px solid #e2e8f0', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            {/* Top Toolbar Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              {/* Search Box */}
              <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Cari nama produk, ID, atau kategori..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem 0.65rem 2.6rem',
                    borderRadius: '14px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    outline: 'none',
                    background: '#f8fafc',
                  }}
                />
              </div>

              {/* View Mode & Page Size Switcher */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.25rem', borderRadius: '12px' }}>
                  <button
                    onClick={() => setViewMode('table')}
                    title="Tampilan Tabel"
                    style={{
                      padding: '0.45rem 0.75rem',
                      borderRadius: '9px',
                      border: 'none',
                      background: viewMode === 'table' ? '#ffffff' : 'transparent',
                      color: viewMode === 'table' ? '#0f172a' : '#64748b',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.8rem',
                    }}
                  >
                    <List size={16} /> Table
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    title="Tampilan Grid"
                    style={{
                      padding: '0.45rem 0.75rem',
                      borderRadius: '9px',
                      border: 'none',
                      background: viewMode === 'grid' ? '#ffffff' : 'transparent',
                      color: viewMode === 'grid' ? '#0f172a' : '#64748b',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.8rem',
                    }}
                  >
                    <LayoutGrid size={16} /> Grid
                  </button>
                </div>

                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    color: '#334155',
                    background: '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  <option value={5}>5 / hlm</option>
                  <option value={10}>10 / hlm</option>
                  <option value={20}>20 / hlm</option>
                  <option value={50}>50 / hlm</option>
                </select>
              </div>
            </div>

            {/* Filter Pills Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 800, color: '#64748b', marginRight: '0.25rem' }}>
                <Filter size={14} /> Bidang Usaha:
              </div>

              <button
                onClick={() => { setSelectedUnit('ALL'); setCurrentPage(1); }}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: selectedUnit === 'ALL' ? '#0f172a' : '#f1f5f9',
                  color: selectedUnit === 'ALL' ? '#ffffff' : '#64748b',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                Semua Unit
              </button>

              <button
                onClick={() => { setSelectedUnit('FC_PRINT'); setCurrentPage(1); }}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: selectedUnit === 'FC_PRINT' ? '#4f46e5' : '#f1f5f9',
                  color: selectedUnit === 'FC_PRINT' ? '#ffffff' : '#64748b',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                📄 FC / Printing
              </button>

              <button
                onClick={() => { setSelectedUnit('FNB'); setCurrentPage(1); }}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: selectedUnit === 'FNB' ? '#059669' : '#f1f5f9',
                  color: selectedUnit === 'FNB' ? '#ffffff' : '#64748b',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                🍧 F&B Store
              </button>

              <div style={{ height: '20px', width: '1px', background: '#e2e8f0', margin: '0 0.3rem' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 800, color: '#64748b', marginRight: '0.25rem' }}>
                Pengaturan Stok:
              </div>

              <button
                onClick={() => { setSelectedStockFilter('ALL'); setCurrentPage(1); }}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: selectedStockFilter === 'ALL' ? '#334155' : '#f1f5f9',
                  color: selectedStockFilter === 'ALL' ? '#ffffff' : '#64748b',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                Semua
              </button>

              <button
                onClick={() => { setSelectedStockFilter('PHYSICAL'); setCurrentPage(1); }}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: selectedStockFilter === 'PHYSICAL' ? '#059669' : '#f1f5f9',
                  color: selectedStockFilter === 'PHYSICAL' ? '#ffffff' : '#64748b',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                Fisik (Kelola Stok)
              </button>

              <button
                onClick={() => { setSelectedStockFilter('SERVICE'); setCurrentPage(1); }}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: selectedStockFilter === 'SERVICE' ? '#7c3aed' : '#f1f5f9',
                  color: selectedStockFilter === 'SERVICE' ? '#ffffff' : '#64748b',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                Jasa (Tanpa Stok)
              </button>
            </div>
          </div>

          {/* PRODUCT DATA CONTAINER (TABLE / GRID / EMPTY STATE) */}
          <div style={{ background: '#ffffff', borderRadius: '22px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748b' }}>
                <RefreshCw size={28} className="spinning" style={{ marginBottom: '0.75rem', color: '#4f46e5' }} />
                <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Memuat Katalog Produk Master...</div>
              </div>
            ) : error ? (
              <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#dc2626' }}>
                <XCircle size={32} style={{ marginBottom: '0.5rem' }} />
                <div style={{ fontWeight: 800, fontSize: '1rem' }}>{error}</div>
                <button onClick={loadData} style={{ marginTop: '1rem', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #dc2626', background: '#fef2f2', color: '#dc2626', fontWeight: 700, cursor: 'pointer' }}>
                  Coba Lagi
                </button>
              </div>
            ) : products.length === 0 ? (
              /* DYNAMIC REAL-TIME EMPTY DATABASE STATE */
              <div style={{ padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#f1f5f9', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={36} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                    Belum Ada Produk Terdaftar di Database
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, maxWidth: '420px', lineHeight: 1.5 }}>
                    Katalog master produk fisik maupun jasa masih kosong secara real-time. Klik tombol di bawah untuk mendaftarkan barang pertama.
                  </p>
                </div>
                <RoleGuard userRole={currentUser.role} allow={['OWNER']}>
                  <button
                    onClick={() => setShowAddModal(true)}
                    style={{
                      padding: '0.65rem 1.25rem',
                      borderRadius: '12px',
                      border: 'none',
                      background: '#4f46e5',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginTop: '0.5rem',
                    }}
                  >
                    <PlusCircle size={16} /> + Tambah Produk Master Baru
                  </button>
                </RoleGuard>
              </div>
            ) : filteredProducts.length === 0 ? (
              /* NO MATCH SEARCH RESULT */
              <div style={{ padding: '3.5rem 2rem', textAlign: 'center', color: '#64748b' }}>
                <Search size={32} color="#cbd5e1" style={{ marginBottom: '0.5rem' }} />
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>Produk Tidak Ditemukan</div>
                <div style={{ fontSize: '0.825rem', marginTop: '0.25rem' }}>Tidak ada item yang sesuai dengan kata kunci atau filter terpilih.</div>
              </div>
            ) : viewMode === 'table' ? (
              /* TABLE VIEW MODE */
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--accent-bg, #f8fafc)', borderBottom: '2px solid #e2e8f0', color: 'var(--color-primary, #0f172a)', fontSize: '0.775rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <th style={{ padding: '0.9rem 1.25rem' }}>ID Produk</th>
                      <th style={{ padding: '0.9rem 1.25rem' }}>Nama Item Master</th>
                      <th style={{ padding: '0.9rem 1.25rem' }}>Unit Usaha</th>
                      <th style={{ padding: '0.9rem 1.25rem' }}>Kategori</th>
                      <th style={{ padding: '0.9rem 1.25rem' }}>Harga Jual</th>
                      <th style={{ padding: '0.9rem 1.25rem' }}>Pengaturan Stok</th>
                      <th style={{ padding: '0.9rem 1.25rem' }}>Status</th>
                      <th style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProducts.map((p) => {
                      const catName = categoryMap.get(p.category_id) || 'Kategori Lain';
                      return (
                        <tr key={p.product_id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}>
                          <td style={{ padding: '1rem 1.25rem', color: '#64748b', fontSize: '0.8rem', fontFamily: 'monospace', fontWeight: 700 }}>
                            {p.product_id}
                          </td>
                          <td style={{ padding: '1rem 1.25rem', fontWeight: 800, color: '#0f172a' }}>
                            {p.product_name}
                          </td>
                          <td style={{ padding: '1rem 1.25rem' }}>
                            <span
                              style={{
                                padding: '0.25rem 0.65rem',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                background: p.business_unit === 'FC_PRINT' ? '#e0e7ff' : '#d1fae5',
                                color: p.business_unit === 'FC_PRINT' ? '#3730a3' : '#065f46',
                              }}
                            >
                              {p.business_unit === 'FC_PRINT' ? 'FC / Printing' : 'F&B Store'}
                            </span>
                          </td>
                          <td style={{ padding: '1rem 1.25rem', color: '#475569', fontWeight: 700, fontSize: '0.825rem' }}>
                            <span style={{ background: '#f1f5f9', padding: '0.25rem 0.6rem', borderRadius: '6px' }}>
                              {catName}
                            </span>
                          </td>
                          <td style={{ padding: '1rem 1.25rem', fontWeight: 900, color: '#0f172a', fontSize: '0.9rem' }}>
                            {formatRupiah(p.selling_price)}
                          </td>
                          <td style={{ padding: '1rem 1.25rem' }}>
                            {p.manage_stock ? (
                              <span style={{ color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.775rem', fontWeight: 800, background: '#ecfdf5', padding: '0.25rem 0.6rem', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                                <CheckCircle2 size={14} /> Fisik (Kelola Stok)
                              </span>
                            ) : (
                              <span style={{ color: '#7c3aed', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.775rem', fontWeight: 800, background: '#f5f3ff', padding: '0.25rem 0.6rem', borderRadius: '8px', border: '1px solid #ddd6fe' }}>
                                <XCircle size={14} /> Jasa (Tanpa Stok)
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '1rem 1.25rem' }}>
                            <span style={{ color: '#16a34a', fontWeight: 800, fontSize: '0.775rem', background: '#dcfce7', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                              AKTIF
                            </span>
                          </td>
                          <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                            <RoleGuard userRole={currentUser.role} allow={['OWNER']}>
                              <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <button
                                  onClick={() => handleOpenEditModal(p)}
                                  title="Edit Detail Produk"
                                  style={{
                                    padding: '0.4rem 0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    background: '#ffffff',
                                    color: '#334155',
                                    fontSize: '0.775rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                  }}
                                >
                                  <Edit3 size={14} color="#4f46e5" /> Edit
                                </button>

                                <button
                                  onClick={() => setDeleteConfirmItem(p)}
                                  title="Hapus Produk Master"
                                  style={{
                                    padding: '0.4rem 0.65rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: '#fee2e2',
                                    color: '#dc2626',
                                    fontSize: '0.775rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  <Trash2 size={14} /> Hapus
                                </button>
                              </div>
                            </RoleGuard>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* GRID VIEW MODE */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem', padding: '1.25rem' }}>
                {paginatedProducts.map((p) => {
                  const catName = categoryMap.get(p.category_id) || 'Kategori Lain';
                  return (
                    <div
                      key={p.product_id}
                      style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.65rem' }}>
                          <span
                            style={{
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              background: p.business_unit === 'FC_PRINT' ? '#e0e7ff' : '#d1fae5',
                              color: p.business_unit === 'FC_PRINT' ? '#3730a3' : '#065f46',
                            }}
                          >
                            {p.business_unit === 'FC_PRINT' ? 'FC / Printing' : 'F&B Store'}
                          </span>
                          <span style={{ fontSize: '0.725rem', color: '#64748b', fontFamily: 'monospace', fontWeight: 700 }}>{p.product_id}</span>
                        </div>

                        <h4 style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.35rem 0' }}>{p.product_name}</h4>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, marginBottom: '0.75rem' }}>
                          Kategori: <span style={{ color: '#334155' }}>{catName}</span>
                        </div>

                        <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#4f46e5' }}>
                          {formatRupiah(p.selling_price)}
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {p.manage_stock ? (
                          <span style={{ color: '#059669', fontSize: '0.725rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CheckCircle2 size={13} /> Kelola Stok
                          </span>
                        ) : (
                          <span style={{ color: '#7c3aed', fontSize: '0.725rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <XCircle size={13} /> Barang Jasa
                          </span>
                        )}

                        <RoleGuard userRole={currentUser.role} allow={['OWNER']}>
                          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              style={{
                                padding: '0.35rem 0.75rem',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                background: '#ffffff',
                                color: '#334155',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                              }}
                            >
                              <Edit3 size={13} color="#4f46e5" /> Edit
                            </button>

                            <button
                              onClick={() => setDeleteConfirmItem(p)}
                              title="Hapus Produk Master"
                              style={{
                                padding: '0.35rem 0.65rem',
                                borderRadius: '8px',
                                border: 'none',
                                background: '#fee2e2',
                                color: '#dc2626',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                              }}
                            >
                              <Trash2 size={13} /> Hapus
                            </button>
                          </div>
                        </RoleGuard>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* FOOTER PAGINATION BAR */}
            {filteredProducts.length > 0 && (
              <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ fontSize: '0.825rem', color: '#64748b', fontWeight: 700 }}>
                  Menampilkan <strong style={{ color: '#0f172a' }}>{paginatedProducts.length}</strong> dari <strong style={{ color: '#0f172a' }}>{filteredProducts.length}</strong> produk
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    style={{
                      padding: '0.4rem 0.6rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: currentPage === 1 ? '#cbd5e1' : '#334155',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <span style={{ fontSize: '0.825rem', fontWeight: 800, color: '#334155', padding: '0 0.5rem' }}>
                    Halaman {currentPage} dari {totalPages}
                  </span>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    style={{
                      padding: '0.4rem 0.6rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: currentPage === totalPages ? '#cbd5e1' : '#334155',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ANALYTICS & SUMMARY SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* WIDGET 1: DONUT CHART DISTRIBUSI UNIT USAHA */}
          <div style={{ background: '#ffffff', borderRadius: '22px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieChart size={18} color="#4f46e5" />
              Distribusi Unit Usaha
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
              {/* SVG Donut Chart */}
              <div style={{ position: 'relative', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="130" height="130" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                  {totalProductCount === 0 ? (
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#e2e8f0" strokeWidth="14" />
                  ) : (
                    <>
                      {/* Segment 1: FC_PRINT */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#4f46e5"
                        strokeWidth="14"
                        strokeDasharray={`${fcStrokeDash} ${circumference}`}
                        strokeDashoffset="0"
                      />
                      {/* Segment 2: FNB */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#10b981"
                        strokeWidth="14"
                        strokeDasharray={`${fnbStrokeDash} ${circumference}`}
                        strokeDashoffset={`-${fcStrokeDash}`}
                      />
                    </>
                  )}
                </svg>

                <div style={{ position: 'absolute', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{totalProductCount}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, marginTop: '0.15rem' }}>Total Item</div>
                </div>
              </div>

              {/* Legend Items */}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#4f46e5' }} />
                    <span style={{ fontWeight: 700, color: '#334155' }}>FC / Printing & ATK</span>
                  </div>
                  <span style={{ fontWeight: 900, color: '#0f172a' }}>{fcProductCount} ({fcPercent}%)</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#10b981' }} />
                    <span style={{ fontWeight: 700, color: '#334155' }}>Food & Beverage</span>
                  </div>
                  <span style={{ fontWeight: 900, color: '#0f172a' }}>{fnbProductCount} ({fnbPercent}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* WIDGET 2: RINGKASAN STOK FISIK VS JASA */}
          <div style={{ background: '#ffffff', borderRadius: '22px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} color="#059669" />
              Tipe Pengaturan Barang
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                  <span style={{ color: '#059669' }}>📦 Barang Fisik (Stok)</span>
                  <span style={{ color: '#0f172a' }}>{physicalProductCount} pcs</span>
                </div>
                <div style={{ height: '8px', borderRadius: '4px', background: '#e2e8f0', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      background: '#059669',
                      width: `${totalProductCount > 0 ? (physicalProductCount / totalProductCount) * 100 : 0}%`,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                  <span style={{ color: '#7c3aed' }}>📄 Barang Jasa (Tanpa Stok)</span>
                  <span style={{ color: '#0f172a' }}>{serviceProductCount} pcs</span>
                </div>
                <div style={{ height: '8px', borderRadius: '4px', background: '#e2e8f0', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      background: '#7c3aed',
                      width: `${totalProductCount > 0 ? (serviceProductCount / totalProductCount) * 100 : 0}%`,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* WIDGET 3: TOP KATEGORI PRODUK */}
          <div style={{ background: '#ffffff', borderRadius: '22px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Tag size={18} color="#d97706" />
              Breakdown Kategori
            </h3>

            {categoryDistribution.length === 0 ? (
              <div style={{ color: '#64748b', fontSize: '0.825rem', textAlign: 'center', padding: '1rem 0' }}>
                Belum ada data kategori terdaftar
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {categoryDistribution.map((cat, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                      <span style={{ fontWeight: 800, color: '#334155' }}>{cat.name}</span>
                      <span style={{ fontWeight: 900, color: '#0f172a' }}>{cat.count} item ({cat.percentage}%)</span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '3px', background: '#f1f5f9', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          background: '#f59e0b',
                          width: `${cat.percentage}%`,
                          borderRadius: '3px',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. MODAL TAMBAH PRODUK MASTER BARU (OWNER ONLY) */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: '520px', background: '#ffffff', borderRadius: '24px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} color="#4f46e5" />
                Tambah Produk Master Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '1.2rem', fontWeight: 800, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                  Pilih Bidang Usaha:
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '0.3rem', borderRadius: '12px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setNewBusinessUnit('FNB');
                      const fnbCats = categories.filter((c) => c.business_unit === 'FNB');
                      setNewCategoryId(fnbCats.length > 0 ? fnbCats[0].category_id : '');
                    }}
                    style={{
                      flex: 1,
                      padding: '0.65rem 0.5rem',
                      borderRadius: '9px',
                      border: 'none',
                      background: newBusinessUnit === 'FNB' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
                      color: newBusinessUnit === 'FNB' ? '#ffffff' : '#475569',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      boxShadow: newBusinessUnit === 'FNB' ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    🍧 Food & Beverage (FNB)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewBusinessUnit('FC_PRINT');
                      const fcCats = categories.filter((c) => c.business_unit === 'FC_PRINT');
                      setNewCategoryId(fcCats.length > 0 ? fcCats[0].category_id : '');
                    }}
                    style={{
                      flex: 1,
                      padding: '0.65rem 0.5rem',
                      borderRadius: '9px',
                      border: 'none',
                      background: newBusinessUnit === 'FC_PRINT' ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : 'transparent',
                      color: newBusinessUnit === 'FC_PRINT' ? '#ffffff' : '#475569',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      boxShadow: newBusinessUnit === 'FC_PRINT' ? '0 2px 8px rgba(37, 99, 235, 0.3)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    📄 FC / Printing & ATK
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                  Kategori Produk
                </label>
                <select
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.875rem', fontWeight: 700, outline: 'none' }}
                  required
                >
                  <option value="">-- Pilih Kategori Produk --</option>
                  {categories
                    .filter((c) => c.business_unit === newBusinessUnit)
                    .map((c) => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.category_name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                  Nama Produk / Jasa
                </label>
                <input
                  type="text"
                  placeholder="misal: Cetak Stiker A3 / Seblak Pedas Komplit"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                  Harga Jual (Rp)
                </label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none' }}
                  min={1}
                  required
                />
              </div>

              <div style={{ padding: '0.85rem 1rem', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                  type="checkbox"
                  id="manageStockCheck"
                  checked={newManageStock}
                  onChange={(e) => setNewManageStock(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="manageStockCheck" style={{ fontSize: '0.825rem', fontWeight: 800, color: '#0f172a', cursor: 'pointer' }}>
                  Kelola Stok Fisik (Uncheck jika berupa Jasa / Non-Fisik)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '0.65rem 1.1rem', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  style={{ padding: '0.65rem 1.25rem', borderRadius: '12px', border: 'none', background: '#4f46e5', color: '#ffffff', fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}
                >
                  {formLoading ? 'Menyimpan...' : 'Simpan Produk Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL EDIT PRODUK MASTER (OWNER ONLY) */}
      {showEditModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: '520px', background: '#ffffff', borderRadius: '24px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit3 size={20} color="#4f46e5" />
                Edit Detail Produk Master
              </h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '1.2rem', fontWeight: 800, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                  Bidang Usaha (Unit)
                </label>
                <select
                  value={editBusinessUnit}
                  onChange={(e) => {
                    setEditBusinessUnit(e.target.value as BusinessUnit);
                  }}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.875rem', fontWeight: 700, outline: 'none' }}
                >
                  <option value="FC_PRINT">📄 FC_PRINT (Fotokopi & Printing)</option>
                  <option value="FNB">🍧 FNB (Food & Beverage)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                  Kategori Produk
                </label>
                <select
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.875rem', fontWeight: 700, outline: 'none' }}
                  required
                >
                  <option value="">-- Pilih Kategori Produk --</option>
                  {categories
                    .filter((c) => c.business_unit === editBusinessUnit)
                    .map((c) => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.category_name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                  Nama Produk / Jasa
                </label>
                <input
                  type="text"
                  value={editProductName}
                  onChange={(e) => setEditProductName(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                  Harga Jual (Rp)
                </label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none' }}
                  min={1}
                  required
                />
              </div>

              <div style={{ padding: '0.85rem 1rem', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                  type="checkbox"
                  id="editManageStockCheck"
                  checked={editManageStock}
                  onChange={(e) => setEditManageStock(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="editManageStockCheck" style={{ fontSize: '0.825rem', fontWeight: 800, color: '#0f172a', cursor: 'pointer' }}>
                  Kelola Stok Fisik (Uncheck jika berupa Jasa / Non-Fisik)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{ padding: '0.65rem 1.1rem', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  style={{ padding: '0.65rem 1.25rem', borderRadius: '12px', border: 'none', background: '#4f46e5', color: '#ffffff', fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}
                >
                  {formLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL KONFIRMASI HAPUS PRODUK MASTER (OWNER ONLY) */}
      {deleteConfirmItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: '440px', background: '#ffffff', borderRadius: '24px', padding: '1.75rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #fecaca', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto', border: '1px solid #fecaca' }}>
              <AlertTriangle size={28} />
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              Hapus Produk Master?
            </h3>

            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 1.25rem 0', lineHeight: 1.5 }}>
              Apakah Anda yakin ingin menghapus produk <strong style={{ color: '#0f172a' }}>"{deleteConfirmItem.product_name}"</strong> (ID: {deleteConfirmItem.product_id})?
              <br />
              <span style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: 700, marginTop: '0.4rem', display: 'block' }}>
                ⚠️ Tindakan ini akan menghapus data produk secara permanen dari katalog master database.
              </span>
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setDeleteConfirmItem(null)}
                style={{
                  flex: 1,
                  padding: '0.65rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#334155',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Batal
              </button>

              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDeleteProduct}
                style={{
                  flex: 1,
                  padding: '0.65rem 1rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
                }}
              >
                {deleteLoading ? (
                  <>
                    <RefreshCw size={15} className="spinning" /> Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 size={15} /> Ya, Hapus Produk
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ActionLoadingModal
        isOpen={formLoading}
        message="Memproses data produk master ke server backend POS..."
        submessage="Mencegah duplikasi data & memperbarui database..."
      />
    </div>
  );
};

export default ProductsPage;
