import React, { useState, useEffect } from 'react';
import {
  Package,
  RefreshCw,
  Search,
  PlusCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  LayoutGrid,
  List,
  DollarSign,
  Filter,
  Eye,
  BarChart2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { apiService } from '../services/api';
import { User, Category, Product } from '../types';
import { formatRupiah, formatWaktuIndo } from '../utils/formatters';
import { ActionLoadingModal } from '../components/common/ActionLoadingModal';


interface StockItem {
  stock_id: string;
  product_id: string;
  product_name: string;
  business_unit: string;
  current_stock: number;
  last_updated: string;
  manage_stock: boolean;
  category_name?: string;
  category_id?: string;
  selling_price?: number;
}

interface StockPageProps {
  currentUser: User;
  onTriggerToast?: (type: 'success' | 'danger' | 'info' | 'warning', title: string, message: string) => void;
}

export const StockPage: React.FC<StockPageProps> = ({ currentUser, onTriggerToast }) => {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productsMap, setProductsMap] = useState<Map<string, Product>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('TABLE');

  // Filter States
  const [selectedUnit, setSelectedUnit] = useState<'ALL' | 'FC_PRINT' | 'FNB'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'SAFE' | 'LOW' | 'OUT'>('ALL');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('ALL');

  // Pagination States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Modal 1: Edit/Restock Stock Quantity Modal State (Penyesuaian Stok)
  const [editingStock, setEditingStock] = useState<StockItem | null>(null);
  const [newStockQty, setNewStockQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Modal 2: Create New Product & Stock Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newBusinessUnit, setNewBusinessUnit] = useState<'FC_PRINT' | 'FNB'>('FNB');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newSellingPrice, setNewSellingPrice] = useState<number>(5000);
  const [newInitialStock, setNewInitialStock] = useState<number>(10);
  const [createLoading, setCreateLoading] = useState(false);

  // Modal 3: Edit Product Details Modal State (Koreksi Detail Produk)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdPrice, setEditProdPrice] = useState<number>(0);
  const [editProdUnit, setEditProdUnit] = useState<'FC_PRINT' | 'FNB'>('FNB');
  const [editProdCatId, setEditProdCatId] = useState('');
  const [updateProdLoading, setUpdateProdLoading] = useState(false);
  const [recentMovements, setRecentMovements] = useState<any[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [stocksData, catsData, prodsData, auditLogsData] = await Promise.all([
        apiService.getStocks(),
        apiService.getCategories(),
        apiService.getProducts(),
        apiService.getAuditLogs().catch(() => []),
      ]);

      // Merge selling price & category info from products into stocks
      const pMap = new Map<string, Product>();
      (prodsData || []).forEach((p) => pMap.set(p.product_id, p));
      setProductsMap(pMap);

      const mergedStocks = (stocksData || []).map((s) => {
        const prod = pMap.get(s.product_id);
        return {
          ...s,
          selling_price: prod ? prod.selling_price : 0,
          category_id: prod ? prod.category_id : undefined,
        };
      });

      setStocks(mergedStocks);
      setCategories(catsData || []);

      if (catsData && catsData.length > 0) {
        setNewCategoryId(catsData[0].category_id);
      }

      // Process real-time stock movements from audit logs
      if (auditLogsData && auditLogsData.length > 0) {
        const relevantLogs = auditLogsData
          .filter((l: any) =>
            l.action.includes('STOCK') ||
            l.action.includes('TRANSACTION') ||
            l.action.includes('PRODUCT')
          )
          .slice(0, 5)
          .map((l: any) => ({
            time: formatWaktuIndo(l.timestamp),
            product: l.affected_entity || 'Stok Barang',
            type: l.action.includes('TRANSACTION') ? 'Penjualan' : l.action.includes('STOCK') ? 'Koreksi Stok' : 'Produk',
            qty: l.details.includes('+') ? '+' : l.details.includes('-') ? '-' : '•',
            details: l.details,
            warehouse: 'Gudang Utama',
            user: l.username ? `User: ${l.username}` : 'Kasir',
          }));
        setRecentMovements(relevantLogs);
      } else {
        setRecentMovements([]);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data stok barang');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Polling 5-detik untuk pembaruan stok otomatis dari database
    const interval = setInterval(() => {
      apiService.getStocks().then((stocksData) => {
        if (stocksData) {
          apiService.getProducts().then((prodsData) => {
            if (prodsData) {
              const pMap = new Map<string, Product>();
              (prodsData || []).forEach((p) => pMap.set(p.product_id, p));
              setProductsMap(pMap);

              const mergedStocks = (stocksData || []).map((s) => {
                const prod = pMap.get(s.product_id);
                return {
                  ...s,
                  selling_price: prod ? prod.selling_price : 0,
                  category_id: prod ? prod.category_id : undefined,
                };
              });
              setStocks(mergedStocks);
            }
          }).catch(() => {});
        }
      }).catch(() => {});
    }, 5000);

    // SSE Realtime listener untuk event stok
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
      // Fallback to polling interval
    }

    return () => {
      clearInterval(interval);
      if (sse) sse.close();
    };
  }, []);

  // Modal 1 Trigger: Koreksi / Penyesuaian Stok
  const handleOpenEditModal = (item: StockItem) => {
    setEditingStock(item);
    setNewStockQty(item.current_stock);
    setAdjustReason('Koreksi / Penyesuaian Stok Shift');
  };

  // Quick Add Direct Restock (e.g. +5, +10)
  const handleDirectQuickAdd = async (item: StockItem, addQty: number) => {
    const updatedQty = item.current_stock + addQty;
    try {
      await apiService.updateStock(item.product_id, updatedQty);
      if (onTriggerToast) {
        onTriggerToast('success', 'Stok Diperbarui', `Stok "${item.product_name}" +${addQty} (Total: ${updatedQty} pcs)`);
      }
      await loadData();
    } catch (err: any) {
      if (onTriggerToast) onTriggerToast('danger', 'Gagal Restock', err.message || 'Gagal mengubah stok');
    }
  };

  // Submit Handler Modal 1: Simpan Penyesuaian Stok
  const handleSaveStockUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStock) return;

    try {
      setSubmitLoading(true);
      setError(null);
      await apiService.updateStock(editingStock.product_id, Number(newStockQty));
      if (onTriggerToast) {
        onTriggerToast(
          'success',
          'Penyesuaian Stok Berhasil',
          `Stok "${editingStock.product_name}" dikoreksi menjadi ${newStockQty} pcs.`
        );
      }
      setEditingStock(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui stok barang');
      if (onTriggerToast) onTriggerToast('danger', 'Gagal Koreksi Stok', err.message || 'Gagal mengubah stok');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleQuickAddModal = (addedQty: number) => {
    setNewStockQty((prev) => Math.max(0, prev + addedQty));
  };

  // Modal 3 Trigger: Koreksi Detail Barang (Nama, Harga, Kategori)
  const handleOpenEditProductModal = (item: StockItem) => {
    const prod = productsMap.get(item.product_id);
    if (prod) {
      setEditingProduct(prod);
      setEditProdName(prod.product_name);
      setEditProdPrice(prod.selling_price);
      setEditProdUnit(prod.business_unit);
      setEditProdCatId(prod.category_id);
    } else {
      setEditingProduct({
        product_id: item.product_id,
        product_name: item.product_name,
        business_unit: item.business_unit as any,
        category_id: item.category_id || '',
        selling_price: item.selling_price || 0,
        manage_stock: true,
        is_active: true,
      });
      setEditProdName(item.product_name);
      setEditProdPrice(item.selling_price || 0);
      setEditProdUnit(item.business_unit as any);
      setEditProdCatId(item.category_id || '');
    }
  };

  // Submit Handler Modal 3: Simpan Koreksi Detail Barang
  const handleSaveProductDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      setUpdateProdLoading(true);
      setError(null);
      await apiService.updateProduct(editingProduct.product_id, {
        product_name: editProdName.trim(),
        selling_price: Number(editProdPrice),
        business_unit: editProdUnit,
        category_id: editProdCatId || undefined,
      });

      if (onTriggerToast) {
        onTriggerToast(
          'success',
          'Detail Produk Dikoreksi',
          `Informasi barang "${editProdName}" berhasil diperbarui.`
        );
      }

      setEditingProduct(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Gagal mengedit detail barang');
      if (onTriggerToast) onTriggerToast('danger', 'Gagal Edit Produk', err.message || 'Terjadi kesalahan saat simpan detail barang');
    } finally {
      setUpdateProdLoading(false);
    }
  };

  // Submit Handler Modal 2: Membuat Produk & Stok Baru
  const handleCreateProductAndStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim() || newSellingPrice <= 0 || newInitialStock < 0) {
      if (onTriggerToast) onTriggerToast('danger', 'Input Tidak Valid', 'Mohon lengkapi seluruh field dengan benar.');
      return;
    }

    try {
      setCreateLoading(true);
      setError(null);

      // 1. Create Product
      const newProduct = await apiService.createProduct({
        product_name: newProductName.trim(),
        business_unit: newBusinessUnit,
        category_id: newCategoryId || (newBusinessUnit === 'FC_PRINT' ? 'cat-fc-001' : 'cat-fnb-001'),
        selling_price: Number(newSellingPrice),
        manage_stock: true,
        is_active: true,
      });

      // 2. Set Initial Stock
      if (newProduct && newProduct.product_id) {
        await apiService.updateStock(newProduct.product_id, Number(newInitialStock));
      }

      if (onTriggerToast) {
        onTriggerToast('success', 'Produk & Stok Berhasil Dibuat', `Item "${newProductName}" telah ditambahkan ke sistem stok.`);
      }

      // Reset form
      setNewProductName('');
      setNewSellingPrice(5000);
      setNewInitialStock(10);
      setShowCreateModal(false);

      await loadData();
    } catch (err: any) {
      setError(err.message || 'Gagal membuat produk & stok baru');
      if (onTriggerToast) onTriggerToast('danger', 'Gagal Simpan', err.message || 'Terjadi kesalahan saat simpan produk');
    } finally {
      setCreateLoading(false);
    }
  };

  // Helper Kategori
  const getItemCategory = (item: StockItem): string => {
    if (item.category_name) return item.category_name;
    const name = item.product_name.toLowerCase();
    if (name.includes('es krim') || name.includes('aice') || name.includes('walls')) return 'Es Krim';
    if (name.includes('gorengan') || name.includes('tempe') || name.includes('tahu')) return 'Gorengan';
    if (name.includes('minuman') || name.includes('teh') || name.includes('kopi') || name.includes('es')) return 'Minuman';
    if (name.includes('seblak')) return 'Seblak';
    if (name.includes('snack') || name.includes('keripik') || name.includes('roti') || name.includes('makanan')) return 'Makanan & Snack';
    if (name.includes('kertas') || name.includes('hvs') || name.includes('atk') || name.includes('pulpen')) return 'ATK & Persediaan';
    if (name.includes('print') || name.includes('foto') || name.includes('copy') || name.includes('laminasi')) return 'Fotokopi & Print';
    return item.business_unit === 'FC_PRINT' ? 'ATK & Persediaan' : 'Makanan & Snack';
  };

  // Filtering Logic
  const filteredStocks = stocks.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || item.product_name.toLowerCase().includes(q) || item.product_id.toLowerCase().includes(q);
    if (!matchesSearch) return false;

    if (selectedUnit !== 'ALL' && item.business_unit !== selectedUnit) return false;

    if (selectedCategory !== 'ALL') {
      if (selectedCategory === 'FC_PRINT') {
        if (item.business_unit !== 'FC_PRINT') return false;
      } else if (selectedCategory === 'FNB') {
        if (item.business_unit !== 'FNB') return false;
      } else {
        const cat = getItemCategory(item);
        if (cat !== selectedCategory) return false;
      }
    }

    if (filterStatus === 'SAFE') return item.current_stock >= 10;
    if (filterStatus === 'LOW') return item.current_stock > 0 && item.current_stock < 10;
    if (filterStatus === 'OUT') return item.current_stock === 0;

    return true;
  });

  const lowStockCount = stocks.filter((s) => s.current_stock > 0 && s.current_stock < 10).length;
  const outOfStockCount = stocks.filter((s) => s.current_stock === 0).length;
  const safeStockCount = stocks.filter((s) => s.current_stock >= 10).length;

  const alertStocks = React.useMemo(() => {
    return stocks.filter((s) => s.current_stock < 10).slice(0, 5);
  }, [stocks]);
  const totalValuation = stocks.reduce((acc, s) => acc + (s.current_stock * (s.selling_price || 0)), 0);

  const totalItems = filteredStocks.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStocks = filteredStocks.slice(startIndex, startIndex + itemsPerPage);

  // Category Stock Summary Aggregation (Stok per Kategori - Fully Real-time DB)
  const categoryStockSummary = React.useMemo(() => {
    if (!stocks || stocks.length === 0) return [];

    const totalPhysical = stocks.reduce((acc, s) => acc + s.current_stock, 0);
    if (totalPhysical === 0) return [];

    const catMap: Record<string, number> = {};

    stocks.forEach((item) => {
      const cat = getItemCategory(item);
      catMap[cat] = (catMap[cat] || 0) + item.current_stock;
    });

    const entries = Object.entries(catMap).map(([name, count]) => ({
      name,
      count,
      percentage: Number(((count / totalPhysical) * 100).toFixed(1)),
    }));

    entries.sort((a, b) => b.count - a.count);
    return entries.slice(0, 5);
  }, [stocks]);

  // Warehouse physical totals (Dynamic Real-time DB)
  const totalGudangUtama = React.useMemo(() => {
    return stocks.filter((s) => s.business_unit !== 'FC_PRINT').reduce((acc, s) => acc + s.current_stock, 0);
  }, [stocks]);

  const totalStorageFC = React.useMemo(() => {
    return stocks.filter((s) => s.business_unit === 'FC_PRINT').reduce((acc, s) => acc + s.current_stock, 0);
  }, [stocks]);

  const totalStorageFNB = React.useMemo(() => {
    return stocks.filter((s) => s.business_unit === 'FNB').reduce((acc, s) => acc + s.current_stock, 0);
  }, [stocks]);

  // Render SVG Donut Chart for Ringkasan Stok (Dynamic Real-time DB)
  const renderDonutChart = () => {
    const totalProd = stocks.length;

    if (totalProd === 0) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '125px', height: '125px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#e2e8f0" strokeWidth="15" />
            </svg>
            <div style={{ position: 'absolute', textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>
              Kosong
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1, minWidth: '140px', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#334155', fontWeight: 700 }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#10b981' }} />
                Aman
              </span>
              <span style={{ fontWeight: 800, color: '#0f172a' }}>0 <span style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 600 }}>(0%)</span></span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#334155', fontWeight: 700 }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#f59e0b' }} />
                Menipis
              </span>
              <span style={{ fontWeight: 800, color: '#0f172a' }}>0 <span style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 600 }}>(0%)</span></span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#334155', fontWeight: 700 }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ef4444' }} />
                Habis
              </span>
              <span style={{ fontWeight: 800, color: '#0f172a' }}>0 <span style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 600 }}>(0%)</span></span>
            </div>
          </div>
        </div>
      );
    }

    const safeCount = safeStockCount;
    const lowCount = lowStockCount;
    const outCount = outOfStockCount;

    const safePct = ((safeCount / totalProd) * 100).toFixed(1);
    const lowPct = ((lowCount / totalProd) * 100).toFixed(1);
    const outPct = ((outCount / totalProd) * 100).toFixed(1);

    const C = 251.327; // 2 * Math.PI * 40
    const safeDash = (safeCount / totalProd) * C;
    const lowDash = (lowCount / totalProd) * C;
    const outDash = (outCount / totalProd) * C;

    let currOffset = 0;
    const safeOffset = -currOffset;
    currOffset += safeDash;
    const lowOffset = -currOffset;
    currOffset += lowDash;
    const outOffset = -currOffset;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '125px', height: '125px', flexShrink: 0 }}>
          <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="15" />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#10b981"
              strokeWidth="15"
              strokeDasharray={`${safeDash} ${C - safeDash}`}
              strokeDashoffset={safeOffset}
              style={{ transition: 'all 0.5s ease' }}
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#f59e0b"
              strokeWidth="15"
              strokeDasharray={`${lowDash} ${C - lowDash}`}
              strokeDashoffset={lowOffset}
              style={{ transition: 'all 0.5s ease' }}
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#ef4444"
              strokeWidth="15"
              strokeDasharray={`${outDash} ${C - outDash}`}
              strokeDashoffset={outOffset}
              style={{ transition: 'all 0.5s ease' }}
            />
          </svg>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1, minWidth: '140px', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#334155', fontWeight: 700 }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#10b981' }} />
              Aman
            </span>
            <span style={{ fontWeight: 800, color: '#0f172a' }}>{safeCount} <span style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 600 }}>({safePct}%)</span></span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#334155', fontWeight: 700 }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#f59e0b' }} />
              Menipis
            </span>
            <span style={{ fontWeight: 800, color: '#0f172a' }}>{lowCount} <span style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 600 }}>({lowPct}%)</span></span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#334155', fontWeight: 700 }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ef4444' }} />
              Habis
            </span>
            <span style={{ fontWeight: 800, color: '#0f172a' }}>{outCount} <span style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 600 }}>({outPct}%)</span></span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', paddingBottom: '2.5rem' }}>
      {error && (
        <div style={{ padding: '1rem 1.25rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '16px', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle size={20} color="#dc2626" />
          <span>{error}</span>
        </div>
      )}      {/* 2. EXECUTIVE METRICS CARDS (4 CARDS GRID: 2x2 ON MOBILE, 4 COLS ON DESKTOP) */}
      <div className="responsive-kpi-grid">
        {/* Metric 1 */}
        <div className="responsive-kpi-card" style={{ background: '#ffffff', padding: '1.35rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>TOTAL PRODUK</span>
            <div className="kpi-icon" style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={22} />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>
            {stocks.length} <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>Items</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem', fontWeight: 600 }}>
            Terdaftar di database inventaris
          </div>
        </div>

        {/* Metric 2: Asset Valuation */}
        <div className="responsive-kpi-card" style={{ background: '#ffffff', padding: '1.35rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>NILAI STOK</span>
            <div className="kpi-icon" style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={22} />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: '1.5rem', fontWeight: 900, color: '#059669', letterSpacing: '-0.03em' }}>
            {formatRupiah(totalValuation)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem', fontWeight: 600 }}>
            Est. Nilai Aset Stok Fisik
          </div>
        </div>

        {/* Metric 3: Stok Menipis */}
        <div className="responsive-kpi-card" style={{ background: '#ffffff', padding: '1.35rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>STOK MENIPIS</span>
            <div className="kpi-icon" style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={22} />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: '1.85rem', fontWeight: 900, color: '#d97706', letterSpacing: '-0.03em' }}>
            {lowStockCount} <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>Items</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '0.35rem', fontWeight: 700 }}>
            Perlu segera disiap/restock
          </div>
        </div>

        {/* Metric 4: Stok Habis */}
        <div className="responsive-kpi-card" style={{ background: '#ffffff', padding: '1.35rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>STOK HABIS</span>
            <div className="kpi-icon" style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XCircle size={22} />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: '1.85rem', fontWeight: 900, color: '#dc2626', letterSpacing: '-0.03em' }}>
            {outOfStockCount} <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>Items</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.35rem', fontWeight: 700 }}>
            Tidak dapat ditransaksikan
          </div>
        </div>
      </div>

      {/* 2.2 TOOLBAR SEARCH & FILTER BAR (RESPONSIVE ENGINE: CLEAN STACK ON MOBILE, SINGLE ROW ON LAPTOP) */}
      <div className="responsive-toolbar-container">
        {/* Search Input Box */}
        <div className="responsive-toolbar-search" style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Cari produk, barcode, atau SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 2.2rem 0.6rem 0.85rem',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              outline: 'none',
              color: '#0f172a',
              background: '#ffffff',
              transition: 'all 0.2s ease',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)',
            }}
          />
          <Search size={16} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
        </div>

        {/* Dropdowns Group */}
        <div className="responsive-toolbar-grid-selects">
          {/* Dropdown Semua Kategori */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '0.6rem 0.85rem',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              fontSize: '0.825rem',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
              outline: 'none',
              width: '100%',
            }}
          >
            <option value="ALL">Semua Kategori</option>
            <option value="FC_PRINT">📄 FC / Printing & ATK</option>
            <option value="FNB">🍧 Food & Beverage (FNB)</option>
            <option value="Es Krim">🍨 Es Krim</option>
            <option value="Gorengan">🍢 Gorengan</option>
            <option value="Minuman">🥤 Minuman</option>
            <option value="Seblak">🍲 Seblak</option>
            <option value="Makanan & Snack">🍿 Makanan & Snack</option>
            <option value="ATK & Persediaan">✏️ ATK & Persediaan</option>
            <option value="Fotokopi & Print">📑 Fotokopi & Print</option>
          </select>

          {/* Dropdown Semua Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            style={{
              padding: '0.6rem 0.85rem',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              fontSize: '0.825rem',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
              outline: 'none',
              width: '100%',
            }}
          >
            <option value="ALL">Semua Status</option>
            <option value="SAFE">🟢 Stok Aman (≥10)</option>
            <option value="LOW">⚠️ Stok Menipis (&lt;10)</option>
            <option value="OUT">🔴 Stok Habis (0 Pcs)</option>
          </select>

          {/* Dropdown Semua Gudang */}
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            style={{
              padding: '0.6rem 0.85rem',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              fontSize: '0.825rem',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
              outline: 'none',
              width: '100%',
            }}
          >
            <option value="ALL">Semua Gudang</option>
            <option value="GUDANG_UTAMA">🏢 Gudang Utama</option>
            <option value="ETALASE">🏪 Etalase Toko</option>
            <option value="STORAGE_FC">🖨️ Storage FC / Print</option>
          </select>
        </div>

        {/* Buttons Group */}
        <div className="responsive-toolbar-actions">
          <button
            onClick={() => {
              setSelectedCategory('ALL');
              setFilterStatus('ALL');
              setSelectedWarehouse('ALL');
              setSearchQuery('');
              setSelectedUnit('ALL');
              if (onTriggerToast) onTriggerToast('info', 'Filter Direset', 'Semua filter pencarian telah dikembalikan ke kondisi awal.');
            }}
            title="Reset atau terapkan filter tambahan"
            style={{
              padding: '0.6rem 0.85rem',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: '0.825rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
          >
            <Filter size={15} color="#64748b" />
            Filter
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            style={{
              padding: '0.6rem 0.95rem',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: '0.825rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
          >
            <RefreshCw size={15} className={loading ? 'spinning' : ''} color="#2563eb" />
            Refresh
          </button>

          <button
            onClick={async () => {
              await loadData();
              if (onTriggerToast) onTriggerToast('success', 'Stok Diperbarui', 'Data stok & inventaris berhasil disinkronisasi.');
            }}
            disabled={loading}
            style={{
              padding: '0.6rem 1.1rem',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
              color: '#ffffff',
              fontSize: '0.825rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 14px rgba(217, 119, 6, 0.3)',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
          >
            <RefreshCw size={15} className={loading ? 'spinning' : ''} />
            Update Stok
          </button>

          {currentUser.role !== 'OWNER' && (
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '0.6rem 1.1rem',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#ffffff',
                fontSize: '0.825rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)',
                whiteSpace: 'nowrap',
              }}
            >
              <PlusCircle size={16} />
              + Tambah Stok
            </button>
          )}
        </div>
      </div>





      {/* ======================================================== */}
      {/* 3. MAIN DASHBOARD CONTENT GRID (LEFT: TABLE & LOGS | RIGHT: SIDEBAR ANALYTICS) */}
      {/* ======================================================== */}
      <div className="responsive-main-grid">
        {/* -------------------------------------------------------- */}
        {/* LEFT COLUMN: DAFTAR STOK TABLE + MOVEMENT LOGS + ALERTS */}
        {/* -------------------------------------------------------- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>
          {/* A. DAFTAR STOK PRODUK (HEADER & TABLE DISPLAY REAL-TIME DATABASE) */}
          <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
            {/* Table Header Bar */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  Daftar Stok Produk
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>
                  Pemantauan stok inventaris barang secara aktual & real-time dari database
                </p>
              </div>

              {/* View Mode Switcher (Table vs Grid) */}
              <div style={{ display: 'flex', gap: '0.25rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '10px' }}>
                <button
                  onClick={() => setViewMode('TABLE')}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: viewMode === 'TABLE' ? '#ffffff' : 'transparent',
                    color: viewMode === 'TABLE' ? '#0f172a' : '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    boxShadow: viewMode === 'TABLE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  <List size={15} /> Tabel
                </button>
                <button
                  onClick={() => setViewMode('GRID')}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: viewMode === 'GRID' ? '#ffffff' : 'transparent',
                    color: viewMode === 'GRID' ? '#0f172a' : '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    boxShadow: viewMode === 'GRID' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  <LayoutGrid size={15} /> Grid
                </button>
              </div>
            </div>

            {/* Content Body */}
            {loading ? (
              <div style={{ padding: '3.5rem', textAlign: 'center', color: '#64748b' }}>
                <RefreshCw size={32} className="spinning" style={{ marginBottom: '0.75rem', color: '#2563eb' }} />
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>Memuat Inventaris Stok Real-time...</div>
              </div>
            ) : filteredStocks.length === 0 ? (
              <div style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
                <Package size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem 0' }}>Daftar Stok Produk Tidak Ditemukan</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Coba ubah kata kunci atau reset filter pencarian di atas.</p>
              </div>
            ) : viewMode === 'TABLE' ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--accent-bg, #f8fafc)', borderBottom: '2px solid #e2e8f0', color: 'var(--color-primary, #0f172a)', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Produk</th>
                      <th style={{ padding: '0.85rem 1rem' }}>SKU / Barcode</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Kategori</th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Stok Saat Ini</th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Stok Minimum</th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Status</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Lokasi</th>
                      <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStocks.map((item) => {
                      const isOut = item.current_stock === 0;
                      const isLow = item.current_stock > 0 && item.current_stock < 10;
                      const catName = getItemCategory(item);
                      const minStock = isOut ? 20 : isLow ? 10 : 30;
                      const location = item.business_unit === 'FC_PRINT' ? 'Storage FC' : 'Gudang Utama';

                      return (
                        <tr key={item.stock_id || item.product_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          {/* Produk */}
                          <td style={{ padding: '0.85rem 1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Package size={20} color="#64748b" />
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>{item.product_name}</div>
                                <div style={{ fontSize: '0.725rem', color: '#64748b' }}>
                                  SKU: {item.product_id.toUpperCase()}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                  Barcode: 899{item.product_id.replace(/[^0-9]/g, '').padEnd(10, '0')}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* SKU / Barcode Tag */}
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{ padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, background: '#eff6ff', color: '#2563eb', border: '1px solid #dbeafe', display: 'inline-block' }}>
                              {catName}
                            </span>
                          </td>

                          {/* Kategori */}
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#334155', fontSize: '0.825rem' }}>
                            {catName}
                          </td>

                          {/* Stok Saat Ini */}
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: isOut ? '#dc2626' : isLow ? '#d97706' : '#059669' }}>
                              {item.current_stock}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: isOut ? '#dc2626' : '#64748b', fontWeight: 700 }}>
                              pcs
                            </div>
                          </td>

                          {/* Stok Minimum */}
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 800, color: isLow || isOut ? '#dc2626' : '#475569', fontSize: '0.9rem' }}>
                            {minStock}
                          </td>

                          {/* Status */}
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                            <span style={{ padding: '0.25rem 0.65rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 900, background: isOut ? '#fef2f2' : isLow ? '#fffbeb' : '#ecfdf5', color: isOut ? '#dc2626' : isLow ? '#b45309' : '#047857', border: `1px solid ${isOut ? '#fecaca' : isLow ? '#fde68a' : '#a7f3d0'}` }}>
                              {isOut ? 'Habis' : isLow ? 'Menipis' : 'Aman'}
                            </span>
                          </td>

                          {/* Lokasi */}
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#475569', fontSize: '0.825rem' }}>
                            {location}
                          </td>

                          {/* Aksi */}
                          <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                              <button
                                onClick={() => handleOpenEditProductModal(item)}
                                title="Lihat Detail Produk"
                                style={{ padding: '0.4rem 0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <Eye size={15} />
                              </button>

                              <button
                                onClick={() => {
                                  if (onTriggerToast) {
                                    onTriggerToast('info', 'Analisis Stok', `Perputaran "${item.product_name}": Stok ${item.current_stock} pcs, Status ${isOut ? 'Habis' : isLow ? 'Menipis' : 'Aman'}.`);
                                  }
                                }}
                                title="Analisis Perputaran Stok"
                                style={{ padding: '0.4rem 0.5rem', borderRadius: '8px', border: '1px solid #dbeafe', background: '#eff6ff', color: '#2563eb', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <BarChart2 size={15} />
                              </button>

                              {currentUser.role !== 'OWNER' && (
                                <button
                                  onClick={() => handleOpenEditModal(item)}
                                  title="Koreksi Stok Fisik"
                                  style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: 'none', background: '#4f46e5', color: '#ffffff', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                                >
                                  Koreksi
                                </button>
                              )}
                            </div>
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
                {paginatedStocks.map((item) => {
                  const isOut = item.current_stock === 0;
                  const isLow = item.current_stock > 0 && item.current_stock < 10;
                  const catName = getItemCategory(item);

                  return (
                    <div
                      key={item.stock_id || item.product_id}
                      style={{
                        background: '#ffffff',
                        borderRadius: '18px',
                        border: isOut ? '2px solid #fecaca' : isLow ? '2px solid #fde68a' : '1px solid #e2e8f0',
                        padding: '1.25rem',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '1rem',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <span
                            style={{
                              padding: '0.25rem 0.65rem',
                              borderRadius: '8px',
                              fontSize: '0.7rem',
                              fontWeight: 900,
                              background: item.business_unit === 'FC_PRINT' ? '#eff6ff' : '#f0fdf4',
                              color: item.business_unit === 'FC_PRINT' ? '#1d4ed8' : '#15803d',
                            }}
                          >
                            {item.business_unit === 'FC_PRINT' ? '📄 FC / PRINT' : '🍧 F&B'}
                          </span>

                          <span
                            style={{
                              padding: '0.25rem 0.65rem',
                              borderRadius: '12px',
                              fontSize: '0.7rem',
                              fontWeight: 900,
                              background: isOut ? '#fef2f2' : isLow ? '#fffbeb' : '#ecfdf5',
                              color: isOut ? '#dc2626' : isLow ? '#b45309' : '#047857',
                              border: `1px solid ${isOut ? '#fecaca' : isLow ? '#fde68a' : '#a7f3d0'}`,
                            }}
                          >
                            {isOut ? '🔴 HABIS' : isLow ? '⚠️ MENIPIS' : '🟢 AMAN'}
                          </span>
                        </div>

                        <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
                          {item.product_name}
                        </h3>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.75rem' }}>
                          Kategori: <strong>{catName}</strong>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem', background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '10px' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Harga Jual:</span>
                          <span style={{ fontSize: '1rem', fontWeight: 900, color: '#2563eb' }}>
                            {formatRupiah(item.selling_price || 0)}
                          </span>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                            <span style={{ color: '#475569' }}>Stok Fisik Saat Ini:</span>
                            <span style={{ color: isOut ? '#dc2626' : isLow ? '#d97706' : '#047857', fontSize: '1.05rem' }}>
                              {item.current_stock} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>pcs</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {currentUser.role !== 'OWNER' && (
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.65rem' }}>
                          <button
                            onClick={() => handleDirectQuickAdd(item, 5)}
                            style={{ flex: 1, padding: '0.3rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}
                          >
                            +5 Pcs
                          </button>
                          <button
                            onClick={() => handleDirectQuickAdd(item, 10)}
                            style={{ flex: 1, padding: '0.3rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}
                          >
                            +10 Pcs
                          </button>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '0.4rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                        <button
                          onClick={() => handleOpenEditProductModal(item)}
                          style={{
                            flex: 1,
                            padding: '0.45rem',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#334155',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          <Eye size={14} /> Detail
                        </button>

                        {currentUser.role !== 'OWNER' && (
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            style={{
                              flex: 1,
                              padding: '0.45rem',
                              borderRadius: '8px',
                              border: 'none',
                              background: '#4f46e5',
                              color: '#ffffff',
                              fontWeight: 800,
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.3rem',
                            }}
                          >
                            <TrendingUp size={14} /> Koreksi
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer Pagination Bar */}
            {filteredStocks.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1rem 1.5rem', background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                  Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)} dari {totalItems} produk
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: currentPage === 1 ? '#cbd5e1' : '#334155',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ChevronLeft size={18} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        border: pageNum === currentPage ? 'none' : '1px solid #cbd5e1',
                        background: pageNum === currentPage ? '#2563eb' : '#ffffff',
                        color: pageNum === currentPage ? '#ffffff' : '#334155',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                      }}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: currentPage === totalPages ? '#cbd5e1' : '#334155',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      fontSize: '0.825rem',
                      fontWeight: 700,
                      color: '#334155',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    <option value={5}>5 / halaman</option>
                    <option value={10}>10 / halaman</option>
                    <option value={25}>25 / halaman</option>
                    <option value={50}>50 / halaman</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* B. BOTTOM ROW: PERGERAKAN STOK TERBARU & PERINGATAN STOK */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {/* CARD 1: PERGERAKAN STOK TERBARU */}
            <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '1.35rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', margin: '0 0 1rem 0' }}>
                  Pergerakan Stok Terbaru
                </h3>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ color: '#94a3b8', borderBottom: '1px solid #f1f5f9', textAlign: 'left', fontWeight: 700 }}>
                        <th style={{ paddingBottom: '0.5rem' }}>Waktu</th>
                        <th style={{ paddingBottom: '0.5rem' }}>Produk</th>
                        <th style={{ paddingBottom: '0.5rem' }}>Jenis</th>
                        <th style={{ paddingBottom: '0.5rem', textAlign: 'right' }}>Jumlah</th>
                        <th style={{ paddingBottom: '0.5rem' }}>Gudang</th>
                        <th style={{ paddingBottom: '0.5rem' }}>Oleh</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentMovements.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.825rem' }}>
                            Belum ada pergerakan stok dicatat di database
                          </td>
                        </tr>
                      ) : (
                        recentMovements.map((mv, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                            <td style={{ padding: '0.55rem 0', color: '#64748b', fontSize: '0.75rem' }}>{mv.time}</td>
                            <td style={{ padding: '0.55rem 0', fontWeight: 800, color: '#0f172a' }}>{mv.product}</td>
                            <td style={{ padding: '0.55rem 0' }}>
                              <span style={{ padding: '0.15rem 0.45rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, background: mv.qty === '-' || (typeof mv.qty === 'number' && mv.qty < 0) ? '#fef2f2' : '#f0fdf4', color: mv.qty === '-' || (typeof mv.qty === 'number' && mv.qty < 0) ? '#dc2626' : '#16a34a' }}>
                                {mv.type}
                              </span>
                            </td>
                            <td style={{ padding: '0.55rem 0', textAlign: 'right', fontWeight: 900, color: mv.qty === '-' || (typeof mv.qty === 'number' && mv.qty < 0) ? '#dc2626' : '#16a34a' }}>
                              {mv.qty}
                            </td>
                            <td style={{ padding: '0.55rem 0', color: '#475569', fontSize: '0.75rem' }}>{mv.warehouse}</td>
                            <td style={{ padding: '0.55rem 0', color: '#64748b', fontSize: '0.75rem' }}>{mv.user}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                <button
                  onClick={() => {
                    if (onTriggerToast) onTriggerToast('info', 'Audit Log', 'Membuka seluruh riwayat pergerakan stok...');
                  }}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  Lihat Semua Pergerakan →
                </button>
              </div>
            </div>

            {/* CARD 2: PERINGATAN STOK */}
            <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '1.35rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', margin: '0 0 1rem 0' }}>
                  Peringatan Stok
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {stocks.length === 0 ? (
                    <div style={{ color: '#64748b', fontSize: '0.825rem', textAlign: 'center', padding: '1.5rem 0' }}>
                      Belum ada produk terdaftar di database
                    </div>
                  ) : alertStocks.length === 0 ? (
                    <div style={{ color: '#64748b', fontSize: '0.825rem', textAlign: 'center', padding: '1.5rem 0' }}>
                      🟢 Semua stok produk dalam kondisi aman
                    </div>
                  ) : (
                    alertStocks.map((item) => {
                      const isZero = item.current_stock === 0;
                      return (
                        <div key={item.stock_id || item.product_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.75rem', borderRadius: '12px', background: isZero ? '#fef2f2' : '#fffbeb', border: `1px solid ${isZero ? '#fecaca' : '#fde68a'}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: isZero ? '#ef4444' : '#f59e0b', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.75rem' }}>
                              {isZero ? '!' : '⚠️'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.825rem' }}>{item.product_name}</div>
                              <div style={{ fontSize: '0.725rem', color: isZero ? '#dc2626' : '#b45309', fontWeight: 600 }}>
                                {isZero ? 'Stok habis' : `Stok menipis (${item.current_stock} pcs)`}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              if (onTriggerToast) onTriggerToast('success', 'Purchase Order', `Draft PO untuk "${item.product_name}" berhasil dibuat.`);
                            }}
                            style={{ padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid #dbeafe', background: '#eff6ff', color: '#2563eb', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}
                          >
                            Buat PO
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                <button
                  onClick={() => {
                    setFilterStatus('LOW');
                    if (onTriggerToast) onTriggerToast('info', 'Filter Stok', 'Menampilkan produk stok menipis & habis');
                  }}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  Lihat Semua Peringatan →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------- */}
        {/* RIGHT COLUMN: SIDEBAR ANALYTICS (RINGKASAN, KATEGORI, GUDANG) */}
        {/* -------------------------------------------------------- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
          {/* CARD 1: RINGKASAN STOK (DONUT CHART) */}
          <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '1.35rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', margin: '0 0 1.15rem 0' }}>
              Ringkasan Stok
            </h3>

            {renderDonutChart()}

            <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '1.15rem', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>Total Produk</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>{stocks.length}</span>
            </div>
          </div>

          {/* CARD 2: STOK PER KATEGORI */}
          <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '1.35rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', margin: '0 0 1.15rem 0' }}>
              Stok per Kategori
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
              {categoryStockSummary.length === 0 ? (
                <div style={{ padding: '1rem 0', textAlign: 'center', color: '#94a3b8', fontSize: '0.825rem' }}>
                  Belum ada data stok per kategori
                </div>
              ) : (
                categoryStockSummary.map((cat, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                      <span style={{ color: '#334155' }}>{cat.name}</span>
                      <span style={{ color: '#0f172a', fontWeight: 800 }}>
                        {cat.count.toLocaleString()} <span style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 600 }}>({cat.percentage}%)</span>
                      </span>
                    </div>
                    <div style={{ height: '7px', width: '100%', borderRadius: '4px', background: '#f1f5f9', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${cat.percentage}%`, background: idx === 0 ? '#2563eb' : idx === 1 ? '#3b82f6' : idx === 2 ? '#60a5fa' : '#93c5fd', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* CARD 3: GUDANG */}
          <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '1.35rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', margin: '0 0 1.15rem 0' }}>
              Gudang
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', borderRadius: '12px', background: '#f8fafc' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Gudang Utama</span>
                <span style={{ padding: '0.2rem 0.65rem', borderRadius: '8px', background: '#dcfce7', color: '#15803d', fontWeight: 900, fontSize: '0.8rem' }}>
                  {totalGudangUtama.toLocaleString()}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', borderRadius: '12px', background: '#f8fafc' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Gudang Cabang 1</span>
                <span style={{ padding: '0.2rem 0.65rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #e2e8f0', color: '#334155', fontWeight: 800, fontSize: '0.8rem' }}>
                  {totalStorageFC.toLocaleString()}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', borderRadius: '12px', background: '#f8fafc' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Gudang Cabang 2</span>
                <span style={{ padding: '0.2rem 0.65rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #e2e8f0', color: '#334155', fontWeight: 800, fontSize: '0.8rem' }}>
                  {totalStorageFNB.toLocaleString()}
                </span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '1.15rem', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Total</span>
              <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
                {(totalGudangUtama + totalStorageFC + totalStorageFNB).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: KOREKSI / PENYESUAIAN STOK FISIK */}
      {/* ======================================================== */}
      {editingStock && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '480px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>Koreksi Stok Fisik</h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>{editingStock.product_name}</p>
              </div>
              <button onClick={() => setEditingStock(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
            </div>

            <form onSubmit={handleSaveStockUpdate} style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                  Jumlah Stok Fisik Benar (Pcs):
                </label>
                <input
                  type="number"
                  min="0"
                  value={newStockQty}
                  onChange={(e) => setNewStockQty(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '2px solid #6366f1', fontSize: '1.25rem', fontWeight: 900, outline: 'none' }}
                  required
                />
              </div>

              <div>
                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>Quick Restock Chips:</span>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {[5, 10, 25, 50].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => handleQuickAddModal(qty)}
                      style={{ flex: 1, padding: '0.45rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      +{qty}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                  Alasan Koreksi / Catatan:
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Misal: Salah hitung saat restock / Barang rusak"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingStock(null)}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 800, cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: 'none', background: '#4f46e5', color: '#ffffff', fontWeight: 900, cursor: 'pointer' }}
                >
                  {submitLoading ? 'Menyimpan...' : 'Simpan Koreksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: CREATING NEW PRODUCT & INITIAL STOCK */}
      {/* ======================================================== */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '520px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>Tambah Produk & Stok Baru</h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>Registrasi barang fisik ke sistem kasir & inventaris</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
            </div>

            <form onSubmit={handleCreateProductAndStock} style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>Nama Produk / Barang:</label>
                <input
                  type="text"
                  placeholder="Contoh: Es Teh Manis / Buku Tulis Sidu / Gorengan Tempe"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>Bidang Usaha:</label>
                  <select
                    value={newBusinessUnit}
                    onChange={(e) => setNewBusinessUnit(e.target.value as any)}
                    style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                  >
                    <option value="FNB">Food & Beverage (F&B)</option>
                    <option value="FC_PRINT">FC / Printing & ATK</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>Kategori Barang:</label>
                  <select
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(e.target.value)}
                    style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                  >
                    {categories.length > 0 ? (
                      categories.map((c) => (
                        <option key={c.category_id} value={c.category_id}>{c.category_name} ({c.business_unit})</option>
                      ))
                    ) : (
                      <>
                        <option value="cat-fnb-001">Makanan & Beverage</option>
                        <option value="cat-fc-001">Fotokopi & Printing</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>Harga Jual Kasir (Rp):</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={newSellingPrice}
                    onChange={(e) => setNewSellingPrice(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 800 }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>Stok Awal Physical (Pcs):</label>
                  <input
                    type="number"
                    min="0"
                    value={newInitialStock}
                    onChange={(e) => setNewInitialStock(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 800 }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 800, cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#ffffff', fontWeight: 900, cursor: 'pointer' }}
                >
                  {createLoading ? 'Memproses...' : 'Simpan Produk & Stok'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: KOREKSI DETAIL PRODUK (NAMA, HARGA, KATEGORI) */}
      {/* ======================================================== */}
      {editingProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '500px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>Koreksi Detail Barang</h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>Koreksi typo nama, harga jual, atau kategori produk</p>
              </div>
              <button onClick={() => setEditingProduct(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
            </div>

            <form onSubmit={handleSaveProductDetails} style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>Nama Barang / Produk:</label>
                <input
                  type="text"
                  value={editProdName}
                  onChange={(e) => setEditProdName(e.target.value)}
                  style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>Harga Jual Kasir (Rp):</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={editProdPrice}
                    onChange={(e) => setEditProdPrice(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 800 }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>Bidang Usaha:</label>
                  <select
                    value={editProdUnit}
                    onChange={(e) => setEditProdUnit(e.target.value as any)}
                    style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                  >
                    <option value="FNB">Food & Beverage (F&B)</option>
                    <option value="FC_PRINT">FC / Printing & ATK</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>Kategori Barang:</label>
                <select
                  value={editProdCatId}
                  onChange={(e) => setEditProdCatId(e.target.value)}
                  style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                >
                  {categories.map((c) => (
                    <option key={c.category_id} value={c.category_id}>{c.category_name} ({c.business_unit})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 800, cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={updateProdLoading}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: 'none', background: '#4f46e5', color: '#ffffff', fontWeight: 900, cursor: 'pointer' }}
                >
                  {updateProdLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ActionLoadingModal
        isOpen={submitLoading || createLoading || updateProdLoading}
        message="Memproses pembaruan stok & data inventaris backend..."
        submessage="Mencegah duplikasi entri stok & menyelaraskan database..."
      />
    </div>
  );
};
