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

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.product.product_id === product.product_id);
    const currentInCart = existing ? existing.qty : 0;

    // Batasi jika produk mengelola stok fisik
    if (product.manage_stock) {
      const maxStock = product.stock ?? 0;

      if (maxStock <= 0) {
        alert(`🔴 STOK HABIS!\n\nProduk "${product.product_name}" saat ini 0 Pcs dan tidak dapat ditambahkan ke keranjang kasir.`);
        return;
      }

      if (currentInCart + 1 > maxStock) {
        alert(`⚠️ STOK TERBATAS!\n\nProduk "${product.product_name}" hanya tersisa ${maxStock} Pcs.\n\nJumlah di keranjang kasir telah mencapai batas maksimal stok yang tersedia (${maxStock} Pcs).`);
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
          alert(`⚠️ STOK TERBATAS!\n\nProduk "${item.product.product_name}" hanya tersisa ${maxStock} Pcs.\n\nKuantitas tidak dapat melebihi stok fisik yang tersedia.`);
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
      alert('Transaksi ditolak. Harap buka sesi shift terlebih dahulu pada tab Manajemen Shift.');
      return;
    }

    if (cart.length === 0) {
      alert('Keranjang belanja masih kosong.');
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

      // Logika Preferensi Toko: Auto Print Receipt
      if (storePreferences.auto_print_receipt) {
        setTimeout(() => {
          window.print();
        }, 400);
      }

      if (onTransactionComplete) onTransactionComplete();
    } catch (err: any) {
      setError(err.message || 'Gagal memproses checkout');
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

            <div style={{ position: 'relative', flex: 1, minWidth: '160px', maxWidth: '240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Cari item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.4rem 0.6rem 0.4rem 2.2rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.825rem',
                  background: '#ffffff',
                }}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>Memuat produk POS...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem', maxHeight: '520px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {filteredProducts.map((p) => {
                const isOutOfStock = p.manage_stock && (p.stock ?? 0) <= 0;
                return (
                  <div
                    key={p.product_id}
                    onClick={() => addToCart(p)}
                    style={{
                      background: isOutOfStock ? '#fef2f2' : '#ffffff',
                      border: isOutOfStock ? '1px solid #fecaca' : '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem',
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                      opacity: isOutOfStock ? 0.75 : 1,
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isOutOfStock) e.currentTarget.style.borderColor = '#5b21b6';
                    }}
                    onMouseLeave={(e) => {
                      if (!isOutOfStock) e.currentTarget.style.borderColor = 'var(--border-color)';
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span className={p.business_unit === 'FC_PRINT' ? 'badge badge-fc' : 'badge badge-fnb'} style={{ fontSize: '0.65rem' }}>
                          {p.business_unit}
                        </span>
                        {p.manage_stock ? (
                          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: (p.stock ?? 0) === 0 ? '#dc2626' : (p.stock ?? 0) <= 5 ? '#d97706' : '#059669' }}>
                            {(p.stock ?? 0) === 0 ? '🔴 Habis' : `📦 ${(p.stock ?? 0)} Pcs`}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b' }}>⚡ Jasa</span>
                        )}
                      </div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: isOutOfStock ? '#991b1b' : '#0f172a', lineHeight: 1.25, marginBottom: '0.5rem' }}>
                        {p.product_name}
                      </h4>
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: isOutOfStock ? '#991b1b' : '#4f46e5' }}>
                      {formatRupiah(p.selling_price)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Shopping Cart Drawer & Checkout Panel */}
        <div style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%', minWidth: 0, boxShadow: 'var(--shadow-sm)' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0f172a' }}>
                <ShoppingCart size={20} color="#5b21b6" />
                Keranjang Kasir ({cart.length})
              </h3>
              {cart.length > 0 && (
                <button onClick={clearCart} style={{ color: '#991b1b', background: '#fee2e2', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                  Bersihkan
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
                {/* CASH */}
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

                {/* QRIS */}
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

                {/* TRANSFER */}
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

            {paymentMethod === 'CASH' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', color: '#4b5563' }}>
                  Uang Diserahkan Pembeli (Rp):
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card-glass" style={{ width: '100%', maxWidth: '400px', padding: '1.75rem', background: '#fff', color: '#1e293b', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>STRUK POS KASIR</h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Usaha Campuran FC/Printing & FNB</p>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                No: <strong>{lastReceipt.transaction.transaction_number}</strong> | {formatWaktuIndo(lastReceipt.transaction.transaction_time)}
              </div>
            </div>

            <div style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: '#64748b' }}>
                <span>Kasir: {currentUser.username}</span>
                <span>Shift ID: #{lastReceipt.transaction.shift_id.slice(-6)}</span>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                {lastReceipt.items.map((item) => (
                  <div key={item.transaction_item_id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span>{item.qty}x Product #{item.product_id.slice(-6)}</span>
                    <span style={{ fontWeight: 600 }}>{formatRupiah(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '0.75rem', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.35rem' }}>
                <span>TOTAL:</span>
                <span style={{ color: 'var(--primary-600)' }}>{formatRupiah(lastReceipt.transaction.final_total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span>Metode Bayar:</span>
                <span>{lastReceipt.transaction.payment_method}</span>
              </div>
              {lastReceipt.transaction.payment_method === 'CASH' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>
                  <span>Kembalian:</span>
                  <span>{formatRupiah(lastReceipt.change_due)}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setLastReceipt(null)}
                style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#334155' }}
              >
                Tutup Struk
              </button>
              <button
                onClick={() => window.print()}
                className="btn-primary"
                style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
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
    </div>
  );
};
