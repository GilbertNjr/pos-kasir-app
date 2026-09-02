import React, { useState, useEffect } from 'react';
import { X, Printer, Trash2, AlertTriangle, QrCode, Banknote, CreditCard, User as UserIcon, ShoppingBag, Edit3 } from 'lucide-react';
import { Transaction, TransactionItem, Product, User } from '../../types';
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
  onEditTransaction?: (transaction: Transaction | any, items: any[]) => void;
  storeName?: string;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isOpen,
  onClose,
  transaction,
  items,
  products = [],
  getUserName,
  onTransactionCancelled,
  onEditTransaction,
  storeName = 'Kedai POS',
}) => {
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [showConfirmEdit, setShowConfirmEdit] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [fetchedItems, setFetchedItems] = useState<any[]>([]);
  const [fetchedProducts, setFetchedProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (isOpen) {
      apiService.getUsers().then(setUsersList).catch(() => []);
      if (!products || products.length === 0) {
        apiService.getProducts().then(setFetchedProducts).catch(() => []);
      }
      
      const initial = (items && items.length > 0) ? items : (transaction?.items || []);
      if (initial.length > 0) {
        setFetchedItems(initial);
      } else if (transaction?.transaction_id || transaction?.id) {
        const txId = transaction.transaction_id || transaction.id;
        apiService.getTransactionItems(txId).then((res) => {
          if (res && res.length > 0) {
            setFetchedItems(res);
          }
        }).catch(() => []);
      }
    } else {
      setFetchedItems([]);
    }
  }, [isOpen, transaction, items, products]);

  if (!isOpen || !transaction) return null;

  const resolveCashierName = () => {
    const rawUserId = transaction.created_by_user_id || transaction.user_id;
    if (transaction.created_by_user_name && transaction.created_by_user_name !== rawUserId) return transaction.created_by_user_name;
    if (getUserName && rawUserId) {
      const nameFromProp = getUserName(rawUserId);
      if (nameFromProp && nameFromProp !== rawUserId) return nameFromProp;
    }
    if (transaction.cashier_name && transaction.cashier_name !== rawUserId) return transaction.cashier_name;
    if (transaction.user_name && transaction.user_name !== rawUserId) return transaction.user_name;

    if (rawUserId) {
      const found = usersList.find((u) => u.user_id === rawUserId || u.username === rawUserId || u.full_name === rawUserId);
      if (found) return found.full_name || found.username;
    }
    return rawUserId || 'Kasir';
  };

  // Extract transaction detail variables safely
  const txNumber = transaction.transaction_number || transaction.transaction_id || 'TRX-00000';
  const isCancelled = transaction.status === 'CANCELLED';
  const txTime = transaction.transaction_time ? formatWaktuIndo(transaction.transaction_time) : '-';
  const cashierName = resolveCashierName();
  const customerName = transaction.customer_name || 'Pelanggan Umum';
  const paymentMethod = (transaction.payment_method || 'CASH').toUpperCase();

  // Combine items safely with fallback product names
  const rawDetailItems: any[] = fetchedItems.length > 0 
    ? fetchedItems 
    : (items && items.length > 0 ? items : (transaction.items || []));

  const allAvailableProducts = (products && products.length > 0) ? products : fetchedProducts;

  const detailItems: any[] = rawDetailItems.map((item: any) => {
    const pId = item.product_id || item.product?.product_id;
    const matchedProd = allAvailableProducts.find((p) => p.product_id === pId);
    return {
      ...item,
      product_id: pId,
      product_name: item.product_name || item.name || (matchedProd ? matchedProd.product_name : 'Produk POS'),
      unit_price: Number(item.unit_price || item.price || matchedProd?.selling_price || 0),
      qty: Number(item.qty || item.quantity || 1),
    };
  });

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

  const [printLayout, setPrintLayout] = useState<'THERMAL_58' | 'INVOICE_A4'>('THERMAL_58');

  const handlePrintReceipt = () => {
    const isA4 = printLayout === 'INVOICE_A4';
    const printWin = window.open('', '_blank', isA4 ? 'width=800,height=900' : 'width=420,height=700');
    if (!printWin) {
      alert('Harap izinkan popup browser untuk mencetak struk.');
      return;
    }

    try {
      printWin.opener = null;
    } catch {
      // Ignore
    }

    if (isA4) {
      // ===== INVOICE / NOTA KWITANSI A4 ELEGAN & RESMI =====
      const itemRowsA4 = detailItems
        .map((item: any, idx: number) => {
          const matchedProd = products.find((p) => p.product_id === item.product_id);
          const pName = item.product_name || (matchedProd ? matchedProd.product_name : `Produk #${idx + 1}`);
          const qty = Number(item.qty || item.quantity || 1);
          const price = Number(item.unit_price || 0);
          const sub = Number(item.subtotal || price * qty);

          return `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 12px; text-align: center;">${idx + 1}</td>
            <td style="padding: 10px 12px; font-weight: 600;">${pName}</td>
            <td style="padding: 10px 12px; text-align: center;">${qty}</td>
            <td style="padding: 10px 12px; text-align: right;">${formatRupiah(price)}</td>
            <td style="padding: 10px 12px; text-align: right; font-weight: 700;">${formatRupiah(sub)}</td>
          </tr>
        `;
        })
        .join('');

      printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Nota Kwitansi Pembayaran - ${txNumber}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; background: #ffffff; margin: 0; padding: 20px; font-size: 13px; line-height: 1.5; }
            .header-container { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; }
            .store-name { font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
            .store-sub { font-size: 12px; color: #64748b; margin-top: 2px; }
            .invoice-title { font-size: 22px; font-weight: 900; color: #1e40af; text-transform: uppercase; text-align: right; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 25px; }
            .meta-item { font-size: 12px; margin-bottom: 4px; }
            .meta-label { font-weight: 700; color: #475569; display: inline-block; width: 110px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            th { background: #0f172a; color: #ffffff; padding: 10px 12px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
            .summary-box { width: 320px; margin-left: auto; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; }
            .summary-row { display: flex; justify-content: space-between; padding: 8px 14px; font-size: 12px; border-bottom: 1px solid #e2e8f0; }
            .summary-row.total { background: #eff6ff; font-weight: 900; font-size: 15px; color: #1e40af; border-bottom: none; }
            .footer-sig { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
            .sig-space { border-bottom: 1.5px solid #0f172a; width: 180px; text-align: center; padding-bottom: 40px; font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div>
              <div class="store-name">${(storeName || 'KEDAI POS / PRINTING & FNB').toUpperCase()}</div>
              <div class="store-sub">Layanan Fotokopi, Printing, ATK & Kuliner F&B</div>
              <div class="store-sub">Nota Transaksi Bukti Pembayaran Resmi</div>
            </div>
            <div>
              <div class="invoice-title">KWITANSI / NOTA</div>
              <div style="text-align: right; font-weight: 700; color: #64748b; font-size: 12px;">NO: ${txNumber}</div>
            </div>
          </div>

          <div class="meta-grid">
            <div>
              <div class="meta-item"><span class="meta-label">Waktu Transaksi:</span> <strong>${txTime}</strong></div>
              <div class="meta-item"><span class="meta-label">Kasir PJ:</span> <strong>${cashierName}</strong></div>
            </div>
            <div>
              <div class="meta-item"><span class="meta-label">Nama Pelanggan:</span> <strong>${customerName}</strong></div>
              <div class="meta-item"><span class="meta-label">Metode Bayar:</span> <strong>${paymentMethod} (${isCancelled ? 'DIBATALKAN' : 'LUNAS'})</strong></div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">No</th>
                <th style="text-align: left;">Deskripsi Produk / Jasa</th>
                <th style="width: 70px; text-align: center;">Jumlah</th>
                <th style="width: 120px; text-align: right;">Harga Satuan</th>
                <th style="width: 140px; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemRowsA4}
            </tbody>
          </table>

          <div class="summary-box">
            <div class="summary-row"><span>Subtotal Total</span><span>${formatRupiah(subtotalVal)}</span></div>
            ${discountVal > 0 ? `<div class="summary-row" style="color: #dc2626;"><span>Diskon Potongan</span><span>-${formatRupiah(discountVal)}</span></div>` : ''}
            <div class="summary-row total"><span>GRAND TOTAL</span><span>${formatRupiah(finalTotalVal)}</span></div>
            <div class="summary-row"><span>Nominal Bayar (${paymentMethod})</span><span>${formatRupiah(cashTenderedVal)}</span></div>
            <div class="summary-row"><span>Kembalian</span><span>${formatRupiah(changeDueVal)}</span></div>
          </div>

          <div class="footer-sig">
            <div style="font-size: 11px; color: #64748b;">
              * Terima kasih atas kunjungan & kepercayaan Anda!<br/>
              * Barang/Jasa yang telah dibeli tidak dapat ditukar/dikembalikan.
            </div>
            <div class="sig-space">
              ( ${cashierName} )<br/>
              <span style="font-size: 10px; font-weight: normal; color: #64748b;">Kasir Penanggung Jawab</span>
            </div>
          </div>

          <script>
            window.onload = function() {
              try { window.print(); } catch(e) {}
              setTimeout(function() { try { window.close(); } catch(e) {} }, 500);
            };
          </script>
        </body>
        </html>
      `);
      printWin.document.close();
      return;
    }

    // ===== STRUK THERMAL 58MM RAMPING =====
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
          table { width: 100%; border-collapse: collapse; font-size: 11px; table-layout: fixed; }
        </style>
      </head>
      <body>
        <div class="center bold" style="font-size: 14px;">${(storeName || 'Kedai POS').toUpperCase()}</div>
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
      {/* 1. UTAMA: MODAL DETAIL TRANSAKSI (RESPONSIVE MOBILE OPTIMIZED) */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10050,
          padding: 'clamp(0.35rem, 2vw, 1rem)',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          className="printable-receipt-modal"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#ffffff',
            width: '100%',
            maxWidth: '460px',
            borderRadius: '20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #cbd5e1',
            overflow: 'hidden',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            animation: 'scaleUp 0.2s ease-out',
            boxSizing: 'border-box',
          }}
        >
          {/* Header Bar */}
          <div
            className="no-print"
            style={{
              padding: '0.95rem 1.15rem',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#ffffff',
            }}
          >
            <h3 style={{ fontSize: 'clamp(1rem, 3.5vw, 1.15rem)', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
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
                flexShrink: 0,
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div style={{ padding: 'clamp(0.65rem, 2.5vw, 1rem)', overflowY: 'auto', flex: 1 }}>
            {/* Header Nota ID & Status Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', gap: '0.5rem' }}>
              <h2 style={{ fontSize: 'clamp(1.1rem, 4vw, 1.35rem)', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {txNumber}
              </h2>
              {isCancelled ? (
                <span
                  style={{
                    background: '#fef2f2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    fontSize: '0.725rem',
                    fontWeight: 800,
                    padding: '0.2rem 0.55rem',
                    borderRadius: '8px',
                    whiteSpace: 'nowrap',
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
                    fontSize: '0.725rem',
                    fontWeight: 800,
                    padding: '0.2rem 0.55rem',
                    borderRadius: '8px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Lunas
                </span>
              )}
            </div>

            {/* Timestamp & Kasir Line */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#64748b', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.25rem' }}>
              <span>{txTime}</span>
              <span style={{ fontWeight: 700, color: '#475569' }}>Kasir: {cashierName}</span>
            </div>

            {/* Card: Informasi Pelanggan */}
            <div style={{ background: '#f8fafc', padding: '0.75rem 0.85rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.725rem', fontWeight: 800, color: '#2563eb', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <UserIcon size={13} /> Informasi Pelanggan
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                👤 {customerName}
              </div>
            </div>

            {/* Section: Detail Item */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <ShoppingBag size={13} color="#6366f1" /> Detail Item
              </div>

              <div style={{ borderRadius: '12px', border: '1px solid #e2e8f0', overflowX: 'auto', WebkitOverflowScrolling: 'touch', background: '#ffffff', width: '100%' }}>
                <table style={{ width: '100%', minWidth: '290px', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', color: '#64748b', textAlign: 'left', borderBottom: '1px solid #e2e8f0', fontSize: '0.7rem' }}>
                      <th style={{ padding: '0.5rem 0.2rem 0.5rem 0.4rem', width: '40%' }}>Produk</th>
                      <th style={{ padding: '0.5rem 0.1rem', textAlign: 'center', width: '15%' }}>Qty</th>
                      <th style={{ padding: '0.5rem 0.2rem', textAlign: 'right', width: '22.5%' }}>Harga</th>
                      <th style={{ padding: '0.5rem 0.4rem 0.5rem 0.2rem', textAlign: 'right', width: '22.5%' }}>Subtotal</th>
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
                            <td style={{ padding: '0.5rem 0.2rem 0.5rem 0.4rem', fontWeight: 700, color: '#0f172a', wordBreak: 'break-word', lineHeight: 1.3, fontSize: '0.775rem' }}>{pName}</td>
                            <td style={{ padding: '0.5rem 0.1rem', textAlign: 'center', fontWeight: 700, color: '#475569' }}>{qty}</td>
                            <td style={{ padding: '0.5rem 0.2rem', textAlign: 'right', color: '#64748b', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>{formatRupiah(price)}</td>
                            <td style={{ padding: '0.5rem 0.4rem 0.5rem 0.2rem', textAlign: 'right', fontWeight: 800, color: '#0f172a', fontSize: 'clamp(0.7rem, 2.7vw, 0.775rem)', whiteSpace: 'nowrap' }}>{formatRupiah(sub)}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>
                          Detail rincian item produk tidak tersedia.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Rincian Finansial Summary */}
            <div style={{ background: '#ffffff', padding: '0.5rem 0.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.825rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>{formatRupiah(subtotalVal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: discountVal > 0 ? '#dc2626' : '#64748b' }}>
                <span>Diskon</span>
                <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{discountVal > 0 ? `- ${formatRupiah(discountVal)}` : '- Rp 0'}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 'clamp(1rem, 3.8vw, 1.2rem)',
                  fontWeight: 900,
                  color: '#2563eb',
                  paddingTop: '0.45rem',
                  borderTop: '1px solid #e2e8f0',
                  marginTop: '0.15rem',
                }}
              >
                <span>Total</span>
                <span style={{ whiteSpace: 'nowrap' }}>{formatRupiah(finalTotalVal)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', paddingTop: '0.2rem' }}>
                <span>Dibayar</span>
                <span style={{ fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>{formatRupiah(cashTenderedVal)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: 800 }}>
                <span>Kembalian</span>
                <span style={{ whiteSpace: 'nowrap' }}>{formatRupiah(changeDueVal)}</span>
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

          {/* Print Layout Mode Selector Bar */}
          <div className="no-print" style={{ padding: '0.65rem 1.5rem 0 1.5rem', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.725rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              🖨️ Format & Mode Cetak Nota:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setPrintLayout('THERMAL_58')}
                style={{
                  padding: '0.45rem 0.5rem',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  border: printLayout === 'THERMAL_58' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: printLayout === 'THERMAL_58' ? '#eff6ff' : '#ffffff',
                  color: printLayout === 'THERMAL_58' ? '#1d4ed8' : '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                🧾 Struk 58mm (Kasir)
              </button>

              <button
                type="button"
                onClick={() => setPrintLayout('INVOICE_A4')}
                style={{
                  padding: '0.45rem 0.5rem',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  border: printLayout === 'INVOICE_A4' ? '2px solid #059669' : '1px solid #cbd5e1',
                  background: printLayout === 'INVOICE_A4' ? '#ecfdf5' : '#ffffff',
                  color: printLayout === 'INVOICE_A4' ? '#047857' : '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                📄 Kwitansi A4 / F4 (Resmi)
              </button>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div
            className="no-print"
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #f1f5f9',
              display: 'grid',
              gridTemplateColumns: !isCancelled && onEditTransaction ? '1fr 1.2fr 1fr' : '1fr 1fr',
              gap: '0.5rem',
              background: '#ffffff',
            }}
          >
            {/* Tombol 1: Cetak Struk */}
            <button
              onClick={handlePrintReceipt}
              style={{
                padding: '0.75rem 0.6rem',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                background: '#f1f5f9',
                color: '#0f172a',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                transition: 'all 0.15s ease',
              }}
            >
              <Printer size={16} color="#0f172a" /> Cetak
            </button>

            {/* Tombol 2: Edit / Load Ke Keranjang */}
            {!isCancelled && onEditTransaction && (
              <button
                onClick={() => setShowConfirmEdit(true)}
                style={{
                  padding: '0.75rem 0.6rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  boxShadow: '0 2px 6px rgba(217, 119, 6, 0.25)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Edit3 size={16} /> Edit Nota
              </button>
            )}

            {/* Tombol 3: Batalkan Transaksi */}
            {!isCancelled ? (
              <button
                onClick={() => setShowConfirmCancel(true)}
                style={{
                  padding: '0.75rem 0.6rem',
                  borderRadius: '12px',
                  border: '1px solid #fecaca',
                  background: '#fef2f2',
                  color: '#dc2626',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  boxShadow: '0 2px 4px rgba(220, 38, 38, 0.05)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Trash2 size={16} color="#dc2626" /> Void / Batal
              </button>
            ) : (
              <button
                disabled
                style={{
                  padding: '0.75rem 0.6rem',
                  borderRadius: '12px',
                  border: '1px solid #fecaca',
                  background: '#fff1f2',
                  color: '#991b1b',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  cursor: 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
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
            zIndex: 10060,
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

      {/* Modal Konfirmasi Edit & Load ke Keranjang */}
      {showConfirmEdit && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10060,
            padding: '1rem',
          }}
          onClick={() => !cancelling && setShowConfirmEdit(false)}
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
              border: '1px solid #fde68a',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: 'scaleUp 0.2s ease-out',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: '#fef3c7',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.15rem',
                boxShadow: '0 8px 20px rgba(217, 119, 6, 0.18)',
              }}
            >
              <Edit3 size={34} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#92400e', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
              Edit / Koreksi Nota Order
            </h3>

            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '0.35rem 0.85rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 800, color: '#b45309', marginBottom: '1rem' }}>
              Nota: {txNumber}
            </div>

            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '14px', padding: '1rem', textAlign: 'left', marginBottom: '1.5rem', fontSize: '0.825rem', color: '#475569', lineHeight: 1.5 }}>
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                ✏️ ALUR EDIT & KOREKSI:
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <li>Nota <strong>{txNumber}</strong> ini akan dibatalkan otomatis agar stok dikembalikan.</li>
                <li>Seluruh <strong>{detailItems.length} jenis item</strong> akan langsung dimasukkan kembali ke <strong>Keranjang Kasir Active</strong>.</li>
                <li>Anda dapat mengubah jumlah, menambah/menghapus item, lalu memproses checkout ulang.</li>
              </ul>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', width: '100%' }}>
              <button
                type="button"
                onClick={() => setShowConfirmEdit(false)}
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
                Batal
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (onEditTransaction) {
                    await onEditTransaction(transaction, detailItems);
                  }
                  setShowConfirmEdit(false);
                  onClose();
                }}
                disabled={cancelling}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.875rem',
                  cursor: cancelling ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(217, 119, 6, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                {cancelling ? 'Memuat...' : '✏️ Load ke Keranjang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
