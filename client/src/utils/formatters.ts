/**
 * Formatter Utility Helper
 */

/**
 * Format angka ke format mata uang Rupiah (IDR)
 * Contoh: 50000 -> "Rp 50.000"
 */
export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format ISO Timestamp ke format tanggal & waktu Indonesia
 * Contoh: "2026-08-14T10:00:00Z" -> "14 Agu 2026, 17:00 WIB"
 */
export const formatWaktuIndo = (isoString?: string): string => {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};
