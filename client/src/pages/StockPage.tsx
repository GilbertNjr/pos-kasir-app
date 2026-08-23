import React, { useState, useEffect } from 'react';
import {
  Package,
  RefreshCw,
  Search,
  AlertTriangle,
  XCircle,
  TrendingUp,
  LayoutGrid,
  List,
  DollarSign,
  Eye,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  RotateCcw,
  FileSpreadsheet,
  Printer,
  Plus,
} from 'lucide-react';
import { apiService } from '../services/api';
import { User, Category, Product } from '../types';
import { formatRupiah, formatWaktuIndo } from '../utils/formatters';
import { getProductCategoryBucket } from '../utils/categoryUtils';
import { ActionLoadingModal } from '../components/common/ActionLoadingModal';
import { exportStockToExcel, printStockPDF } from '../utils/stockReportExporter';


interface StockItem {
  stock_id: string;
  product_id: string;
  product_name: string;
  business_unit: string;
  current_stock: number;
  stock_gudang?: number;
  stock_etalase?: number;
  last_updated: string;
  manage_stock: boolean;
  category_name?: string;
  category_id?: string;
  selling_price?: number;
}

interface StockPageProps {
  currentUser: User;
  onTriggerToast?: (type: 'success' | 'danger' | 'info' | 'warning', title: string, message: string) => void;
  storeName?: string;
}

export const StockPage: React.FC<StockPageProps> = ({ currentUser, onTriggerToast, storeName }) => {
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
  const [editStockGudang, setEditStockGudang] = useState<number | string>(0);
  const [editStockEtalase, setEditStockEtalase] = useState<number | string>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Modal 2: Create New Product & Stock Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newBusinessUnit, setNewBusinessUnit] = useState<'FC_PRINT' | 'FNB'>('FNB');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newSellingPrice, setNewSellingPrice] = useState<number | string>(5000);
  const [newInitialStockGudang, setNewInitialStockGudang] = useState<number | string>(10);
  const [newInitialStockEtalase, setNewInitialStockEtalase] = useState<number | string>(2);
  const [createLoading, setCreateLoading] = useState(false);

  // Modal 3: Edit Product Details Modal State (Koreksi Detail Produk)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdPrice, setEditProdPrice] = useState<number | string>(0);
  const [editProdUnit, setEditProdUnit] = useState<'FC_PRINT' | 'FNB'>('FNB');
  const [editProdCatId, setEditProdCatId] = useState('');
  const [updateProdLoading, setUpdateProdLoading] = useState(false);
  const [recentMovements, setRecentMovements] = useState<any[]>([]);

  // Modal 4: Konfirmasi Peringatan Hapus Stok & Produk
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<StockItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [stocksData, catsData, prodsData, stockMovementsData] = await Promise.all([
        apiService.getStocks(),
        apiService.getCategories(),
        apiService.getProducts(),
        apiService.getStockMovements().catch(() => []),
      ]);

      // Merge selling price & category info from products into stocks
      const pMap = new Map<string, Product>();
      (prodsData || []).forEach((p) => pMap.set(p.product_id, p));
      setProductsMap(pMap);

      const cMap = new Map<string, string>();
      (catsData || []).forEach((c) => cMap.set(c.category_id, c.category_name));

      const mergedStocks = (stocksData || [])
        .filter((s) => pMap.has(s.product_id))
        .map((s) => {
          const prod = pMap.get(s.product_id)!;
          const catName = prod.category_id ? cMap.get(prod.category_id) : s.category_name;
          return {
            ...s,
            product_name: prod.product_name || s.product_name,
            business_unit: prod.business_unit || s.business_unit,
            selling_price: prod.selling_price ?? s.selling_price ?? 0,
            category_id: prod.category_id,
            category_name: catName || s.category_name,
          };
        });

      setStocks(mergedStocks);
      setCategories(catsData || []);

      if (catsData && catsData.length > 0) {
        setNewCategoryId(catsData[0].category_id);
      }

      // Process real-time stock movements from backend stock log endpoint
      if (stockMovementsData && stockMovementsData.length > 0) {
        const relevantLogs = stockMovementsData
          .filter((l: any) =>
            l.action &&
            (l.action.includes('STOCK') ||
              l.action.includes('TRANSACTION') ||
              l.action.includes('PRODUCT'))
          )
          .slice(0, 10)
          .map((l: any) => {
            const isDelete = l.action.includes('DELETE') || l.details?.includes('Penghapusan');
            const isProdUpdate = l.action.includes('PRODUCT_UPDATE') || (l.details?.includes('diperbarui') && !l.details?.includes('+'));
            const isTransaction = l.action.includes('TRANSACTION');
            const isNeg = isDelete || isTransaction || l.details?.includes('-');
            const matchQty = l.details ? l.details.match(/([+-]\d+)/) : null;
            
            let qtyStr = matchQty ? `${matchQty[0]} Pcs` : isDelete ? '-1 Pcs' : isProdUpdate ? '0 Pcs' : isNeg ? '-1 Pcs' : '+1 Pcs';
            
            let typeLabel = 'Koreksi Stok';
            if (isTransaction) {
              typeLabel = 'Penjualan POS';
            } else if (isDelete) {
              typeLabel = 'Hapus Produk';
            } else if (isProdUpdate) {
              typeLabel = 'Koreksi Detail';
            } else if (l.details?.includes('Produk Baru') || l.details?.includes('Penambahan Produk')) {
              typeLabel = 'Produk Baru';
            } else if (l.details?.includes('+')) {
              typeLabel = 'Restock / Masuk';
            } else if (l.details?.includes('-')) {
              typeLabel = 'Pengurangan';
            }

            return {
              time: formatWaktuIndo(l.timestamp),
              product: l.affected_entity || 'Stok Barang',
              type: typeLabel,
              qty: qtyStr,
              isNegative: isNeg,
              details: l.details,
              warehouse: 'Gudang Utama',
              user: l.username || 'Kasir',
            };
          });
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
          Promise.all([apiService.getProducts(), apiService.getCategories()]).then(([prodsData, catsData]) => {
            if (prodsData) {
              const pMap = new Map<string, Product>();
              (prodsData || []).forEach((p) => pMap.set(p.product_id, p));
              setProductsMap(pMap);

              const cMap = new Map<string, string>();
              (catsData || []).forEach((c) => cMap.set(c.category_id, c.category_name));

              const mergedStocks = (stocksData || [])
                .filter((s) => pMap.has(s.product_id))
                .map((s) => {
                  const prod = pMap.get(s.product_id)!;
                  const catName = prod.category_id ? cMap.get(prod.category_id) : s.category_name;
                  return {
                    ...s,
                    product_name: prod.product_name || s.product_name,
                    business_unit: prod.business_unit || s.business_unit,
                    selling_price: prod.selling_price ?? s.selling_price ?? 0,
                    category_id: prod.category_id,
                    category_name: catName || s.category_name,
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
    const etalase = item.stock_etalase !== undefined ? item.stock_etalase : Math.min(item.current_stock, 5);
    const gudang = item.stock_gudang !== undefined ? item.stock_gudang : Math.max(0, item.current_stock - etalase);
    setEditStockGudang(gudang);
    setEditStockEtalase(etalase);
    setAdjustReason('Koreksi Stok Gudang Utama & Etalase Toko');
  };

  // Quick Add Direct Restock (e.g. +5, +10)
  const handleDirectQuickAdd = async (item: StockItem, addQty: number) => {
    const currentEtalase = item.stock_etalase !== undefined ? item.stock_etalase : Math.min(item.current_stock, 5);
    const currentGudang = item.stock_gudang !== undefined ? item.stock_gudang : Math.max(0, item.current_stock - currentEtalase);
    const newGudang = currentGudang + addQty;
    const totalQty = newGudang + currentEtalase;

    try {
      await apiService.updateStock(item.product_id, totalQty, newGudang, currentEtalase);
      
      setRecentMovements((prev) => [
        {
          time: 'Baru Saja',
          product: item.product_name,
          type: 'Restock / Masuk',
          qty: `+${addQty} Pcs`,
          isNegative: false,
          details: `Quick Add +${addQty} Pcs (Total: ${totalQty} Pcs)`,
          warehouse: 'Gudang Utama',
          user: currentUser?.username || 'Kasir',
        },
        ...prev,
      ]);

      if (onTriggerToast) {
        onTriggerToast('success', 'Stok Diperbarui', `Stok Gudang "${item.product_name}" +${addQty} (Total: ${totalQty} pcs)`);
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

    const gNum = Number(editStockGudang) || 0;
    const eNum = Number(editStockEtalase) || 0;
    const totalNum = gNum + eNum;
    const diff = totalNum - editingStock.current_stock;
    const isNeg = diff < 0;

    try {
      setSubmitLoading(true);
      setError(null);
      await apiService.updateStock(editingStock.product_id, totalNum, gNum, eNum);

      setRecentMovements((prev) => [
        {
          time: 'Baru Saja',
          product: editingStock.product_name,
          type: diff >= 0 ? 'Restock / Masuk' : 'Pengurangan',
          qty: `${diff >= 0 ? '+' : ''}${diff} Pcs`,
          isNegative: isNeg,
          details: `Koreksi Stok (Gudang: ${gNum}, Etalase: ${eNum})`,
          warehouse: 'Gudang Utama',
          user: currentUser?.username || 'Kasir',
        },
        ...prev,
      ]);

      if (onTriggerToast) {
        onTriggerToast(
          'success',
          'Penyesuaian Stok Berhasil',
          `Stok "${editingStock.product_name}" dikoreksi (Gudang: ${gNum}, Etalase: ${eNum}, Total: ${totalNum} pcs).`
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

  // Quick Transfer Gudang <-> Etalase
  const handleTransferToEtalase = (qty: number) => {
    setEditStockGudang((prevG) => {
      const g = Number(prevG) || 0;
      const move = Math.min(g, qty);
      setEditStockEtalase((prevE) => (Number(prevE) || 0) + move);
      return g - move;
    });
  };

  const handleTransferToGudang = (qty: number) => {
    setEditStockEtalase((prevE) => {
      const e = Number(prevE) || 0;
      const move = Math.min(e, qty);
      setEditStockGudang((prevG) => (Number(prevG) || 0) + move);
      return e - move;
    });
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

      const targetCatId = editProdCatId || editingProduct.category_id;
      const targetCatObj = categories.find((c) => c.category_id === targetCatId);
      const catNameLabel = targetCatObj ? targetCatObj.category_name : 'Kategori Terpilih';
      const unitLabel = editProdUnit === 'FNB' ? 'Food & Beverage (FNB)' : 'FC / Printing & ATK';
      const updatedName = editProdName.trim();
      const updatedPrice = Number(editProdPrice);

      // 1. API Call to persist changes in Backend / DB
      const res = await apiService.updateProduct(editingProduct.product_id, {
        product_name: updatedName,
        selling_price: updatedPrice,
        business_unit: editProdUnit,
        category_id: targetCatId || undefined,
      });

      // Backend message or fallback
      const beMessage = res?.message || `Produk "${updatedName}" berhasil diperbarui ke Bidang: ${unitLabel} | Kategori: ${catNameLabel}.`;

      // 2. Instant Local State Updates (ProductMap & Stocks)
      setProductsMap((prev) => {
        const next = new Map(prev);
        const existing = next.get(editingProduct.product_id);
        if (existing) {
          next.set(editingProduct.product_id, {
            ...existing,
            product_name: updatedName,
            selling_price: updatedPrice,
            business_unit: editProdUnit,
            category_id: targetCatId,
          });
        }
        return next;
      });

      setStocks((prev) =>
        prev.map((s) => {
          if (s.product_id === editingProduct.product_id) {
            return {
              ...s,
              product_name: updatedName,
              business_unit: editProdUnit,
              selling_price: updatedPrice,
              category_id: targetCatId,
              category_name: catNameLabel,
            };
          }
          return s;
        })
      );

      // 3. Display notification message sent directly from Backend (BE)
      if (onTriggerToast) {
        onTriggerToast(
          'success',
          'Detail Produk Dikoreksi',
          beMessage
        );
      }

      setEditingProduct(null);
      await loadData();
    } catch (err: any) {
      const errMsg = err.message || 'Gagal mengedit detail barang';
      setError(errMsg);
      if (onTriggerToast) onTriggerToast('danger', 'Gagal Edit Produk', errMsg);
    } finally {
      setUpdateProdLoading(false);
    }
  };

  // Handler Hapus Stok & Produk Dengan Peringatan Konfirmasi
  const handleConfirmDeleteProduct = async () => {
    if (!deleteConfirmItem) return;
    const targetProdId = deleteConfirmItem.product_id;
    try {
      setDeleteLoading(true);
      await apiService.deleteProduct(targetProdId);

      // Instant state update: Hapus langsung dari memori UI agar baris langsung hilang
      setStocks((prev) => prev.filter((s) => s.product_id !== targetProdId));
      setProductsMap((prev) => {
        const next = new Map(prev);
        next.delete(targetProdId);
        return next;
      });

      if (onTriggerToast) {
        onTriggerToast('success', 'Stok & Produk Dihapus', `Produk "${deleteConfirmItem.product_name}" berhasil dihapus secara permanen dari sistem.`);
      }
      setDeleteConfirmItem(null);
      await loadData();
    } catch (err: any) {
      if (onTriggerToast) {
        onTriggerToast('danger', 'Gagal Menghapus', err.message || 'Terjadi kesalahan saat menghapus stok & produk.');
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  // Submit Handler Modal 2: Membuat Produk & Stok Baru
  const handleCreateProductAndStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = Number(newSellingPrice) || 0;
    const gNum = Number(newInitialStockGudang) || 0;
    const eNum = Number(newInitialStockEtalase) || 0;
    const totalStock = gNum + eNum;

    if (!newProductName.trim() || priceNum <= 0 || totalStock < 0) {
      if (onTriggerToast) onTriggerToast('danger', 'Input Tidak Valid', 'Mohon lengkapi seluruh field dengan benar.');
      return;
    }

    try {
      setCreateLoading(true);
      setError(null);

      // Filter categories for the selected business unit
      const unitCats = categories.filter((c) => c.business_unit === newBusinessUnit);
      const categoryToUse = newCategoryId || (unitCats.length > 0 ? unitCats[0].category_id : (newBusinessUnit === 'FC_PRINT' ? 'cat-fc-001' : 'cat-fnb-001'));

      // 1. Create Product
      const newProduct = await apiService.createProduct({
        product_name: newProductName.trim(),
        business_unit: newBusinessUnit,
        category_id: categoryToUse,
        selling_price: priceNum,
        manage_stock: true,
        is_active: true,
      });

      // 2. Set Initial Stock with Gudang & Etalase breakdown
      if (newProduct && newProduct.product_id) {
        await apiService.updateStock(newProduct.product_id, totalStock, gNum, eNum);
      }

      setRecentMovements((prev) => [
        {
          time: 'Baru Saja',
          product: newProductName.trim(),
          type: 'Produk Baru',
          qty: `+${totalStock} Pcs`,
          isNegative: false,
          details: `Penambahan Produk Baru (Gudang: ${gNum}, Etalase: ${eNum})`,
          warehouse: 'Gudang Utama',
          user: currentUser?.username || 'Kasir',
        },
        ...prev,
      ]);

      if (onTriggerToast) {
        onTriggerToast('success', 'Produk & Stok Berhasil Dibuat', `Item "${newProductName}" telah ditambahkan ke sistem (Gudang: ${gNum}, Etalase: ${eNum}).`);
      }

      // Reset form
      setNewProductName('');
      setNewSellingPrice(5000);
      setNewInitialStockGudang(10);
      setNewInitialStockEtalase(2);
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
    const rawCat = (item.category_name || '').toLowerCase().trim();
    const rawName = (item.product_name || '').toLowerCase().trim();
    const normName = rawName.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ');

    // 1. Explicit keyword matches on Category Name or Normalized Product Name
    if (rawCat.includes('seblak') || normName.includes('seblak')) return 'Seblak';

    if (
      rawCat.includes('es krim') || rawCat.includes('eskrim') || rawCat.includes('ice cream') || rawCat.includes('aice') ||
      normName.includes('es krim') || normName.includes('eskrim') || normName.includes('ice cream') || normName.includes('aice') ||
      normName.includes('kul kul') || normName.includes('kulkul') || normName.includes('lolipop') || normName.includes('sundae')
    ) {
      return 'Es Krim';
    }

    if (
      rawCat.includes('minuman') || rawCat.includes('kopi') || rawCat.includes('teh') || rawCat.includes('drink') ||
      normName.includes('minuman') || normName.includes('es teh') || normName.includes('kopi') || normName.includes('jus') ||
      normName.includes('boba') || normName.includes('pop ice') || normName.includes('good day') || normName.includes('chocolatos')
    ) {
      return 'Minuman';
    }

    if (
      rawCat.includes('gorengan') || rawCat.includes('goreng') ||
      normName.includes('gorengan') || normName.includes('geprek') || normName.includes('lilit')
    ) {
      return 'Gorengan';
    }

    if (
      rawCat.includes('snack') || rawCat.includes('camilan') || rawCat.includes('makanan') || rawCat.includes('keripik') ||
      rawCat.includes('roti') || rawCat.includes('wafer') || rawCat.includes('sosis') || normName.includes('sosis')
    ) {
      return 'Makanan & Snack';
    }

    if (rawCat.includes('atk') || rawCat.includes('tulis') || rawCat.includes('buku') || rawCat.includes('kertas')) {
      return 'ATK & Persediaan';
    }

    if (rawCat.includes('fotokopi') || rawCat.includes('print') || rawCat.includes('cetak') || rawCat.includes('jasa') || rawCat.includes('fc')) {
      return 'Fotokopi & Print';
    }

    // 2. Standardized Category Bucket Fallback
    const bucket = getProductCategoryBucket(
      { product_name: item.product_name, business_unit: item.business_unit },
      item.category_name || ''
    );

    if (bucket === 'es_krim') return 'Es Krim';
    if (bucket === 'seblak') return 'Seblak';
    if (bucket === 'gorengan') return 'Gorengan';
    if (bucket === 'minuman') return 'Minuman';
    if (bucket === 'snack') return 'Makanan & Snack';
    if (bucket === 'atk') return 'ATK & Persediaan';
    if (bucket === 'fotokopi' || bucket === 'printing' || bucket === 'jasa') return 'Fotokopi & Print';

    // 3. Fallback to raw DB category name if present, or business unit default
    if (item.category_name) return item.category_name;

    return item.business_unit === 'FC_PRINT' ? 'ATK & Persediaan' : 'Makanan & Snack';
  };

  // Helper Dynamic Pastel Badge Color per Kategori
  const getCategoryBadgeStyle = (categoryName: string) => {
    const cat = (categoryName || '').toLowerCase().trim();

    if (
      cat.includes('es krim') || cat.includes('eskrim') || cat.includes('ice cream') ||
      cat.includes('aice') || cat.includes('kul kul') || cat.includes('kul-kul') ||
      cat.includes('kulkul') || cat.includes('walls') || cat.includes('joyday') || cat.includes('campina') || cat.includes('krim')
    ) {
      return {
        bg: '#e0f2fe',       // Soft Pastel Cyan
        text: '#0284c7',
        border: '#bae6fd',
      };
    }
    if (cat.includes('makanan') || cat.includes('snack') || cat.includes('gorengan') || cat.includes('lilit') || cat.includes('seblak')) {
      return {
        bg: '#fff7ed',       // Soft Pastel Amber / Orange
        text: '#c2410c',
        border: '#ffedd5',
      };
    }
    if (cat.includes('minuman') || cat.includes('teh') || cat.includes('kopi') || cat.includes('jus') || cat.includes('drink')) {
      return {
        bg: '#f0fdf4',       // Soft Pastel Emerald / Green
        text: '#15803d',
        border: '#bbf7d0',
      };
    }
    if (cat.includes('fotokopi') || cat.includes('print') || cat.includes('fc') || cat.includes('copy')) {
      return {
        bg: '#faf5ff',       // Soft Pastel Violet / Purple
        text: '#7e22ce',
        border: '#e9d5ff',
      };
    }
    if (cat.includes('atk') || cat.includes('tulis') || cat.includes('kertas') || cat.includes('buku')) {
      return {
        bg: '#fdf4ff',       // Soft Pastel Fuchsia
        text: '#a21caf',
        border: '#f5d0fe',
      };
    }
    if (cat.includes('jasa') || cat.includes('desain') || cat.includes('ketik') || cat.includes('laminasi')) {
      return {
        bg: '#fff1f2',       // Soft Pastel Rose
        text: '#e11d48',
        border: '#fecdd3',
      };
    }

    // Default Fallback Color
    return {
      bg: '#eff6ff',
      text: '#2563eb',
      border: '#dbeafe',
    };
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
        const itemCat = getItemCategory(item);
        const itemCatNorm = itemCat.toLowerCase().trim();
        const selectedNorm = selectedCategory.toLowerCase().trim();
        const rawCatName = (item.category_name || '').toLowerCase().trim();
        const rawPName = item.product_name.toLowerCase().trim();

        const matches =
          itemCatNorm === selectedNorm ||
          rawCatName === selectedNorm ||
          item.category_id === selectedCategory ||
          (selectedNorm.includes('seblak') && (itemCatNorm.includes('seblak') || rawCatName.includes('seblak') || rawPName.includes('seblak'))) ||
          (selectedNorm.includes('es krim') && (itemCatNorm.includes('es krim') || itemCatNorm.includes('eskrim') || rawCatName.includes('es krim') || rawPName.includes('kul') || rawPName.includes('aice'))) ||
          (selectedNorm.includes('makanan') && (itemCatNorm.includes('makanan') || itemCatNorm.includes('snack') || rawCatName.includes('makanan') || rawCatName.includes('snack') || rawCatName.includes('camilan'))) ||
          (selectedNorm.includes('minuman') && (itemCatNorm.includes('minuman') || rawCatName.includes('minuman') || rawCatName.includes('kopi') || rawCatName.includes('teh') || rawPName.includes('teh') || rawPName.includes('chocolatos'))) ||
          (selectedNorm.includes('gorengan') && (itemCatNorm.includes('gorengan') || rawCatName.includes('gorengan') || rawCatName.includes('goreng')));

        if (!matches) return false;
      }
    }

    if (filterStatus === 'SAFE') return item.current_stock >= 5;
    if (filterStatus === 'LOW') return item.current_stock > 0 && item.current_stock < 5;
    if (filterStatus === 'OUT') return item.current_stock === 0;

    return true;
  });

  const lowStockCount = stocks.filter((s) => s.current_stock > 0 && s.current_stock < 5).length;
  const outOfStockCount = stocks.filter((s) => s.current_stock === 0).length;
  const safeStockCount = stocks.filter((s) => s.current_stock >= 5).length;

  const totalValuation = stocks.reduce((acc, s) => acc + (s.current_stock * (s.selling_price || 0)), 0);

  // Auto reset pagination page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, filterStatus, selectedWarehouse, selectedUnit]);

  const totalItems = filteredStocks.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const activePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = totalItems === 0 ? 0 : (activePage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedStocks = filteredStocks.slice(startIndex, endIndex);

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

  // Warehouse physical totals (Dynamic Real-time DB: Gudang Utama & Etalase Toko)
  const totalGudangUtama = React.useMemo(() => {
    return stocks.reduce((acc, s) => {
      const etalase = s.stock_etalase !== undefined ? s.stock_etalase : Math.min(s.current_stock, 5);
      const gudang = s.stock_gudang !== undefined ? s.stock_gudang : Math.max(0, s.current_stock - etalase);
      return acc + gudang;
    }, 0);
  }, [stocks]);

  const totalEtalaseToko = React.useMemo(() => {
    return stocks.reduce((acc, s) => {
      const etalase = s.stock_etalase !== undefined ? s.stock_etalase : Math.min(s.current_stock, 5);
      return acc + etalase;
    }, 0);
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
        {/* Metric 1: Total Produk */}
        <div className="responsive-kpi-card" style={{ background: '#ffffff', padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>TOTAL PRODUK</span>
            <div className="kpi-icon" style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>
            {stocks.length} <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Items</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem', fontWeight: 600 }}>
            Terdaftar di inventaris
          </div>
        </div>

        {/* Metric 2: Asset Valuation */}
        <div className="responsive-kpi-card" style={{ background: '#ffffff', padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>NILAI STOK</span>
            <div className="kpi-icon" style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: '1.25rem', fontWeight: 900, color: '#059669', letterSpacing: '-0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {formatRupiah(totalValuation)}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem', fontWeight: 600 }}>
            Est. Aset Stok Fisik
          </div>
        </div>

        {/* Metric 3: Stok Menipis */}
        <div className="responsive-kpi-card" style={{ background: '#ffffff', padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>STOK MENIPIS</span>
            <div className="kpi-icon" style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: '1.45rem', fontWeight: 900, color: '#d97706', letterSpacing: '-0.03em' }}>
            {lowStockCount} <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Items</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#b45309', marginTop: '0.2rem', fontWeight: 700 }}>
            Perlu segera restock
          </div>
        </div>

        {/* Metric 4: Stok Habis */}
        <div className="responsive-kpi-card" style={{ background: '#ffffff', padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>STOK HABIS</span>
            <div className="kpi-icon" style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XCircle size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: '1.45rem', fontWeight: 900, color: '#dc2626', letterSpacing: '-0.03em' }}>
            {outOfStockCount} <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Items</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#dc2626', marginTop: '0.2rem', fontWeight: 700 }}>
            Tidak dapat dijual
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
              padding: '0.6rem 0.65rem',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              fontSize: '0.825rem',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
              outline: 'none',
              width: '100%',
              textOverflow: 'ellipsis',
            }}
          >
            <option value="ALL">Semua Status</option>
            <option value="SAFE">🟢 Stok Aman</option>
            <option value="LOW">⚠️ Stok Menipis</option>
            <option value="OUT">🔴 Stok Habis</option>
          </select>

          {/* Dropdown Semua Gudang */}
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            style={{
              padding: '0.6rem 0.65rem',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              fontSize: '0.825rem',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
              outline: 'none',
              width: '100%',
              textOverflow: 'ellipsis',
            }}
          >
            <option value="ALL">Semua Gudang</option>
            <option value="GUDANG_UTAMA">🏢 Gudang Utama</option>
            <option value="ETALASE">🏪 Etalase Toko</option>
          </select>
        </div>

        {/* Buttons Group */}
        <div className="responsive-toolbar-actions">
          {currentUser.role !== 'OWNER' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-toolbar-primary"
            >
              <Plus size={15} />
              <span>+ Tambah Stok</span>
            </button>
          )}

          <button
            onClick={async () => {
              await loadData();
              if (onTriggerToast) onTriggerToast('success', 'Stok Diperbarui', 'Data stok & inventaris berhasil disinkronisasi.');
            }}
            disabled={loading}
            className="btn-toolbar-refresh"
          >
            <RefreshCw size={14} className={loading ? 'spinning' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => exportStockToExcel(stocks, [], storeName)}
            className="btn-toolbar-excel"
          >
            <FileSpreadsheet size={14} />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => printStockPDF(stocks, [], storeName)}
            className="btn-toolbar-pdf"
          >
            <Printer size={14} />
            <span>Cetak PDF</span>
          </button>

          <button
            onClick={() => {
              setSelectedCategory('ALL');
              setFilterStatus('ALL');
              setSelectedWarehouse('ALL');
              setSearchQuery('');
              setSelectedUnit('ALL');
              if (onTriggerToast) onTriggerToast('info', 'Filter Direset', 'Semua filter pencarian telah dikembalikan ke kondisi awal.');
            }}
            title="Reset semua filter pencarian"
            className="btn-toolbar-secondary"
          >
            <RotateCcw size={14} color="#64748b" />
            <span>Reset</span>
          </button>
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
              <div style={{ padding: '0.75rem' }}>
                {/* 1. MOBILE CARD VIEW (< 768px: Mobile Stacked Cards, No Horizontal Scrolling) */}
                <div className="mobile-only-stock-list">
                  {paginatedStocks.map((item) => {
                    const isOut = item.current_stock === 0;
                    const isLow = item.current_stock > 0 && item.current_stock < 5;
                    const catName = getItemCategory(item);
                    const location = item.business_unit === 'FC_PRINT' ? 'Storage FC' : 'Gudang Utama';

                    return (
                      <div
                        key={item.stock_id || item.product_id}
                        style={{
                          background: '#ffffff',
                          borderRadius: '16px',
                          border: isOut ? '1.5px solid #fecaca' : isLow ? '1.5px solid #fde68a' : '1px solid #e2e8f0',
                          padding: '0.85rem 1rem',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.6rem',
                        }}
                      >
                        {/* Header: Product Name & Status Badge */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <div>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.925rem' }}>{item.product_name}</div>
                            <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.1rem', fontWeight: 600 }}>
                              Kategori: <strong>{catName}</strong> • {item.business_unit === 'FC_PRINT' ? '📄 FC/Print' : '🍧 FNB'}
                            </div>
                          </div>

                          <span style={{ padding: '0.25rem 0.65rem', borderRadius: '10px', fontSize: '0.725rem', fontWeight: 900, background: isOut ? '#fef2f2' : isLow ? '#fffbeb' : '#ecfdf5', color: isOut ? '#dc2626' : isLow ? '#b45309' : '#047857', border: `1px solid ${isOut ? '#fecaca' : isLow ? '#fde68a' : '#a7f3d0'}`, whiteSpace: 'nowrap' }}>
                            {isOut ? 'Habis' : isLow ? 'Menipis' : 'Aman'}
                          </span>
                        </div>

                        {/* Middle Info: Stock Count & Warehouse Breakdown */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Stok Fisik</div>
                            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: isOut ? '#dc2626' : isLow ? '#d97706' : '#059669' }}>
                              {item.current_stock} <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>pcs</span>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', fontSize: '0.725rem', color: '#475569', fontWeight: 700 }}>
                            <div style={{ color: '#1d4ed8' }}>🏭 Gudang: {item.stock_gudang ?? Math.max(0, item.current_stock - 5)} pcs</div>
                            <div style={{ color: '#059669', marginTop: '0.1rem' }}>🏪 Etalase: {item.stock_etalase ?? Math.min(item.current_stock, 5)} pcs</div>
                          </div>
                        </div>

                        {/* Footer Actions */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.2rem' }}>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>📍 {location}</span>
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button
                              onClick={() => handleOpenEditProductModal(item)}
                              title="Lihat Detail Produk"
                              style={{ padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <Eye size={14} /> Detail
                            </button>

                            {currentUser.role !== 'OWNER' && (
                              <button
                                onClick={() => handleOpenEditModal(item)}
                                style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: 'none', background: '#4f46e5', color: '#ffffff', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                              >
                                Koreksi
                              </button>
                            )}

                            <button
                              onClick={() => setDeleteConfirmItem(item)}
                              style={{ padding: '0.4rem 0.55rem', borderRadius: '8px', border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 2. DESKTOP TABLE VIEW (>= 768px: Full Multi-Column Table) */}
                <div style={{ width: '100%', overflowX: 'auto' }}>
                  <table className="desktop-only-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--accent-bg, #f8fafc)', borderBottom: '2px solid #e2e8f0', color: 'var(--color-primary, #0f172a)', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        <th style={{ padding: '0.85rem 1rem' }}>Produk</th>
                        <th style={{ padding: '0.85rem 0.75rem' }}>Kategori</th>
                        <th style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>Stok Saat Ini</th>
                        <th style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>Stok Minimum</th>
                        <th style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>Status</th>
                        <th style={{ padding: '0.85rem 0.75rem' }}>Lokasi</th>
                        <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedStocks.map((item) => {
                        const isOut = item.current_stock === 0;
                        const isLow = item.current_stock > 0 && item.current_stock < 5;
                        const catName = getItemCategory(item);
                        const minStock = 5;
                        const location = item.business_unit === 'FC_PRINT' ? 'Storage FC' : 'Gudang Utama';
                        const badgeStyle = getCategoryBadgeStyle(catName);

                        return (
                          <tr key={item.stock_id || item.product_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            {/* Produk */}
                            <td style={{ padding: '0.85rem 1rem' }}>
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

                            {/* Kategori Badge */}
                            <td style={{ padding: '0.85rem 0.75rem' }}>
                              <span
                                style={{
                                  padding: '0.3rem 0.75rem',
                                  borderRadius: '8px',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  background: badgeStyle.bg,
                                  color: badgeStyle.text,
                                  border: `1px solid ${badgeStyle.border}`,
                                  display: 'inline-block',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {catName}
                              </span>
                            </td>

                            {/* Stok Saat Ini & Lokasi Breakdown */}
                            <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>
                              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: isOut ? '#dc2626' : isLow ? '#d97706' : '#059669' }}>
                                {item.current_stock} <span style={{ fontSize: '0.7rem', color: isOut ? '#dc2626' : '#64748b', fontWeight: 700 }}>pcs</span>
                              </div>
                              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 800, display: 'flex', gap: '0.35rem', justifyContent: 'center', marginTop: '0.15rem' }}>
                                <span style={{ color: '#1d4ed8' }}>🏭 G: {item.stock_gudang ?? Math.max(0, item.current_stock - 5)}</span>
                                <span>•</span>
                                <span style={{ color: '#059669' }}>🏪 E: {item.stock_etalase ?? Math.min(item.current_stock, 5)}</span>
                              </div>
                            </td>

                            {/* Stok Minimum */}
                            <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center', fontWeight: 800, color: isLow || isOut ? '#dc2626' : '#475569', fontSize: '0.9rem' }}>
                              {minStock}
                            </td>

                            {/* Status */}
                            <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>
                              <span style={{ padding: '0.25rem 0.65rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 900, background: isOut ? '#fef2f2' : isLow ? '#fffbeb' : '#ecfdf5', color: isOut ? '#dc2626' : isLow ? '#b45309' : '#047857', border: `1px solid ${isOut ? '#fecaca' : isLow ? '#fde68a' : '#a7f3d0'}`, whiteSpace: 'nowrap' }}>
                                {isOut ? 'Habis' : isLow ? 'Menipis' : 'Aman'}
                              </span>
                            </td>

                            {/* Lokasi */}
                            <td style={{ padding: '0.85rem 0.75rem', fontWeight: 700, color: '#475569', fontSize: '0.825rem', whiteSpace: 'nowrap' }}>
                              {location}
                            </td>

                            {/* Aksi */}
                            <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
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
                                    style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: 'none', background: '#4f46e5', color: '#ffffff', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
                                  >
                                    Koreksi
                                  </button>
                                )}

                                <button
                                  onClick={() => setDeleteConfirmItem(item)}
                                  title="Hapus Stok & Produk"
                                  style={{ padding: '0.4rem 0.55rem', borderRadius: '8px', border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* GRID VIEW MODE (Responsive Cards: 1 Kolom di Ponsel, 2-4 Kolom di Tablet/Laptop) */
              <div className="responsive-stock-grid">
                {paginatedStocks.map((item) => {
                  const isOut = item.current_stock === 0;
                  const isLow = item.current_stock > 0 && item.current_stock < 5;
                  const catName = getItemCategory(item);
                  const badgeStyle = getCategoryBadgeStyle(catName);

                  return (
                    <div
                      key={item.stock_id || item.product_id}
                      style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        border: isOut ? '2px solid #fecaca' : isLow ? '2px solid #fde68a' : '1px solid #e2e8f0',
                        padding: '0.75rem 0.65rem',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                        minWidth: 0,
                        width: '100%',
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        {/* Header Badges */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', gap: '0.35rem', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              fontSize: '0.675rem',
                              fontWeight: 900,
                              background: item.business_unit === 'FC_PRINT' ? '#eff6ff' : '#f0fdf4',
                              color: item.business_unit === 'FC_PRINT' ? '#1d4ed8' : '#15803d',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.business_unit === 'FC_PRINT' ? '📄 FC / PRINT' : '🍧 F&B'}
                          </span>

                          <span
                            style={{
                              padding: '0.2rem 0.55rem',
                              borderRadius: '10px',
                              fontSize: '0.675rem',
                              fontWeight: 900,
                              background: isOut ? '#fef2f2' : isLow ? '#fffbeb' : '#ecfdf5',
                              color: isOut ? '#dc2626' : isLow ? '#b45309' : '#047857',
                              border: `1px solid ${isOut ? '#fecaca' : isLow ? '#fde68a' : '#a7f3d0'}`,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {isOut ? '🔴 HABIS' : isLow ? '⚠️ MENIPIS' : '🟢 AMAN'}
                          </span>
                        </div>

                        {/* Title & Category */}
                        <h3 style={{ fontSize: '0.975rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.2rem 0', wordBreak: 'break-word', lineHeight: 1.3 }}>
                          {item.product_name}
                        </h3>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem', wordBreak: 'break-word', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span>Kategori:</span>
                          <span
                            style={{
                              padding: '0.15rem 0.45rem',
                              borderRadius: '6px',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              background: badgeStyle.bg,
                              color: badgeStyle.text,
                              border: `1px solid ${badgeStyle.border}`,
                            }}
                          >
                            {catName}
                          </span>
                        </div>

                        {/* Price Box */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', background: '#f8fafc', padding: '0.45rem 0.65rem', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                          <span style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 700 }}>Harga:</span>
                          <span style={{ fontSize: '0.925rem', fontWeight: 900, color: '#2563eb' }}>
                            {formatRupiah(item.selling_price || 0)}
                          </span>
                        </div>

                        {/* Stock Information Box */}
                        <div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', background: '#f8fafc', padding: '0.55rem 0.65rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.775rem', fontWeight: 800 }}>
                              <span style={{ color: '#475569' }}>Total Stok Fisik:</span>
                              <span style={{ color: isOut ? '#dc2626' : isLow ? '#d97706' : '#047857', fontSize: '0.925rem', fontWeight: 900 }}>
                                {item.current_stock} <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>pcs</span>
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem', fontSize: '0.7rem', fontWeight: 800, borderTop: '1px dashed #cbd5e1', paddingTop: '0.35rem' }}>
                              <span style={{ color: '#1d4ed8', whiteSpace: 'nowrap' }}>
                                🏭 Gudang: <strong>{item.stock_gudang ?? Math.max(0, item.current_stock - 5)}</strong> pcs
                              </span>
                              <span style={{ color: '#059669', whiteSpace: 'nowrap' }}>
                                🏪 Etalase: <strong>{item.stock_etalase ?? Math.min(item.current_stock, 5)}</strong> pcs
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quick Restock (+5 Pcs, +10 Pcs) */}
                      {currentUser.role !== 'OWNER' && (
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
                          <button
                            onClick={() => handleDirectQuickAdd(item, 5)}
                            style={{ flex: 1, minWidth: 0, padding: '0.35rem 0.25rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', fontSize: '0.725rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            +5 Pcs
                          </button>
                          <button
                            onClick={() => handleDirectQuickAdd(item, 10)}
                            style={{ flex: 1, minWidth: 0, padding: '0.35rem 0.25rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', fontSize: '0.725rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            +10 Pcs
                          </button>
                        </div>
                      )}

                      {/* Action Buttons: Detail, Koreksi, Hapus */}
                      <div style={{ display: 'flex', gap: '0.35rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem', alignItems: 'center', minWidth: 0 }}>
                        <button
                          onClick={() => handleOpenEditProductModal(item)}
                          title="Lihat Detail Produk"
                          style={{
                            flex: 1,
                            minWidth: 0,
                            padding: '0.45rem 0.35rem',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#334155',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.25rem',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <Eye size={13} style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Detail</span>
                        </button>

                        {currentUser.role !== 'OWNER' && (
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            title="Koreksi Stok Fisik"
                            style={{
                              flex: 1,
                              minWidth: 0,
                              padding: '0.45rem 0.35rem',
                              borderRadius: '8px',
                              border: 'none',
                              background: '#4f46e5',
                              color: '#ffffff',
                              fontWeight: 800,
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.25rem',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <TrendingUp size={13} style={{ flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Koreksi</span>
                          </button>
                        )}

                        <button
                          onClick={() => setDeleteConfirmItem(item)}
                          title="Hapus Stok & Produk"
                          style={{
                            padding: '0.45rem 0.55rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#fee2e2',
                            color: '#dc2626',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
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
                  Menampilkan {totalItems === 0 ? 0 : startIndex + 1} - {endIndex} dari {totalItems} produk
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button
                    onClick={() => setCurrentPage(Math.max(1, activePage - 1))}
                    disabled={activePage === 1}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: activePage === 1 ? '#cbd5e1' : '#334155',
                      cursor: activePage === 1 ? 'not-allowed' : 'pointer',
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
                        border: pageNum === activePage ? 'none' : '1px solid #cbd5e1',
                        background: pageNum === activePage ? '#2563eb' : '#ffffff',
                        color: pageNum === activePage ? '#ffffff' : '#334155',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                      }}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, activePage + 1))}
                    disabled={activePage === totalPages}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: activePage === totalPages ? '#cbd5e1' : '#334155',
                      cursor: activePage === totalPages ? 'not-allowed' : 'pointer',
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
                    <option value={1000}>Semua ({totalItems})</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* B. BOTTOM ROW: PERGERAKAN STOK TERBARU */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* CARD 1: PERGERAKAN STOK TERBARU */}
            <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '1.35rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', margin: '0 0 1rem 0' }}>
                  Pergerakan Stok Terbaru
                </h3>

                {/* 1. MOBILE CARD VIEW (< 768px: Responsive 2x2 Grid Mobile Cards) */}
                <div className="responsive-movement-2x2-grid">
                  {recentMovements.length === 0 ? (
                    <div style={{ gridColumn: 'span 2', padding: '1.25rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.825rem', background: '#f8fafc', borderRadius: '12px' }}>
                      Belum ada pergerakan stok dicatat di database
                    </div>
                  ) : (
                    recentMovements.map((mv, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#ffffff',
                          padding: '0.75rem 0.8rem',
                          borderRadius: '14px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '0.45rem',
                          minWidth: 0,
                          boxSizing: 'border-box',
                        }}
                      >
                        {/* Header Row: Product / TRX Title & Movement Badge */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.35rem', marginBottom: '0.3rem' }}>
                            <span
                              style={{
                                fontWeight: 900,
                                color: '#0f172a',
                                fontSize: '0.825rem',
                                lineHeight: 1.25,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1,
                                minWidth: 0,
                              }}
                              title={mv.product}
                            >
                              {mv.product}
                            </span>
                            <span
                              style={{
                                padding: '0.15rem 0.4rem',
                                borderRadius: '6px',
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                background: mv.isNegative ? '#fef2f2' : '#f0fdf4',
                                color: mv.isNegative ? '#dc2626' : '#16a34a',
                                border: `1px solid ${mv.isNegative ? '#fecaca' : '#bbf7d0'}`,
                                flexShrink: 0,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {mv.type}
                            </span>
                          </div>

                          {/* Timestamp & Warehouse/User */}
                          <div style={{ fontSize: '0.68rem', color: '#94a3b8', lineHeight: 1.3 }}>
                            <div>{mv.time}</div>
                            <div style={{ color: '#475569', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.1rem' }}>
                              {mv.warehouse} • <span style={{ color: '#64748b' }}>{mv.user}</span>
                            </div>
                          </div>
                        </div>

                        {/* Quantity Footer */}
                        <div style={{ paddingTop: '0.35rem', borderTop: '1px dashed #f1f5f9', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <div style={{ fontWeight: 900, fontSize: '0.925rem', color: mv.isNegative ? '#dc2626' : '#16a34a', letterSpacing: '-0.02em' }}>
                            {mv.qty}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* 2. DESKTOP TABLE VIEW (>= 768px: Full Horizontal Table) */}
                <div className="desktop-only-table" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
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
                            <td style={{ padding: '0.55rem 0', color: '#64748b', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{mv.time}</td>
                            <td style={{ padding: '0.55rem 0', fontWeight: 800, color: '#0f172a' }}>{mv.product}</td>
                            <td style={{ padding: '0.55rem 0' }}>
                              <span style={{ padding: '0.15rem 0.45rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, background: mv.isNegative ? '#fef2f2' : '#f0fdf4', color: mv.isNegative ? '#dc2626' : '#16a34a', border: `1px solid ${mv.isNegative ? '#fecaca' : '#bbf7d0'}` }}>
                                {mv.type}
                              </span>
                            </td>
                            <td style={{ padding: '0.55rem 0', textAlign: 'right', fontWeight: 900, color: mv.isNegative ? '#dc2626' : '#16a34a', whiteSpace: 'nowrap' }}>
                              {mv.qty}
                            </td>
                            <td style={{ padding: '0.55rem 0', color: '#475569', fontSize: '0.75rem' }}>{mv.warehouse}</td>
                            <td style={{ padding: '0.55rem 0', color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>{mv.user}</td>
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

          {/* CARD 3: GUDANG UTAMA & ETALASE TOKO */}
          <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '1.35rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', margin: '0 0 1.15rem 0' }}>
              Gudang
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', borderRadius: '12px', background: '#f8fafc' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Gudang Utama</span>
                <span style={{ padding: '0.2rem 0.65rem', borderRadius: '8px', background: '#dcfce7', color: '#15803d', fontWeight: 900, fontSize: '0.8rem' }}>
                  {totalGudangUtama.toLocaleString('id-ID')}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', borderRadius: '12px', background: '#f8fafc' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Etalase</span>
                <span style={{ padding: '0.2rem 0.65rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #e2e8f0', color: '#334155', fontWeight: 800, fontSize: '0.8rem' }}>
                  {totalEtalaseToko.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '1.15rem', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Total</span>
              <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
                {(totalGudangUtama + totalEtalaseToko).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: KOREKSI / PENYESUAIAN STOK GUDANG & ETALASE */}
      {/* ======================================================== */}
      {editingStock && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '500px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>Koreksi & Transfer Lokasi Stok</h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>{editingStock.product_name}</p>
              </div>
              <button onClick={() => setEditingStock(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
            </div>

            <form onSubmit={handleSaveStockUpdate} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {/* Card Ringkasan Total */}
              <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>Total Stok Fisik:</span>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a' }}>
                    {(Number(editStockGudang) || 0) + (Number(editStockEtalase) || 0)} <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>pcs</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.725rem', color: '#166534', background: '#dcfce7', padding: '0.2rem 0.55rem', borderRadius: '6px', fontWeight: 900 }}>
                    🏭 Gudang: {editStockGudang} | 🏪 Etalase: {editStockEtalase}
                  </span>
                </div>
              </div>

              {/* Grid 2 Input Lokasi */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                    🏭 Stok Gudang Utama:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editStockGudang}
                    onChange={(e) => setEditStockGudang(e.target.value === '' ? '' : Number(e.target.value))}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', border: '2px solid #3b82f6', fontSize: '1.1rem', fontWeight: 900, outline: 'none' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                    🏪 Stok Etalase Toko:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editStockEtalase}
                    onChange={(e) => setEditStockEtalase(e.target.value === '' ? '' : Number(e.target.value))}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', border: '2px solid #10b981', fontSize: '1.1rem', fontWeight: 900, outline: 'none' }}
                    required
                  />
                </div>
              </div>

              {/* Quick Transfer Buttons */}
              <div style={{ background: '#eff6ff', padding: '0.85rem', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                <span style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 800, display: 'block', marginBottom: '0.4rem' }}>
                  🔁 Quick Transfer (Gudang ↔ Etalase Toko):
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => handleTransferToEtalase(1)}
                    style={{ padding: '0.45rem', borderRadius: '8px', border: 'none', background: '#ffffff', color: '#1d4ed8', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                  >
                    ➡️ Etalase +1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTransferToEtalase(5)}
                    style={{ padding: '0.45rem', borderRadius: '8px', border: 'none', background: '#ffffff', color: '#1d4ed8', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                  >
                    ➡️ Etalase +5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTransferToGudang(1)}
                    style={{ padding: '0.45rem', borderRadius: '8px', border: 'none', background: '#ffffff', color: '#475569', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                  >
                    ⬅️ Gudang +1
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                  Alasan Koreksi / Catatan Restock:
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Misal: Penyesuaian stok etalase toko / Barang rusak"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.35rem' }}>
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
                  {submitLoading ? 'Menyimpan...' : 'Simpan Lokasi Stok'}
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
          <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '540px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
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

              {/* 1. BUTTON PILIH BIDANG USAHA (2 BUTTON SEPARATE: FNB vs FC_PRINT) */}
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
                      if (fnbCats.length > 0) setNewCategoryId(fnbCats[0].category_id);
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
                      if (fcCats.length > 0) setNewCategoryId(fcCats[0].category_id);
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

              {/* 2. KATEGORI BARANG (DI-FILTER SESUAI BIDANG USAHA YANG DIPILIH) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                  Kategori Barang ({newBusinessUnit === 'FNB' ? 'Khusus F&B' : 'Khusus FC / Print & ATK'}):
                </label>
                <select
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value)}
                  style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '10px', border: '2px solid #cbd5e1', fontSize: '0.875rem', fontWeight: 700 }}
                >
                  {categories.filter((c) => c.business_unit === newBusinessUnit).length > 0 ? (
                    categories
                      .filter((c) => c.business_unit === newBusinessUnit)
                      .map((c) => (
                        <option key={c.category_id} value={c.category_id}>
                          {c.category_name}
                        </option>
                      ))
                  ) : (
                    <option value="">(Belum ada kategori terdaftar untuk unit ini)</option>
                  )}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>Harga Jual Kasir (Rp):</label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={newSellingPrice}
                  onChange={(e) => setNewSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 800 }}
                  required
                />
              </div>

              {/* 3. ALOKASI LOKASI STOK INITIAL (GUDANG UTAMA & ETALASE TOKO) */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Alokasi Lokasi Stok Awal:</span>
                  <span style={{ fontSize: '0.75rem', background: '#dbeafe', color: '#1e40af', padding: '0.25rem 0.6rem', borderRadius: '8px', fontWeight: 900 }}>
                    Total: {(Number(newInitialStockGudang) || 0) + (Number(newInitialStockEtalase) || 0)} Pcs
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '0.3rem' }}>
                      🏭 Stok Gudang Utama (Pcs):
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newInitialStockGudang}
                      onChange={(e) => setNewInitialStockGudang(e.target.value === '' ? '' : Number(e.target.value))}
                      style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 800 }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '0.3rem' }}>
                      🏪 Stok Etalase Toko (Pcs):
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newInitialStockEtalase}
                      onChange={(e) => setNewInitialStockEtalase(e.target.value === '' ? '' : Number(e.target.value))}
                      style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 800 }}
                      required
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
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
          <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '520px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
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

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                  Pilih Bidang Usaha:
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '0.3rem', borderRadius: '12px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditProdUnit('FNB');
                      const fnbCats = categories.filter((c) => c.business_unit === 'FNB');
                      if (fnbCats.length > 0) setEditProdCatId(fnbCats[0].category_id);
                    }}
                    style={{
                      flex: 1,
                      padding: '0.65rem 0.5rem',
                      borderRadius: '9px',
                      border: 'none',
                      background: editProdUnit === 'FNB' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
                      color: editProdUnit === 'FNB' ? '#ffffff' : '#475569',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      boxShadow: editProdUnit === 'FNB' ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    🍧 Food & Beverage (FNB)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditProdUnit('FC_PRINT');
                      const fcCats = categories.filter((c) => c.business_unit === 'FC_PRINT');
                      if (fcCats.length > 0) setEditProdCatId(fcCats[0].category_id);
                    }}
                    style={{
                      flex: 1,
                      padding: '0.65rem 0.5rem',
                      borderRadius: '9px',
                      border: 'none',
                      background: editProdUnit === 'FC_PRINT' ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : 'transparent',
                      color: editProdUnit === 'FC_PRINT' ? '#ffffff' : '#475569',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      boxShadow: editProdUnit === 'FC_PRINT' ? '0 2px 8px rgba(37, 99, 235, 0.3)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    📄 FC / Printing & ATK
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>Harga Jual Kasir (Rp):</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={editProdPrice}
                    onChange={(e) => setEditProdPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 800 }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>Kategori Barang:</label>
                  <select
                    value={editProdCatId}
                    onChange={(e) => setEditProdCatId(e.target.value)}
                    style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.875rem', fontWeight: 700 }}
                  >
                    {categories.filter((c) => c.business_unit === editProdUnit).map((c) => (
                      <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                    ))}
                  </select>
                </div>
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

      {/* MODAL 4: PERINGATAN KONFIRMASI HAPUS STOK & PRODUK */}
      {deleteConfirmItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', maxWidth: '440px', width: '100%', padding: '1.75rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #fee2e2' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
              <AlertTriangle size={32} />
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', textAlign: 'center', margin: '0 0 0.5rem 0' }}>
              Peringatan: Hapus Stok & Produk
            </h3>

            <p style={{ fontSize: '0.875rem', color: '#475569', textAlign: 'center', margin: '0 0 1.25rem 0', lineHeight: 1.5 }}>
              Apakah Anda yakin ingin menghapus produk <strong style={{ color: '#0f172a' }}>"{deleteConfirmItem.product_name}"</strong> dari inventaris stok?
            </p>

            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '1.5rem', border: '1px dashed #cbd5e1', fontSize: '0.825rem', color: '#64748b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span>Kode ID Produk:</span>
                <strong style={{ color: '#0f172a' }}>{deleteConfirmItem.product_id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Stok Fisik Saat Ini:</span>
                <strong style={{ color: '#dc2626' }}>{deleteConfirmItem.current_stock} pcs</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                disabled={deleteLoading}
                style={{ flex: 1, padding: '0.7rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', fontWeight: 700, fontSize: '0.875rem', cursor: deleteLoading ? 'not-allowed' : 'pointer' }}
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteProduct}
                disabled={deleteLoading}
                style={{ flex: 1, padding: '0.7rem', borderRadius: '10px', border: 'none', background: '#dc2626', color: '#ffffff', fontWeight: 800, fontSize: '0.875rem', cursor: deleteLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)' }}
              >
                <Trash2 size={16} />
                {deleteLoading ? 'Menghapus...' : 'Ya, Hapus Stok'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ActionLoadingModal
        isOpen={submitLoading || createLoading || updateProdLoading || deleteLoading}
        message="Memproses pembaruan stok & data inventaris backend..."
        submessage="Mencegah duplikasi entri stok & menyelaraskan database..."
      />
    </div>
  );
};
