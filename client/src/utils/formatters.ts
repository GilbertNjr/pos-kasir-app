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

/**
 * Format tanggal dan waktu ke format Indonesia lengkap: Hari, Tanggal Bulan Tahun & Jam WIB
 * Contoh: ("2026-08-24", "03:28") -> "Senin, 24 Agustus 2026, 03:28 WIB"
 * Contoh: ("2026-08-24 (Jam 03:28 WIB)") -> "Senin, 24 Agustus 2026, 03:28 WIB"
 */
export const formatDateIndoFull = (dateInput?: string | Date, timeInput?: string): string => {
  if (!dateInput) return '-';

  try {
    let rawStr = String(dateInput).trim();
    let extractedTime = timeInput ? timeInput.trim() : '';

    if (rawStr.includes('Jam') || rawStr.includes('WIB')) {
      const timeMatch = rawStr.match(/(\d{1,2}:\d{2})/);
      if (timeMatch) {
        extractedTime = timeMatch[1];
      }
      rawStr = rawStr.split('(')[0].split('|')[0].trim();
    }

    let dateObj: Date;
    if (dateInput instanceof Date) {
      dateObj = dateInput;
    } else if (rawStr.includes('T')) {
      dateObj = new Date(rawStr);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(rawStr)) {
      const [y, m, d] = rawStr.split('-').map(Number);
      dateObj = new Date(y, m - 1, d);
    } else {
      dateObj = new Date(rawStr);
    }

    if (isNaN(dateObj.getTime())) return String(dateInput);

    const dayName = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(dateObj);
    const dayNum = dateObj.getDate();
    const monthName = new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(dateObj);
    const yearNum = dateObj.getFullYear();

    const formattedDate = `${dayName}, ${dayNum} ${monthName} ${yearNum}`;

    if (!extractedTime && typeof dateInput === 'string' && dateInput.includes('T')) {
      const h = String(dateObj.getHours()).padStart(2, '0');
      const min = String(dateObj.getMinutes()).padStart(2, '0');
      extractedTime = `${h}:${min}`;
    }

    if (extractedTime) {
      const cleanTime = extractedTime.replace(/jam/gi, '').replace(/wib/gi, '').trim();
      return `${formattedDate}, ${cleanTime} WIB`;
    }

    return formattedDate;
  } catch {
    return String(dateInput);
  }
};

