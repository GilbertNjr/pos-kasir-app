/**
 * Helper Terpusat Warna Badge Metode Pembayaran:
 * - QRIS: BIRU (#1d4ed8, background #eff6ff, border #bfdbfe)
 * - TUNAI / CASH: HIJAU (#047857, background #ecfdf5, border #a7f3d0)
 * - TRANSFER: KUNING (#b45309, background #fffbeb, border #fde68a)
 */

export interface PaymentBadgeStyle {
  bg: string;
  color: string;
  border: string;
  text: string;
}

export const getPaymentBadgeStyle = (method: string): PaymentBadgeStyle => {
  const m = (method || '').toUpperCase();
  if (m === 'QRIS') {
    return {
      bg: '#eff6ff',
      color: '#1d4ed8',
      border: '#bfdbfe',
      text: 'QRIS (BIRU)',
    };
  }
  if (m === 'CASH' || m === 'TUNAI') {
    return {
      bg: '#ecfdf5',
      color: '#047857',
      border: '#a7f3d0',
      text: m === 'CASH' ? 'CASH (HIJAU)' : 'TUNAI (HIJAU)',
    };
  }
  if (m === 'TRANSFER' || m === 'BANK_TRANSFER') {
    return {
      bg: '#fffbeb',
      color: '#b45309',
      border: '#fde68a',
      text: 'TRANSFER (KUNING)',
    };
  }
  return {
    bg: '#f3e8ff',
    color: '#7e22ce',
    border: '#e9d5ff',
    text: m || 'LAINNYA',
  };
};
