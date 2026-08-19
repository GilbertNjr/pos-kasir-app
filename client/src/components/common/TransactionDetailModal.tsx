import React, { useState } from 'react';
import { X, Printer, Trash2, AlertTriangle, QrCode, Banknote, CreditCard, User, ShoppingBag } from 'lucide-react';
import { Transaction, TransactionItem, Product } from '../../types';
import { formatRupiah, formatWaktuIndo } from '../../utils/formatters';
import { apiService } from '../../services/api';

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | any;
  items?: TransactionItem[] | any[];
  products?: Product[];
  getUserName?: (userId: string) => string;
  onTransactionCancelled?: (transactionId: string) => void;
  onTransactionComplete?: () => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isOpen,
  onClose,
  transaction,
  items,
  products = [],
  getUserName,
  onTransactionCancelled,
}) => {
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  if (!isOpen || !transaction) return null;

  // Extract transaction detail variables safely
  const txNumber = transaction.transaction_number || transaction.transaction_id || 'TRX-00000';
  const isCancelled = transaction.status === 'CANCELLED';
  const txTime = transaction.transaction_time ? formatWaktuIndo(transaction.transaction_time) : '-';
  const cashierName = getUserName
    ? getUserName(transaction.created_by_user_id)
    : transaction.created_by_user_id || transaction.user_name || 'Kasir';
  const customerName = transaction.customer_name || 'Pelanggan Umum';
  const paymentMethod = (transaction.payment_method || 'CASH').toUpperCase();

  // Combine items
  const detailItems: any[] = items && items.length > 0 ? items : transaction.items || [];

  // Financial totals
  const subtotalVal = Number(transaction.subtotal_amount || transaction.final_total || 0);
  const discountVal = Number(transaction.discount_amount || 0);
  const finalTotalVal = Number(transaction.final_total || 0);
  const cashTenderedVal = Number(transaction.cash_tendered || finalTotalVal);
  const changeDueVal = paymentMethod === 'CASH' ? Math.max(0, cashTenderedVal - finalTotalVal) : 0;

  const handleCancelSubmit = async () => {
    try {
      setCancelling(true);
      setCancelError(null);
      await apiService.cancelTransaction(transaction.transaction_id);
      setShowConfirmCancel(false);
      if (onTransactionCancelled) {
        onTransactionCancelled(transaction.transaction_id);
      }
      onClose();
    } catch (err: any) {
      setCancelError(err.message || 'Gagal membatalkan transaksi');
    } finally {
      setCancelling(false);
    }
  };

  const handlePrintReceipt = () => {
    const printWin = window.open('', '_blank', 'width=420,height=700');
    if (!printWin) {
      alert('Harap izinkan popup browser untuk mencetak struk.');
      return;
    }

    try {
      printWin.opener = null;
    } catch {
      // Ignore
    }

    const itemRows = detailItems
      .map((item: any, idx: number) => {
        const matchedProd = products.find((p) => p.product_id === item.product_id);
        const pName = item.product_name || (matchedProd ? matchedProd.product_name : `Produk #${idx + 1}`);
        const qty = Number(item.qty || item.quantity || 1);
        const price = Number(item.unit_price || 0);
        const sub = Number(item.subtotal || price * qty);

        return `
        <tr>
          <td style="padding: 4px 0;">${pName}<br/><span style="font-size: 10px; color: #64748b;">${qty} x ${formatRupiah(price)}</span></td>
          <td style="padding: 4px 0; text-align: right; vertical-align: top; font-weight: 700;">${formatRupiah(sub)}</td>
        </tr>
      `;
      })
      .join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Struk Pembayaran - ${txNumber}</title>
        <style>
          @page { size: 80mm auto; margin: 5mm; }
          body { font-family: 'Courier New', Courier, monospace; color: #000; width: 300px; margin: 0 auto; padding: 10px; font-size: 12px; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .line { border-bottom: 1px dashed #000; margin: 8px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="center bold" style="font-size: 14px;">KEDAI KOPI SENJA & PRINTING</div>
        <div class="center" style="font-size: 10px;">Nota POS Resmi & Shift Transaction</div>
        <div class="line"></div>
        <div>No. Nota : ${txNumber}</div>
        <div>Waktu    : ${txTime}</div>
        <div>Kasir    : ${cashierName}</div>
        <div>Pelanggan: ${customerName}</div>
        <div class="line"></div>
        <table>
          <tbody>
            ${itemRows}
          </tbody>
        </table>
        <div class="line"></div>
        <div style="display: flex; justify-content: space-between;"><span>Subtotal</span><span>${formatRupiah(subtotalVal)}</span></div>
        ${discountVal > 0 ? `<div style="display: flex; justify-content: space-between;"><span>Diskon</span><span>-${formatRupiah(discountVal)}</span></div>` : ''}
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; margin-top: 4px;"><span>TOTAL</span><span>${formatRupiah(finalTotalVal)}</span></div>
        <div style="display: flex; justify-content: space-between; margin-top: 4px;"><span>Bayar (${paymentMethod})</span><span>${formatRupiah(cashTenderedVal)}</span></div>
        <div style="display: flex; justify-content: space-between;"><span>Kembalian</span><span>${formatRupiah(changeDueVal)}</span></div>
        <div class="line"></div>
        <div class="center" style="font-size: 10px; margin-top: 10px;">Terima Kasih Atas Kunjungan Anda!</div>
        <script>
          window.onload = function() {
            try { window.print(); } catch(e) {}
            setTimeout(function() { try { window.close(); } catch(e) {} }, 300);
          };
          window.onafterprint = function() {
            try { window.close(); } catch(e) {}
          };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <>
      {/* 1. UTAMA: MODAL DETAIL TRANSAKSI (Sesuai Referensi Desain Screenshot) */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
        }}
        onClick={onClose}
      >
        <div
          className="printable-receipt-modal"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#ffffff',
            width: '100%',
            maxWidth: '460px',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #cbd5e1',
            overflow: 'hidden',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            animation: 'scaleUp 0.2s ease-out',
          }}
        >
          {/* Header Bar */}
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#ffffff',
            }}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
              Detail Transaksi
            </h3>
            <button
              onClick={onClose}
              style={{
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b',
                transition: 'all 0.15s ease',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
            {/* Header Nota ID & Status Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                {txNumber}
              </h2>
              {isCancelled ? (
                <span
                  style={{
                    background: '#fef2f2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    padding: '0.2rem 0.65rem',
                    borderRadius: '8px',
                  }}
                >
                  Dibatalkan
                </span>
              ) : (
                <span
                  style={{
                    background: '#dcfce7',
                    color: '#16a34a',
                    border: '1px solid #bbf7d0',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    padding: '0.2rem 0.65rem',
                    borderRadius: '8px',
                  }}
                >
                  Lunas
                </span>
              )}
            </div>

            {/* Timestamp & Kasir Line */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem', color: '#64748b', marginBottom: '1.25rem' }}>
              <span>{txTime}</span>
              <span style={{ fontWeight: 700, color: '#475569' }}>Kasir: {cashierName}</span>
            </div>

            {/* Card: Informasi Pelanggan */}
            <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563eb', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <User size={14} /> Informasi Pelanggan
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>
                👤 {customerName}
              </div>
            </div>

            {/* Section: Detail Item */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ShoppingBag size={14} color="#6366f1" /> Detail Item
              </div>

              <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', color: '#64748b', textAlign: 'left', borderBottom: '1px solid #e2e8f0', fontSize: '0.75rem' }}>
                      <th style={{ padding: '0.6rem 0.75rem' }}>Produk</th>
                      <th style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>Qty</th>
                      <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Harga</th>
                      <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailItems.length > 0 ? (
                      detailItems.map((item: any, idx: number) => {
                        const matchedProd = products.find((p) => p.product_id === item.product_id);
                        const pName = item.product_name || (matchedProd ? matchedProd.product_name : `Produk #${idx + 1}`);
                        const qty = Number(item.qty || item.quantity || 1);
                        const price = Number(item.unit_price || 0);
                        const sub = Number(item.subtotal || price * qty);

                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: '#0f172a' }}>{pName}</td>
                            <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center', fontWeight: 700, color: '#475569' }}>{qty}</td>
                            <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', color: '#64748b' }}>{formatRupiah(price)}</td>
                            <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>{formatRupiah(sub)}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} style={{ padding: '1.25rem', textAlign: 'center', color: '#94a3b8' }}>
                          Detail rincian item produk tidak tersedia.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Rincian Finansial Summary */}
            <div style={{ background: '#ffffff', padding: '0.75rem 0', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatRupiah(subtotalVal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: discountVal > 0 ? '#dc2626' : '#64748b' }}>
                <span>Diskon</span>
                <span style={{ fontWeight: 700 }}>{discountVal > 0 ? `- ${formatRupiah(discountVal)}` : '- Rp 0'}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '1.2rem',
                  fontWeight: 900,
                  color: '#2563eb',
                  paddingTop: '0.5rem',
                  borderTop: '1px solid #e2e8f0',
                  marginTop: '0.2rem',
                }}
              >
                <span>Total</span>
                <span>{formatRupiah(finalTotalVal)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', paddingTop: '0.25rem' }}>
                <span>Dibayar</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatRupiah(cashTenderedVal)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: 800 }}>
                <span>Kembalian</span>
                <span>{formatRupiah(changeDueVal)}</span>
              </div>
            </div>

            {/* Card: Metode Pembayaran */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '1rem 1.15rem',
                borderRadius: '16px',
                marginTop: '1rem',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.2rem', letterSpacing: '0.03em' }}>
                  Metode Pembayaran
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
                  {paymentMethod === 'QRIS' ? 'QRIS' : paymentMethod === 'TRANSFER' ? 'Transfer Bank' : 'TUNAI / CASH'}
                </div>
                {paymentMethod === 'QRIS' && (
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem', fontWeight: 600 }}>
                    Bank BCA <br /> No. Ref: 123456789012
                  </div>
                )}
                {paymentMethod === 'TRANSFER' && (
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem', fontWeight: 600 }}>
                    Transfer Bank Rekening Toko
                  </div>
                )}
              </div>

              {/* Graphic Icon */}
              {paymentMethod === 'QRIS' ? (
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '0.4rem 0.6rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#0f172a', letterSpacing: '0.05em' }}>'GRIS</span>
                  <QrCode size={20} color="#2563eb" />
                </div>
              ) : paymentMethod === 'TRANSFER' ? (
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={22} color="#d97706" />
                </div>
              ) : (
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Banknote size={22} color="#16a34a" />
                </div>
              )}
            </div>
          </div>

          {/* Footer Action Buttons (Identik Gambar Referensi User) */}
          <div
            className="no-print"
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #f1f5f9',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
              background: '#ffffff',
            }}
          >
            {/* Tombol 1: Cetak Struk */}
            <button
              onClick={handlePrintReceipt}
              style={{
                padding: '0.8rem 1rem',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                background: '#f1f5f9',
                color: '#0f172a',
                fontWeight: 800,
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                transition: 'all 0.15s ease',
              }}
            >
              <Printer size={18} color="#0f172a" /> Cetak Struk
            </button>

            {/* Tombol 2: Batalkan Transaksi */}
            {!isCancelled ? (
              <button
                onClick={() => setShowConfirmCancel(true)}
                style={{
                  padding: '0.8rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid #fecaca',
                  background: '#fef2f2',
                  color: '#dc2626',
                  fontWeight: 800,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 2px 4px rgba(220, 38, 38, 0.05)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Trash2 size={18} color="#dc2626" /> Batalkan Transaksi
              </button>
            ) : (
              <button
                disabled
                style={{
                  padding: '0.8rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid #fecaca',
                  background: '#fff1f2',
                  color: '#991b1b',
                  fontWeight: 800,
                  fontSize: '0.825rem',
                  cursor: 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                }}
              >
                Telah Dibatalkan
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. MODAL PERINGATAN KONFIRMASI PEMBATALAN TRANSAKSI */}
      {showConfirmCancel && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10005,
            padding: '1rem',
          }}
          onClick={() => !cancelling && setShowConfirmCancel(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              maxWidth: '440px',
              width: '100%',
              padding: '1.75rem 1.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1px solid #fecaca',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: 'scaleUp 0.2s ease-out',
            }}
          >
            {/* Red Alert Header Icon Badge */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: '#fef2f2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.15rem',
                boxShadow: '0 8px 20px rgba(220, 38, 38, 0.18)',
              }}
            >
              <AlertTriangle size={34} />
            </div>

            {/* Title */}
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#991b1b', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
              Peringatan Pembatalan Transaksi
            </h3>

            {/* Nota Badge */}
            <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', padding: '0.35rem 0.85rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 800, color: '#b91c1c', marginBottom: '1rem' }}>
              Nota: {txNumber}
            </div>

            {/* Warning Message Box */}
            <div style={{ background: '#fff9f9', border: '1px solid #fee2e2', borderRadius: '14px', padding: '1rem', textAlign: 'left', marginBottom: '1.5rem', fontSize: '0.825rem', color: '#475569', lineHeight: 1.5 }}>
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: 800, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                ⚠️ PERATURAN & EFEK PEMBATALAN:
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <li>Status transaksi akan diubah permanen menjadi <strong>DIBATALKAN</strong>.</li>
                <li>Seluruh stok produk yang terjual pada nota ini akan <strong>otomatis dikembalikan (restock)</strong> ke sistem inventaris.</li>
                <li>Riwayat pembatalan akan dicatat ke dalam <strong>Audit Log Sistem POS</strong>.</li>
              </ul>
            </div>

            {cancelError && (
              <div style={{ background: '#fef2f2', color: '#dc2626', padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '1rem', width: '100%' }}>
                {cancelError}
              </div>
            )}

            {/* Modal Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', width: '100%' }}>
              <button
                type="button"
                onClick={() => setShowConfirmCancel(false)}
                disabled={cancelling}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#334155',
                  fontWeight: 800,
                  fontSize: '0.875rem',
                  cursor: cancelling ? 'not-allowed' : 'pointer',
                }}
              >
                Kembali
              </button>

              <button
                type="button"
                onClick={handleCancelSubmit}
                disabled={cancelling}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.875rem',
                  cursor: cancelling ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                {cancelling ? 'Membatalkan...' : 'Ya, Batalkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
