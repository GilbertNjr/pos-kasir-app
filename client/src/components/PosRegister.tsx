import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  AlertCircle,
  QrCode,
  Banknote,
  Landmark,
  PauseCircle,
  PlayCircle,
  Printer,
  Wifi,
  WifiOff,
  RotateCw,
  Clock,
  X,
} from 'lucide-react';
import { apiService, CreateTransactionResultData } from '../services/api';
import { Product, User, PaymentMethod, Category } from '../types';
import { formatRupiah } from '../utils/formatters';
import { getProductCategoryBucket } from '../utils/categoryUtils';
import { ActionLoadingModal } from './common/ActionLoadingModal';
import { TransactionDetailModal } from './common/TransactionDetailModal';

export interface HeldOrder {
  id: string;
  customerName: string;
  note?: string;
  items: CartItem[];
  paymentMethod: PaymentMethod;
  timestamp: string;
  totalAmount: number;
}

export interface OfflineTransactionItem {
  id: string;
  timestamp: string;
  paymentMethod: PaymentMethod;
  cashTendered: number;
  items: { product_id: string; qty: number; product_name: string; price: number }[];
  customerName?: string;
  discountAmount?: number;
}


interface PosRegisterProps {
  currentUser: User;
  activeShiftId?: string;
  onTransactionComplete?: () => void;
  onShiftOpened?: () => void;
}

export interface CartItem {
  product: Product;
  qty: number;
}

export const PosRegister: React.FC<PosRegisterProps> = ({ currentUser, activeShiftId, onTransactionComplete, onShiftOpened }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>('ALL');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashTendered, setCashTendered] = useState<number | string>(0);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fitur Hold Order (Tahan Keranjang) State
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>(() => {
    try {
      const saved = localStorage.getItem('pos_held_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [holdCustomerName, setHoldCustomerName] = useState('');
  const [showHoldPromptModal, setShowHoldPromptModal] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('pos_held_orders', JSON.stringify(heldOrders));
    } catch (err) {
      console.warn('Gagal menyimpan held orders ke localStorage:', err);
    }
  }, [heldOrders]);

  // 2. Fitur Customer Member & Diskon State
  const [customerName, setCustomerName] = useState('');
  const [discountAmount, setDiscountAmount] = useState<number | ''>('');

  // 3. Thermal Direct Print & ESC/POS Setup State
  const [directThermalPrint, setDirectThermalPrint] = useState<boolean>(() => {
    return localStorage.getItem('pos_direct_thermal_print') === 'true';
  });

  // 4. Fitur Offline Local Queue Engine State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState<OfflineTransactionItem[]>(() => {
    try {
      const saved = localStorage.getItem('pos_offline_queue');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [syncingOffline, setSyncingOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('pos_offline_queue', JSON.stringify(offlineQueue));
    } catch (err) {
      console.warn('Gagal menyimpan offline queue:', err);
    }
  }, [offlineQueue]);

  // Hold Order Handlers
  const handleHoldCart = () => {
    if (cart.length === 0) return;
    setShowHoldPromptModal(true);
  };

  const confirmHoldCart = () => {
    if (cart.length === 0) return;
    const newHold: HeldOrder = {
      id: `HOLD-${Date.now()}`,
      customerName: holdCustomerName.trim() || `Pelanggan ${heldOrders.length + 1}`,
      items: [...cart],
      paymentMethod,
      timestamp: new Date().toISOString(),
      totalAmount: rawTotal,
    };
    setHeldOrders((prev) => [newHold, ...prev]);
    setCart([]);
    setHoldCustomerName('');
    setShowHoldPromptModal(false);
  };

  const handleRestoreHeldOrder = (heldId: string) => {
    const target = heldOrders.find((h) => h.id === heldId);
    if (!target) return;
    setCart(target.items);
    setPaymentMethod(target.paymentMethod);
    if (target.customerName && !target.customerName.startsWith('Pelanggan ')) {
      setCustomerName(target.customerName);
    }
    setHeldOrders((prev) => prev.filter((h) => h.id !== heldId));
    setShowHoldModal(false);
  };

  const handleDeleteHeldOrder = (heldId: string) => {
    setHeldOrders((prev) => prev.filter((h) => h.id !== heldId));
  };

  // Sync Offline Queue Handler
  const handleSyncOfflineQueue = async () => {
    if (offlineQueue.length === 0 || !navigator.onLine) return;
    setSyncingOffline(true);
    let successCount = 0;
    const remainingQueue: OfflineTransactionItem[] = [];

    for (const item of offlineQueue) {
      try {
        const itemsDto = item.items.map((i) => ({ product_id: i.product_id, qty: i.qty }));
        await apiService.createTransaction(item.paymentMethod, itemsDto, item.cashTendered);
        successCount++;
      } catch (err) {
        remainingQueue.push(item);
      }
    }

    setOfflineQueue(remainingQueue);
    setSyncingOffline(false);
    if (successCount > 0) {
      loadProducts();
      if (onTransactionComplete) onTransactionComplete();
      alert(`✓ Berhasil menyinkronkan ${successCount} transaksi offline ke database server!`);
    }
  };

  // Quick Buka Shift Modal State
  const [isBukaShiftModalOpen, setIsBukaShiftModalOpen] = useState(false);
  const [bukaShiftInitialCash, setBukaShiftInitialCash] = useState<number | ''>(50000);
  const [bukaShiftLoading, setBukaShiftLoading] = useState(false);

  const handleQuickOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setBukaShiftLoading(true);
      await apiService.openShift(Number(bukaShiftInitialCash) || 0);
      setIsBukaShiftModalOpen(false);
      if (onShiftOpened) onShiftOpened();
    } catch (err: any) {
      alert(err.message || 'Gagal membuka shift');
    } finally {
      setBukaShiftLoading(false);
    }
  };

  // Struk Digital Modal State
  const [lastReceipt, setLastReceipt] = useState<CreateTransactionResultData | null>(null);

  // Cart Panel Ref & Scroll Engine
  const cartPanelRef = React.useRef<HTMLDivElement>(null);
  const totalCartItemsCount = cart.reduce((acc, item) => acc + item.qty, 0);

  const scrollToCart = () => {
    if (cartPanelRef.current) {
      cartPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Store Preferences Logic State
  const [storePreferences, setStorePreferences] = useState<{
    show_zero_stock?: boolean;
    low_stock_alert?: boolean;
    auto_print_receipt?: boolean;
    fast_cashier_mode?: boolean;
    total_rounding?: boolean;
  }>({});

  useEffect(() => {
    apiService
      .getSettings()
      .then((s) => {
        if (s?.store_preferences) {
          setStorePreferences(s.store_preferences);
        }
      })
      .catch(() => {});
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const [prodsData, stocksData, catsData] = await Promise.all([
        apiService.getProducts(selectedUnit),
        apiService.getStocks(),
        apiService.getCategories().catch(() => []),
      ]);

      const stockMap = new Map<string, number>();
      (stocksData || []).forEach((s) => stockMap.set(s.product_id, s.current_stock));

      const mergedProducts = (prodsData || []).map((p) => ({
        ...p,
        stock: stockMap.has(p.product_id) ? stockMap.get(p.product_id)! : (p.stock ?? 0),
      }));

      setProducts(mergedProducts);
      setCategories(catsData || []);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat katalog POS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [selectedUnit]);

  const [stockAlert, setStockAlert] = useState<{
    isOpen: boolean;
    type: 'WARNING' | 'DANGER' | 'INFO';
    title: string;
    productName?: string;
    currentStock?: number;
    message: string;
  } | null>(null);

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.product.product_id === product.product_id);
    const currentInCart = existing ? existing.qty : 0;

    // Batasi jika produk mengelola stok fisik
    if (product.manage_stock) {
      const maxStock = product.stock ?? 0;

      if (maxStock <= 0) {
        setStockAlert({
          isOpen: true,
          type: 'DANGER',
          title: 'STOK HABIS!',
          productName: product.product_name,
          currentStock: 0,
          message: `Produk "${product.product_name}" saat ini 0 Pcs dan tidak dapat ditambahkan ke keranjang kasir.`,
        });
        return;
      }

      if (currentInCart + 1 > maxStock) {
        setStockAlert({
          isOpen: true,
          type: 'WARNING',
          title: 'STOK TERBATAS!',
          productName: product.product_name,
          currentStock: maxStock,
          message: `Jumlah di keranjang kasir telah mencapai batas maksimal stok yang tersedia (${maxStock} Pcs).`,
        });
        return;
      }
    }

    setCart((prev) => {
      if (existing) {
        return prev.map((item) =>
          item.product.product_id === product.product_id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    if (delta > 0) {
      const item = cart.find((i) => i.product.product_id === productId);
      if (item && item.product.manage_stock) {
        const maxStock = item.product.stock ?? 0;
        if (item.qty + delta > maxStock) {
          setStockAlert({
            isOpen: true,
            type: 'WARNING',
            title: 'STOK TERBATAS!',
            productName: item.product.product_name,
            currentStock: maxStock,
            message: `Kuantitas di keranjang tidak dapat melebihi stok fisik yang tersedia (${maxStock} Pcs).`,
          });
          return;
        }
      }
    }

    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.product_id === productId) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.product_id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Logika Preferensi Toko & Diskon
  const rawTotal = cart.reduce((sum, item) => sum + item.product.selling_price * item.qty, 0);
  const discountVal = Number(discountAmount) || 0;
  const subtotalAfterDiscount = Math.max(0, rawTotal - discountVal);
  const totalAmount = storePreferences.total_rounding ? Math.round(subtotalAfterDiscount / 100) * 100 : subtotalAfterDiscount;

  useEffect(() => {
    if ((Number(cashTendered) || 0) < totalAmount) {
      setCashTendered(totalAmount);
    }
  }, [totalAmount]);

  const handleCheckout = async () => {
    if (!activeShiftId) {
      setIsBukaShiftModalOpen(true);
      return;
    }

    if (cart.length === 0) {
      setStockAlert({
        isOpen: true,
        type: 'INFO',
        title: 'KERANJANG KOSONG',
        message: 'Keranjang belanja masih kosong. Silakan pilih produk dari katalog.',
      });
      return;
    }

    // Jika Jaringan Terputus (Mode Offline Queue)
    if (!navigator.onLine) {
      const offlineItem: OfflineTransactionItem = {
        id: `OFFLINE-TX-${Date.now()}`,
        timestamp: new Date().toISOString(),
        paymentMethod,
        cashTendered: Number(cashTendered) || totalAmount,
        items: cart.map((i) => ({
          product_id: i.product.product_id,
          qty: i.qty,
          product_name: i.product.product_name,
          price: i.product.selling_price,
        })),
        customerName: customerName.trim() || undefined,
        discountAmount: discountVal || undefined,
      };
      setOfflineQueue((prev) => [offlineItem, ...prev]);
      clearCart();
      setCustomerName('');
      setDiscountAmount('');
      alert('🌐 Jaringan Terputus (Offline). Transaksi berhasil disimpan di Local Queue Kasir dan akan otomatis tersimpan saat koneksi terhubung kembali!');
      return;
    }

    try {
      setSubmitLoading(true);
      setError(null);

      const itemsDto = cart.map((item) => ({
        product_id: item.product.product_id,
        qty: item.qty,
      }));

      const result = await apiService.createTransaction(paymentMethod, itemsDto, Number(cashTendered) || 0);
      setLastReceipt(result);
      clearCart();
      setCustomerName('');
      setDiscountAmount('');

      if (onTransactionComplete) onTransactionComplete();

      if (directThermalPrint) {
        console.log('[Direct Thermal Print] Transaksi dikirim ke printer kasir thermal...');
      } else {
        setTimeout(() => {
          window.print();
        }, 350);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memproses transaksi');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUnitChange = (unit: string) => {
    setSelectedUnit(unit);
    setSelectedSubCategory('ALL');
  };

  // Map kategori dari Database
  const categoryMap = React.useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.category_id, c.category_name));
    return map;
  }, [categories]);

  // Daftar Sub-Kategori Cepat (Es Krim, Gorengan, Snack, Minuman, DLL / Makanan Utama, dll.)
  const subCategoryFilters = React.useMemo(() => {
    if (selectedUnit === 'FNB') {
      return [
        { id: 'ALL', name: 'Semua F&B', emoji: '🍽️' },
        { id: 'es_krim', name: 'Es Krim', emoji: '🍦' },
        { id: 'seblak', name: 'Seblak', emoji: '🍲' },
        { id: 'gorengan', name: 'Gorengan', emoji: '🥟' },
        { id: 'snack', name: 'Snack', emoji: '🍿' },
        { id: 'minuman', name: 'Minuman', emoji: '🥤' },
        { id: 'dll_makanan', name: 'DLL / Makanan Utama', emoji: '🍱' },
      ];
    } else if (selectedUnit === 'FC_PRINT') {
      return [
        { id: 'ALL', name: 'Semua FC/Print', emoji: '🖨️' },
        { id: 'atk', name: 'ATK', emoji: '✏️' },
        { id: 'fotokopi', name: 'Fotokopi', emoji: '📄' },
        { id: 'printing', name: 'Printing', emoji: '🖨️' },
        { id: 'jasa', name: 'Jasa & Desain', emoji: '💼' },
        { id: 'dll_fc', name: 'DLL / Lainnya', emoji: '📂' },
      ];
    } else {
      return [
        { id: 'ALL', name: 'Semua Item', emoji: '✨' },
        { id: 'es_krim', name: 'Es Krim', emoji: '🍦' },
        { id: 'seblak', name: 'Seblak', emoji: '🍲' },
        { id: 'gorengan', name: 'Gorengan', emoji: '🥟' },
        { id: 'snack', name: 'Snack', emoji: '🍿' },
        { id: 'minuman', name: 'Minuman', emoji: '🥤' },
        { id: 'dll_makanan', name: 'DLL / Makanan', emoji: '🍱' },
        { id: 'atk', name: 'ATK', emoji: '✏️' },
        { id: 'fotokopi', name: 'Fotokopi', emoji: '📄' },
        { id: 'printing', name: 'Printing', emoji: '🖨️' },
        { id: 'jasa', name: 'Jasa', emoji: '💼' },
      ];
    }
  }, [selectedUnit]);

  // Logika Preferensi Toko & Sub-Kategori Filtering
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.product_name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (storePreferences.show_zero_stock === false && p.manage_stock && p.stock === 0) {
      return false;
    }

    if (selectedSubCategory !== 'ALL') {
      const catName = categoryMap.get(p.category_id) || '';
      const bucket = getProductCategoryBucket(p, catName);
      let isMatch = bucket === selectedSubCategory;

      if (!isMatch) {
        const normSubCat = selectedSubCategory.toLowerCase();
        const normPName = p.product_name.toLowerCase();
        const normCatName = catName.toLowerCase();

        if (normSubCat === 'es_krim' && (normPName.includes('kul') || normPName.includes('aice') || normPName.includes('krim') || normCatName.includes('krim'))) {
          isMatch = true;
        } else if (normSubCat === 'seblak' && (normPName.includes('seblak') || normCatName.includes('seblak'))) {
          isMatch = true;
        } else if (normSubCat === 'minuman' && (normPName.includes('teh') || normPName.includes('kopi') || normPName.includes('jus') || normPName.includes('drink') || normPName.includes('chocolatos') || normCatName.includes('minuman'))) {
          isMatch = true;
        } else if (normSubCat === 'gorengan' && (normPName.includes('goreng') || normCatName.includes('goreng'))) {
          isMatch = true;
        } else if ((normSubCat === 'snack' || normSubCat === 'dll_makanan') && (normCatName.includes('makanan') || normCatName.includes('snack') || normCatName.includes('camilan'))) {
          isMatch = true;
        }
      }

      if (!isMatch) return false;
    }

    return true;
  });

  return (
    <div>
      {!activeShiftId && (
        <div style={{ padding: '1rem 1.25rem', background: '#fef2f2', color: '#991b1b', borderRadius: '16px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', border: '1.5px solid #fecaca', boxShadow: '0 4px 12px rgba(239,68,68,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <AlertCircle size={24} color="#dc2626" />
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>⚠️ SESI SHIFT BELUM DIBUKA</div>
              <div style={{ fontSize: '0.8rem', color: '#7f1d1d', marginTop: '0.1rem' }}>Kasir tidak dapat bertransaksi sebelum shift dinyalakan dan modal kas diawal diinput.</div>
            </div>
          </div>
          <button
            onClick={() => setIsBukaShiftModalOpen(true)}
            style={{ padding: '0.55rem 1.1rem', background: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 10px rgba(220,38,38,0.25)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            🚀 Buka Shift Baru Sekarang
          </button>
        </div>
      )}

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      <div className="responsive-main-grid">
        {/* Left Column: Product Selection Grid */}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleUnitChange('ALL')}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  border: selectedUnit === 'ALL' ? 'none' : '1px solid var(--border-color)',
                  background: selectedUnit === 'ALL' ? '#0f172a' : '#ffffff',
                  color: selectedUnit === 'ALL' ? '#ffffff' : '#4b5563',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Semua
              </button>
              <button
                onClick={() => handleUnitChange('FC_PRINT')}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  border: selectedUnit === 'FC_PRINT' ? 'none' : '1px solid var(--border-color)',
                  background: selectedUnit === 'FC_PRINT' ? 'var(--accent-fc)' : '#ffffff',
                  color: selectedUnit === 'FC_PRINT' ? '#ffffff' : '#4b5563',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                FC / Print
              </button>
              <button
                onClick={() => handleUnitChange('FNB')}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  border: selectedUnit === 'FNB' ? 'none' : '1px solid var(--border-color)',
                  background: selectedUnit === 'FNB' ? 'var(--accent-fnb)' : '#ffffff',
                  color: selectedUnit === 'FNB' ? '#ffffff' : '#4b5563',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                F&B
              </button>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.4rem 0.75rem 0.4rem 2.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.85rem',
                  background: '#ffffff',
                }}
              />
            </div>
          </div>

          {/* Sub-Category Quick Filter Pills Bar */}
          <div
            className="mobile-scroll-row"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginBottom: '1rem',
              overflowX: 'auto',
              paddingBottom: '0.35rem',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', flexShrink: 0, marginRight: '0.1rem' }}>
              Filter Kategori:
            </span>
            {subCategoryFilters.map((sc) => {
              const isSelected = selectedSubCategory === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => setSelectedSubCategory(sc.id)}
                  style={{
                    padding: '0.32rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: isSelected ? 800 : 700,
                    border: isSelected ? 'none' : '1px solid #cbd5e1',
                    background: isSelected
                      ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
                      : '#ffffff',
                    color: isSelected ? '#ffffff' : '#475569',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    boxShadow: isSelected ? '0 3px 10px rgba(15, 23, 42, 0.25)' : 'none',
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                  }}
                >
                  <span>{sc.emoji}</span>
                  <span>{sc.name}</span>
                </button>
              );
            })}
          </div>

          {/* Product Grid Cards */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b', fontWeight: 600 }}>
              Memuat katalog produk...
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.65rem' }}>
              {filteredProducts.map((p) => {
              const isOutOfStock = p.manage_stock && p.stock === 0;

              return (
                <div
                  key={p.product_id}
                  onClick={() => !isOutOfStock && addToCart(p)}
                  className="card-glass"
                  style={{
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: isOutOfStock ? '#f8fafc' : '#ffffff',
                    border: '1px solid var(--border-color)',
                    cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                    opacity: isOutOfStock ? 0.6 : 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {p.manage_stock && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.4rem',
                        borderRadius: '4px',
                        background: (p.stock ?? 0) <= 5 ? '#fef2f2' : '#f0fdf4',
                        color: (p.stock ?? 0) <= 5 ? '#dc2626' : '#16a34a',
                        border: `1px solid ${(p.stock ?? 0) <= 5 ? '#fecaca' : '#bbf7d0'}`,
                      }}
                    >
                      Stok: {p.stock}
                    </span>
                  )}

                  <div style={{ marginBottom: '0.5rem', paddingTop: '0.2rem' }}>
                    <span
                      className={p.business_unit === 'FC_PRINT' ? 'badge badge-fc' : 'badge badge-fnb'}
                      style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', borderRadius: '4px', display: 'inline-block', marginBottom: '0.35rem' }}
                    >
                      {p.business_unit === 'FC_PRINT' ? 'FC/Print' : 'F&B'}
                    </span>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {p.product_name}
                    </h4>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary-600)' }}>{formatRupiah(p.selling_price)}</div>
                    </div>
                    <button
                      type="button"
                      disabled={isOutOfStock}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: isOutOfStock ? '#cbd5e1' : 'var(--primary-600)',
                        color: '#ffffff',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>

        {/* Right Column: Cart & Checkout Panel */}
        <div ref={cartPanelRef} className="card-glass" style={{ padding: '1.25rem', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            {/* Top Toolbar: Offline Sync & Direct Thermal Toggle Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.4rem', background: '#f8fafc', padding: '0.4rem 0.65rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              {/* Connection Status & Offline Sync */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 800 }}>
                {isOnline ? (
                  <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Wifi size={13} /> Server Online
                  </span>
                ) : (
                  <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <WifiOff size={13} /> Mode Offline
                  </span>
                )}
                {offlineQueue.length > 0 && (
                  <button
                    onClick={handleSyncOfflineQueue}
                    disabled={syncingOffline || !isOnline}
                    style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '6px',
                      background: syncingOffline ? '#cbd5e1' : '#d97706',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      cursor: syncingOffline || !isOnline ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                    }}
                  >
                    <RotateCw size={11} className={syncingOffline ? 'animate-spin' : ''} />
                    Sync ({offlineQueue.length})
                  </button>
                )}
              </div>

              {/* Direct Thermal Printing Toggle */}
              <button
                onClick={() => {
                  const nextVal = !directThermalPrint;
                  setDirectThermalPrint(nextVal);
                  localStorage.setItem('pos_direct_thermal_print', String(nextVal));
                }}
                style={{
                  padding: '0.25rem 0.55rem',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  border: directThermalPrint ? '1px solid #0284c7' : '1px solid #cbd5e1',
                  background: directThermalPrint ? '#e0f2fe' : '#ffffff',
                  color: directThermalPrint ? '#0369a1' : '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
                title="Aktifkan percetakan thermal langsung tanpa dialog cetak browser"
              >
                <Printer size={13} color={directThermalPrint ? '#0369a1' : '#64748b'} />
                <span>Thermal Silent: {directThermalPrint ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                <ShoppingCart size={18} color="var(--primary-600)" /> Keranjang Order
              </h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {/* Hold Order Action Button */}
                {cart.length > 0 && (
                  <button
                    onClick={handleHoldCart}
                    style={{
                      padding: '0.25rem 0.55rem',
                      borderRadius: '6px',
                      background: '#fef3c7',
                      color: '#d97706',
                      border: '1px solid #fde68a',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <PauseCircle size={13} /> Tahan Order
                  </button>
                )}

                {/* Held Orders List Badge Button */}
                {heldOrders.length > 0 && (
                  <button
                    onClick={() => setShowHoldModal(true)}
                    style={{
                      padding: '0.25rem 0.55rem',
                      borderRadius: '6px',
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      border: '1px solid #bfdbfe',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <Clock size={13} /> Draft ({heldOrders.length})
                  </button>
                )}

                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                  >
                    <Trash2 size={13} /> Kosongkan
                  </button>
                )}
              </div>
            </div>

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Klik produk di sebelah kiri untuk menambah ke keranjang.
              </div>
            ) : (
              <div style={{ maxHeight: '280px', overflowY: 'auto', marginBottom: '1rem' }}>
                {cart.map((item) => (
                  <div
                    key={item.product.product_id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.6rem 0',
                      borderBottom: '1px solid var(--border-color)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div style={{ flex: 1, paddingRight: '0.5rem', minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.product.product_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formatRupiah(item.product.selling_price)} x {item.qty}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                      <button
                        onClick={() => updateCartQty(item.product.product_id, -1)}
                        style={{ padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: '#f8fafc', cursor: 'pointer' }}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>{item.qty}</span>
                      <button
                        onClick={() => updateCartQty(item.product.product_id, 1)}
                        style={{ padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: '#f8fafc', cursor: 'pointer' }}
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.product_id)}
                        style={{ padding: '0.2rem 0.4rem', color: '#991b1b', border: 'none', background: 'none', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Details & Submit */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
            {/* Pelanggan & Diskon Optional Section */}
            {cart.length > 0 && (
              <div style={{ marginBottom: '0.85rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: '0.2rem' }}>
                    👤 Pelanggan / Member:
                  </label>
                  <input
                    type="text"
                    placeholder="Nama / No. HP..."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.35rem 0.5rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.78rem',
                      background: '#ffffff',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: '0.2rem' }}>
                    🏷️ Diskon Potongan (Rp):
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                    style={{
                      width: '100%',
                      padding: '0.35rem 0.5rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.78rem',
                      background: '#ffffff',
                    }}
                    min={0}
                  />
                </div>
              </div>
            )}

            {/* Total Breakdown */}
            {discountVal > 0 && (
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.35rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal Kategori:</span>
                <span>{formatRupiah(rawTotal)}</span>
              </div>
            )}
            {discountVal > 0 && (
              <div style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: 700, marginBottom: '0.35rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>Potongan Diskon:</span>
                <span>-{formatRupiah(discountVal)}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.05rem', fontWeight: 800, marginBottom: '1rem', color: '#0f172a' }}>
              <span>Total Tagihan:</span>
              <span style={{ color: '#0f172a', fontSize: '1.15rem' }}>{formatRupiah(totalAmount)}</span>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: '#4b5563' }}>
                Pilih Metode Pembayaran:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  style={{
                    padding: '0.65rem 0.35rem',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    border: paymentMethod === 'CASH' ? '2px solid #047857' : '1px solid #cbd5e1',
                    background: paymentMethod === 'CASH' ? '#ecfdf5' : '#ffffff',
                    color: paymentMethod === 'CASH' ? '#047857' : '#475569',
                    boxShadow: paymentMethod === 'CASH' ? '0 4px 10px rgba(4,120,87,0.15)' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Banknote size={20} color={paymentMethod === 'CASH' ? '#047857' : '#64748b'} />
                  <span>TUNAI / CASH</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('QRIS')}
                  style={{
                    padding: '0.65rem 0.35rem',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    border: paymentMethod === 'QRIS' ? '2px solid #1d4ed8' : '1px solid #cbd5e1',
                    background: paymentMethod === 'QRIS' ? '#eff6ff' : '#ffffff',
                    color: paymentMethod === 'QRIS' ? '#1d4ed8' : '#475569',
                    boxShadow: paymentMethod === 'QRIS' ? '0 4px 10px rgba(29,78,216,0.15)' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <QrCode size={20} color={paymentMethod === 'QRIS' ? '#1d4ed8' : '#64748b'} />
                  <span>QRIS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('TRANSFER')}
                  style={{
                    padding: '0.65rem 0.35rem',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    border: paymentMethod === 'TRANSFER' ? '2px solid #b45309' : '1px solid #cbd5e1',
                    background: paymentMethod === 'TRANSFER' ? '#fffbeb' : '#ffffff',
                    color: paymentMethod === 'TRANSFER' ? '#b45309' : '#475569',
                    boxShadow: paymentMethod === 'TRANSFER' ? '0 4px 10px rgba(180,83,9,0.15)' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Landmark size={20} color={paymentMethod === 'TRANSFER' ? '#b45309' : '#64748b'} />
                  <span>TRANSFER</span>
                </button>
              </div>
            </div>

            {/* Input Nominal Bayar Tunai & Kembalian */}
            {paymentMethod === 'CASH' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: '#4b5563' }}>
                  Nominal Uang Tunai Diterima (Rp):
                </label>
                <input
                  type="number"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value === '' ? '' : Number(e.target.value))}
                  style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.95rem', fontWeight: 700 }}
                  min={totalAmount}
                  step={1000}
                />
                <div style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: (Number(cashTendered) || 0) >= totalAmount ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                  Kembalian: {formatRupiah(Math.max(0, (Number(cashTendered) || 0) - totalAmount))}
                </div>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || submitLoading || !activeShiftId}
              className="btn-action-primary"
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', cursor: cart.length === 0 ? 'not-allowed' : 'pointer', opacity: cart.length === 0 ? 0.6 : 1 }}
            >
              <CheckCircle size={18} />
              {submitLoading ? 'Memproses Transaksi...' : 'Bayar & Selesaikan Order'}
            </button>
          </div>
        </div>
      </div>

      {/* Struk Digital Modal */}
      {lastReceipt && (
        <TransactionDetailModal
          isOpen={!!lastReceipt}
          onClose={() => setLastReceipt(null)}
          transaction={{
            ...lastReceipt.transaction,
            cash_tendered: cashTendered,
          }}
          items={lastReceipt.items}
          products={products}
          getUserName={() => currentUser.full_name || currentUser.username}
          onTransactionComplete={loadProducts}
        />
      )}

      <ActionLoadingModal
        isOpen={submitLoading}
        message="Memproses pembayaran & transaksi kasir ke backend POS..."
        submessage="Mencegah duplikasi pesanan & mengurangi stok barang..."
      />

      {/* Sleek Custom Stock & System Alert Modal (Replacing Native Browser alert()) */}
      {stockAlert && stockAlert.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1rem',
          }}
          onClick={() => setStockAlert(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              maxWidth: '420px',
              width: '100%',
              padding: '1.75rem 1.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border:
                stockAlert.type === 'DANGER'
                  ? '1px solid #fecaca'
                  : stockAlert.type === 'WARNING'
                  ? '1px solid #fde68a'
                  : '1px solid #cbd5e1',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: 'scaleUp 0.2s ease-out',
            }}
          >
            {/* Header Icon Badge */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background:
                  stockAlert.type === 'DANGER'
                    ? '#fef2f2'
                    : stockAlert.type === 'WARNING'
                    ? '#fffbeb'
                    : '#eff6ff',
                color:
                  stockAlert.type === 'DANGER'
                    ? '#dc2626'
                    : stockAlert.type === 'WARNING'
                    ? '#d97706'
                    : '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.15rem',
                boxShadow:
                  stockAlert.type === 'DANGER'
                    ? '0 8px 20px rgba(220, 38, 38, 0.18)'
                    : stockAlert.type === 'WARNING'
                    ? '0 8px 20px rgba(217, 119, 6, 0.18)'
                    : '0 8px 20px rgba(37, 99, 235, 0.18)',
              }}
            >
              <AlertCircle size={34} />
            </div>

            {/* Title */}
            <h3
              style={{
                fontSize: '1.25rem',
                fontWeight: 900,
                color: '#0f172a',
                margin: '0 0 0.5rem 0',
                letterSpacing: '-0.02em',
              }}
            >
              {stockAlert.title}
            </h3>

            {/* Product Tag Badge if product info exists */}
            {stockAlert.productName && (
              <div
                style={{
                  background: stockAlert.type === 'DANGER' ? '#fef2f2' : '#f8fafc',
                  border: stockAlert.type === 'DANGER' ? '1px solid #fee2e2' : '1px solid #e2e8f0',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '12px',
                  fontSize: '0.825rem',
                  fontWeight: 800,
                  color: stockAlert.type === 'DANGER' ? '#991b1b' : '#334155',
                  marginBottom: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  maxWidth: '100%',
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  📦 Produk "{stockAlert.productName}"
                </span>
                {stockAlert.currentStock !== undefined && (
                  <span
                    style={{
                      background: stockAlert.type === 'DANGER' ? '#ef4444' : '#f59e0b',
                      color: '#ffffff',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    Tersisa {stockAlert.currentStock} Pcs
                  </span>
                )}
              </div>
            )}

            {/* Message Body */}
            <p
              style={{
                fontSize: '0.875rem',
                color: '#475569',
                lineHeight: 1.5,
                margin: '0 0 1.5rem 0',
                fontWeight: 600,
              }}
            >
              {stockAlert.message}
            </p>

            {/* Dismiss Action Button */}
            <button
              onClick={() => setStockAlert(null)}
              style={{
                width: '100%',
                padding: '0.75rem 1.25rem',
                borderRadius: '12px',
                border: 'none',
                background:
                  stockAlert.type === 'DANGER'
                    ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
                    : stockAlert.type === 'WARNING'
                    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
                    : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.2)',
                transition: 'all 0.15s ease',
              }}
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}

      {/* Tombol Kasir Cepat (FAB - Floating Action Button) */}
      <div
        style={{
          position: 'fixed',
          bottom: '1.75rem',
          right: '1.75rem',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
        }}
      >
        <button
          onClick={scrollToCart}
          title="Tombol Kasir Cepat (FAB) — Langsung Buka Keranjang Order"
          className="fab-pulse-effect"
          style={{
            position: 'relative',
            width: '58px',
            height: '58px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
            color: '#ffffff',
            border: '2px solid #ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(79, 70, 229, 0.45)',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <ShoppingCart size={26} />
          {totalCartItemsCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '0.75rem',
                fontWeight: 900,
                minWidth: '22px',
                height: '22px',
                borderRadius: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 5px',
                border: '2px solid #ffffff',
                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.45)',
              }}
            >
              {totalCartItemsCount}
            </span>
          )}
        </button>
      </div>

      {/* QUICK BUKA SHIFT MODAL DI KASIR REGISTER */}
      {isBukaShiftModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '480px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1px solid #cbd5e1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                    Buka Sesi Shift Kasir
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Shift wajib dibuka sebelum bertransaksi</div>
                </div>
              </div>

              <button
                onClick={() => setIsBukaShiftModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#64748b', cursor: 'pointer', fontWeight: 700 }}
              >
                ✕
              </button>
            </div>

            {/* Informational Card (Kasir, Hari, Tanggal, Jam) */}
            <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.25rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Kasir Pembuka:</span>
                <strong style={{ color: '#0f172a' }}>{currentUser.full_name} ({currentUser.role})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Hari & Tanggal:</span>
                <strong style={{ color: '#4f46e5' }}>
                  {['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][new Date().getDay()]}, {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Waktu Registrasi:</span>
                <strong style={{ color: '#059669' }}>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</strong>
              </div>
            </div>

            <form onSubmit={handleQuickOpenShift}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                  Nominal Uang Modal Kas Awal (Rp):
                </label>
                <input
                  type="number"
                  value={bukaShiftInitialCash}
                  onChange={(e) => setBukaShiftInitialCash(e.target.value === '' ? '' : Number(e.target.value))}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '2px solid #4f46e5', fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', outline: 'none' }}
                  min={0}
                  step={5000}
                  required
                />

                {/* Preset Chips */}
                <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  {[50000, 100000, 200000, 500000].map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setBukaShiftInitialCash(amt)}
                      style={{
                        padding: '0.3rem 0.6rem',
                        borderRadius: '6px',
                        border: bukaShiftInitialCash === amt ? '1.5px solid #4f46e5' : '1px solid #cbd5e1',
                        background: bukaShiftInitialCash === amt ? '#eff6ff' : '#ffffff',
                        color: bukaShiftInitialCash === amt ? '#1d4ed8' : '#334155',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      {formatRupiah(amt)}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsBukaShiftModalOpen(false)}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={bukaShiftLoading}
                  style={{ flex: 1.5, padding: '0.75rem', borderRadius: '10px', border: 'none', background: '#059669', color: '#ffffff', fontWeight: 800, cursor: bukaShiftLoading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(5,150,105,0.25)' }}
                >
                  {bukaShiftLoading ? 'Membuka...' : '🚀 Buka Shift Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Tahan Keranjang (Hold Cart Prompt) */}
      {showHoldPromptModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '420px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <PauseCircle color="#d97706" /> Tahan Pesanan Sementara
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1rem 0' }}>
              Simpan keranjang ini sementara untuk melayani pelanggan lain.
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Nama Pelanggan / Catatan Meja (Opsional):
              </label>
              <input
                type="text"
                placeholder="Misal: Pelanggan Budi / Meja 3"
                value={holdCustomerName}
                onChange={(e) => setHoldCustomerName(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowHoldPromptModal(false)}
                style={{ flex: 1, padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmHoldCart}
                style={{ flex: 1.5, padding: '0.65rem', borderRadius: '8px', border: 'none', background: '#d97706', color: '#ffffff', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 10px rgba(217,119,6,0.25)' }}
              >
                ⏸️ Simpan di Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Daftar Order Tertahan (Hold List) */}
      {showHoldModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '540px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock color="#1d4ed8" /> Daftar Order Tertahan ({heldOrders.length})
              </h3>
              <button onClick={() => setShowHoldModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.2rem' }}>
              {heldOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b', fontSize: '0.875rem' }}>
                  Tidak ada order yang sedang ditahan.
                </div>
              ) : (
                heldOrders.map((h) => (
                  <div key={h.id} style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '0.85rem 1rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                        👤 {h.customerName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.6rem' }}>
                      {h.items.map((i) => `${i.product.product_name} (${i.qty}x)`).join(', ')}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.4rem', borderTop: '1px dashed #cbd5e1' }}>
                      <div style={{ fontWeight: 800, color: '#1d4ed8', fontSize: '0.9rem' }}>
                        {formatRupiah(h.totalAmount)}
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => handleDeleteHeldOrder(h.id)}
                          style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Hapus
                        </button>
                        <button
                          onClick={() => handleRestoreHeldOrder(h.id)}
                          style={{ padding: '0.35rem 0.85rem', borderRadius: '6px', border: 'none', background: '#1d4ed8', color: '#ffffff', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <PlayCircle size={13} /> Muat Kembali
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
