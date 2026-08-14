import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Plus, Minus, Trash2, CheckCircle, Printer, AlertCircle } from 'lucide-react';
import { apiService, CreateTransactionResultData } from '../services/api';
import { Product, User, PaymentMethod } from '../types';
import { formatRupiah, formatWaktuIndo } from '../utils/formatters';

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
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Struk Digital Modal State
  const [lastReceipt, setLastReceipt] = useState<CreateTransactionResultData | null>(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await apiService.getProducts(selectedUnit);
      setProducts(data);
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
    setCart((prev) => {
      const existing = prev.find((item) => item.product.product_id === product.product_id);
      if (existing) {
        return prev.map((item) =>
          item.product.product_id === product.product_id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
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

  const totalAmount = cart.reduce((sum, item) => sum + item.product.selling_price * item.qty, 0);

  useEffect(() => {
    if (cashTendered < totalAmount) {
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

      const result = await apiService.createTransaction(paymentMethod, itemsDto, cashTendered);
      setLastReceipt(result);
      clearCart();
      if (onTransactionComplete) onTransactionComplete();
    } catch (err: any) {
      setError(err.message || 'Gagal memproses checkout');
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.product_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Left Column: Product Selection Grid */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setSelectedUnit('ALL')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  border: '1px solid var(--border-color)',
                  background: selectedUnit === 'ALL' ? 'var(--primary-500)' : 'var(--bg-card)',
                  color: selectedUnit === 'ALL' ? '#fff' : 'var(--text-secondary)',
                }}
              >
                Semua
              </button>
              <button
                onClick={() => setSelectedUnit('FC_PRINT')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  border: '1px solid var(--border-color)',
                  background: selectedUnit === 'FC_PRINT' ? 'var(--accent-fc)' : 'var(--bg-card)',
                  color: selectedUnit === 'FC_PRINT' ? '#fff' : 'var(--text-secondary)',
                }}
              >
                FC / Print
              </button>
              <button
                onClick={() => setSelectedUnit('FNB')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  border: '1px solid var(--border-color)',
                  background: selectedUnit === 'FNB' ? 'var(--accent-fnb)' : 'var(--bg-card)',
                  color: selectedUnit === 'FNB' ? '#fff' : 'var(--text-secondary)',
                }}
              >
                F&B
              </button>
            </div>

            <div style={{ position: 'relative', width: '200px' }}>
              <Search size={16} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Cari item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.35rem 0.6rem 0.35rem 2rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.8rem',
                }}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Memuat produk POS...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.85rem', maxHeight: '520px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {filteredProducts.map((p) => (
                <div
                  key={p.product_id}
                  onClick={() => addToCart(p)}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease, border-color 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary-500)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                >
                  <div>
                    <span className={p.business_unit === 'FC_PRINT' ? 'badge badge-fc' : 'badge badge-fnb'} style={{ fontSize: '0.65rem', marginBottom: '0.35rem' }}>
                      {p.business_unit}
                    </span>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: '0.5rem' }}>
                      {p.product_name}
                    </h4>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-600)' }}>
                    {formatRupiah(p.selling_price)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Shopping Cart Drawer & Checkout Panel */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShoppingCart size={20} color="var(--primary-500)" />
                Keranjang Kasir ({cart.length})
              </h3>
              {cart.length > 0 && (
                <button onClick={clearCart} style={{ color: 'var(--danger)', fontSize: '0.75rem', border: 'none', background: 'none', cursor: 'pointer' }}>
                  Bersihkan
                </button>
              )}
            </div>

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
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
                    <div style={{ flex: 1, paddingRight: '0.5rem' }}>
                      <div style={{ fontWeight: 600 }}>{item.product.product_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formatRupiah(item.product.selling_price)} x {item.qty}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <button
                        onClick={() => updateCartQty(item.product.product_id, -1)}
                        style={{ padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-main)' }}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ fontWeight: 600, minWidth: '20px', textAlign: 'center' }}>{item.qty}</span>
                      <button
                        onClick={() => updateCartQty(item.product.product_id, 1)}
                        style={{ padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-main)' }}
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.product_id)}
                        style={{ padding: '0.2rem 0.4rem', color: 'var(--danger)', border: 'none', background: 'none', cursor: 'pointer' }}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
              <span>Total Tagihan:</span>
              <span style={{ color: 'var(--primary-600)' }}>{formatRupiah(totalAmount)}</span>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Metode Pembayaran:
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                style={{ width: '100%', padding: '0.45rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
              >
                <option value="CASH">CASH / Uang Tunai</option>
                <option value="QRIS">QRIS Non-Tunai</option>
                <option value="TRANSFER">Transfer Bank</option>
              </select>
            </div>

            {paymentMethod === 'CASH' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Uang Diserahkan Pembeli (Rp):
                </label>
                <input
                  type="number"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.45rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.95rem', fontWeight: 700 }}
                  min={totalAmount}
                  step={1000}
                />
                <div style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: cashTendered >= totalAmount ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                  Kembalian: {formatRupiah(Math.max(0, cashTendered - totalAmount))}
                </div>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || submitLoading || !activeShiftId}
              className="btn-primary"
              style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
            >
              <CheckCircle size={20} />
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
    </div>
  );
};
