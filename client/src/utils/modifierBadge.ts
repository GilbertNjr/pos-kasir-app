/**
 * Helper Terpusat Pewarnaan Badge Racikan / Modifier / Topping:
 *
 * 1. Opsi Dimasak / Matang / Goreng / Rebus / Olahan Hangat:
 *    -> HIJAU (#047857, background #ecfdf5, border #a7f3d0)
 *
 * 2. Opsi Dingin / Es / Ice:
 *    -> CYAN / SKY (#0284c7, background #f0f9ff, border #bae6fd)
 *
 * 3. Opsi Pedas / Cabai / Level:
 *    -> MERAH (#dc2626, background #fef2f2, border #fecaca)
 *
 * 4. Opsi Topping / Bahan Tambahan (+ Telur, + Sosis, dsb, atau price > 0):
 *    -> AMBER / KUNING HANGAT (#b45309, background #fffbeb, border #fde68a)
 *
 * 5. Opsi Bungkus / Mentah / Takeaway:
 *    -> BIRU (#1d4ed8, background #eff6ff, border #bfdbfe)
 */

export interface ModifierBadgeStyle {
  bg: string;
  color: string;
  border: string;
}

export const getModifierBadgeStyle = (modifierName: string, price?: number): ModifierBadgeStyle => {
  const lower = (modifierName || '').toLowerCase().trim();

  // 1. Dimasak / Matang / Olahan Saji Hangat -> HIJAU
  if (
    lower.includes('masak') ||
    lower.includes('matang') ||
    lower.includes('goreng') ||
    lower.includes('rebus') ||
    lower.includes('kuah') ||
    lower.includes('panas') ||
    lower.includes('hangat') ||
    lower.includes('bakar') ||
    lower.includes('panggang')
  ) {
    return {
      bg: '#ecfdf5',
      color: '#047857',
      border: '#a7f3d0',
    };
  }

  // 2. Dingin / Es / Ice -> CYAN
  if (
    lower.includes('dingin') ||
    lower.includes('es ') ||
    lower === 'es' ||
    lower.startsWith('es ') ||
    lower.includes('ice') ||
    lower.includes('cold')
  ) {
    return {
      bg: '#f0f9ff',
      color: '#0284c7',
      border: '#bae6fd',
    };
  }

  // 3. Pedas / Cabai -> MERAH
  if (
    lower.includes('pedas') ||
    lower.includes('cabe') ||
    lower.includes('cabai') ||
    lower.includes('level') ||
    lower.includes('spicy')
  ) {
    return {
      bg: '#fef2f2',
      color: '#dc2626',
      border: '#fecaca',
    };
  }

  // 4. Topping / Bahan Tambahan (+ Telur, + Keju, dsb, atau price > 0) -> AMBER / KUNING
  if (lower.startsWith('+') || (price !== undefined && Number(price) > 0)) {
    return {
      bg: '#fffbeb',
      color: '#b45309',
      border: '#fde68a',
    };
  }

  // 5. Bungkus / Mentah / Takeaway -> BIRU
  if (
    lower.includes('bungkus') ||
    lower.includes('mentah') ||
    lower.includes('takeaway') ||
    lower.includes('take away') ||
    lower.includes('bawa pulang')
  ) {
    return {
      bg: '#eff6ff',
      color: '#1d4ed8',
      border: '#bfdbfe',
    };
  }

  // 6. Default Fallback -> Biru Pastel
  return {
    bg: '#eff6ff',
    color: '#1d4ed8',
    border: '#bfdbfe',
  };
};
