import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Plus, Minus, Trash2, CheckCircle, Printer, AlertCircle } from 'lucide-react';
import { apiService, CreateTransactionResultData } from '../services/api';
import { Product, User, PaymentMethod } from '../types';
import { formatRupiah, formatWaktuIndo } from '../utils/formatters';
import { ActionLoadingModal } from './common/ActionLoadingModal';


interface PosRegisterProps {
  currentUser: User;
  activeShiftId?: string;
  onTransactionComplete?: () => void;
}

export interface CartItem {
  product: Product;
  qty: number;
}

export const PosRegister: React.FC<PosRegisterProps> = ({ currentUser, activeShiftId, onTransactionComplete }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashTendered, setCashTendered] = useState<number | string>(0);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Struk Digital Modal State
  const [lastReceipt, setLastReceipt] = useState<CreateTransactionResultData | null>(null);

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
      const [prodsData, stocksData] = await Promise.all([
        apiService.getProducts(selectedUnit),
        apiService.getStocks(),
      ]);

      const stockMap = new Map<string, number>();
      (stocksData || []).forEach((s) => stockMap.set(s.product_id, s.current_stock));

      const mergedProducts = (prodsData || []).map((p) => ({
        ...p,
        stock: stockMap.has(p.product_id) ? stockMap.get(p.product_id)! : (p.stock ?? 0),
      }));

      setProducts(mergedProducts);
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

  // Logika Preferensi Toko: Total Rounding (Pembulatan Ke Rp 100 Terdekat)
  const rawTotal = cart.reduce((sum, item) => sum + item.product.selling_price * item.qty, 0);
  const totalAmount = storePreferences.total_rounding ? Math.round(rawTotal / 100) * 100 : rawTotal;

  useEffect(() => {
    if ((Number(cashTendered) || 0) < totalAmount) {
      setCashTendered(totalAmount);
    }
  }, [totalAmount]);

  const handleCheckout = async () => {
    if (!activeShiftId) {
      setStockAlert({
        isOpen: true,
        type: 'INFO',
        title: 'SESI SHIFT OFFLINE',
        message: 'Transaksi ditolak. Harap buka sesi shift terlebih dahulu pada tab Manajemen Shift.',
      });
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

      if (onTransactionComplete) onTransactionComplete();

      // Langsung pemicu tampilan print dialog browser (seperti gambar ke-2)
      setTimeout(() => {
        window.print();
      }, 350);
    } catch (err: any) {
      setError(err.message || 'Gagal memproses transaksi');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Logika Preferensi Toko: Show Zero Stock Filtering
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.product_name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (storePreferences.show_zero_stock === false && p.manage_stock && p.stock === 0) {
      return false;
    }
    return true;
  });

  return (
    <div>
      {!activeShiftId && (
        <div style={{ padding: '0.85rem 1.25rem', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--danger)' }}>
          <AlertCircle size={20} />
          <span><strong>SESI SHIFT OFFLINE:</strong> Kasir belum membuka shift. Harap buka shift terlebih dahulu di tab <strong>Manajemen Shift</strong> sebelum melakukan transaksi.</span>
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
                onClick={() => setSelectedUnit('ALL')}
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
                onClick={() => setSelectedUnit('FC_PRINT')}
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
                onClick={() => setSelectedUnit('FNB')}
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
        <div className="card-glass" style={{ padding: '1.25rem', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                <ShoppingCart size={18} color="var(--primary-600)" /> Keranjang Order
              </h3>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                >
                  <Trash2 size={14} /> Kosongkan
                </button>
              )}
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
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
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
                    padding: '0.5rem 0.25rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    border: paymentMethod === 'CASH' ? '2px solid #047857' : '1px solid #a7f3d0',
                    background: paymentMethod === 'CASH' ? '#ecfdf5' : '#ffffff',
                    color: '#047857',
                    boxShadow: paymentMethod === 'CASH' ? '0 0 0 2px rgba(4,120,87,0.15)' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.15rem',
                  }}
                >
                  <span style={{ fontSize: '0.65rem', opacity: 0.85 }}>HIJAU</span>
                  💵 TUNAI / CASH
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('QRIS')}
                  style={{
                    padding: '0.5rem 0.25rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    border: paymentMethod === 'QRIS' ? '2px solid #1d4ed8' : '1px solid #bfdbfe',
                    background: paymentMethod === 'QRIS' ? '#eff6ff' : '#ffffff',
                    color: '#1d4ed8',
                    boxShadow: paymentMethod === 'QRIS' ? '0 0 0 2px rgba(29,78,216,0.15)' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.15rem',
                  }}
                >
                  <span style={{ fontSize: '0.65rem', opacity: 0.85 }}>BIRU</span>
                  📱 QRIS
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('TRANSFER')}
                  style={{
                    padding: '0.5rem 0.25rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    border: paymentMethod === 'TRANSFER' ? '2px solid #b45309' : '1px solid #fde68a',
                    background: paymentMethod === 'TRANSFER' ? '#fffbeb' : '#ffffff',
                    color: '#b45309',
                    boxShadow: paymentMethod === 'TRANSFER' ? '0 0 0 2px rgba(180,83,9,0.15)' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.15rem',
                  }}
                >
                  <span style={{ fontSize: '0.65rem', opacity: 0.85 }}>KUNING</span>
                  🏦 TRANSFER
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1rem' }}>
          <div className="printable-receipt-modal" style={{ width: '100%', maxWidth: '380px', padding: '1.75rem', background: '#ffffff', color: '#1e293b', borderRadius: '18px', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', border: '1px solid #cbd5e1' }}>
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', letterSpacing: '0.02em', margin: 0 }}>STRUK POS KASIR</h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.2rem 0 0 0', fontWeight: 600 }}>Usaha Campuran FC/Printing & FNB</p>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem', fontWeight: 600 }}>
                No: <strong style={{ color: '#0f172a' }}>{lastReceipt.transaction.transaction_number}</strong> | {formatWaktuIndo(lastReceipt.transaction.transaction_time)}
              </div>
            </div>

            <div style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#475569', fontSize: '0.8rem', fontWeight: 700 }}>
                <span>👤 Kasir: {currentUser.full_name || currentUser.username}</span>
                <span>⏰ {currentUser.shift || 'Shift Pagi'}</span>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                {lastReceipt.items.map((item) => {
                  const productObj = products.find((p) => p.product_id === item.product_id);
                  const productName = productObj ? productObj.product_name : `Product #${item.product_id.slice(-6)}`;

                  return (
                    <div key={item.transaction_item_id} style={{ marginBottom: '0.65rem', borderBottom: '1px dashed #f1f5f9', paddingBottom: '0.4rem' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>
                        {productName}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
                        <span>{item.qty} x {formatRupiah(item.unit_price)}</span>
                        <strong style={{ color: '#0f172a', fontSize: '0.85rem' }}>{formatRupiah(item.subtotal)}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ borderTop: '2px dashed #cbd5e1', paddingTop: '0.75rem', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1.15rem', marginBottom: '0.35rem', color: '#0f172a' }}>
                <span>TOTAL:</span>
                <span style={{ color: '#047857' }}>{formatRupiah(lastReceipt.transaction.final_total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#475569', fontWeight: 700 }}>
                <span>Metode Bayar:</span>
                <span>{lastReceipt.transaction.payment_method}</span>
              </div>
              {lastReceipt.transaction.payment_method === 'CASH' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#059669', fontWeight: 800, marginTop: '0.2rem' }}>
                  <span>Kembalian:</span>
                  <span>{formatRupiah(lastReceipt.change_due)}</span>
                </div>
              )}
            </div>

            <div className="no-print" style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setLastReceipt(null)}
                style={{ flex: 1, padding: '0.65rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#334155', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Tutup Struk
              </button>
              <button
                onClick={() => window.print()}
                className="btn-primary"
                style={{ flex: 1, padding: '0.65rem', fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', background: '#0f172a', border: 'none', borderRadius: '10px', color: '#fff', cursor: 'pointer' }}
              >
                <Printer size={16} /> Cetak Struk PDF
              </button>
            </div>
          </div>
        </div>
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
    </div>
  );
};
