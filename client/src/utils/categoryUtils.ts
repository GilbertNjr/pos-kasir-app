/**
 * Single source of truth for classifying products into exclusive category buckets.
 * Returns EXACTLY ONE bucket ID to prevent cross-category overlaps (e.g., Ice Cream showing in Snack/Food).
 */
export const getProductCategoryBucket = (
  product: { product_name: string; business_unit?: string },
  rawCategoryName: string
): string => {
  const catName = (rawCategoryName || '').toLowerCase().trim();
  const rawPName = (product.product_name || '').toLowerCase().trim();

  // Normalize product name by converting hyphens, underscores, and multiple spaces into a single space
  const normPName = rawPName.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ');

  // ----------------------------------------------------
  // 1. ES KRIM ('es_krim')
  // High priority check for ice cream brands and terms
  // ----------------------------------------------------
  const isEsKrimCategory =
    catName.includes('es krim') ||
    catName.includes('eskrim') ||
    catName.includes('ice cream') ||
    catName.includes('icecream') ||
    catName.includes('aice') ||
    catName.includes('kul kul') ||
    catName.includes('walls') ||
    catName.includes('joyday') ||
    catName.includes('campina');

  const isEsKrimProduct =
    normPName.includes('es krim') ||
    normPName.includes('eskrim') ||
    normPName.includes('ice cream') ||
    normPName.includes('aice') ||
    normPName.includes('kul kul') ||
    normPName.includes('kulkul') ||
    normPName.includes('lolipop es') ||
    normPName.includes('sundae') ||
    normPName.includes('mochi') ||
    normPName.includes('walls') ||
    normPName.includes('joyday') ||
    normPName.includes('campina') ||
    (normPName.includes('choco malt') && normPName.includes('aice')) ||
    (normPName.includes('sweet corn') && normPName.includes('aice')) ||
    (normPName.includes('miki miki') && normPName.includes('aice')) ||
    (normPName.includes('semangka') && normPName.includes('aice')) ||
    (normPName.includes('taro') && normPName.includes('aice')) ||
    (normPName.includes('rock') && (normPName.includes('kul') || normPName.includes('aice')));

  if (isEsKrimCategory || isEsKrimProduct) {
    return 'es_krim';
  }

  // ----------------------------------------------------
  // 2. GORENGAN ('gorengan')
  // ----------------------------------------------------
  const isGorenganCategory = catName.includes('gorengan');
  const isGorenganProduct =
    normPName.includes('gorengan') ||
    normPName.includes('tahu goreng') ||
    normPName.includes('tempe goreng') ||
    normPName.includes('bakwan') ||
    normPName.includes('pisang goreng') ||
    normPName.includes('cireng') ||
    normPName.includes('risol');

  if (isGorenganCategory || isGorenganProduct) {
    return 'gorengan';
  }

  // ----------------------------------------------------
  // 3. MINUMAN ('minuman')
  // ----------------------------------------------------
  const isMinumanCategory =
    catName.includes('minuman') ||
    catName.includes('drink') ||
    catName.includes('kopi') ||
    catName.includes('teh');

  const isMinumanProduct =
    normPName.includes('minuman') ||
    normPName.includes('es teh') ||
    normPName.includes('kopi') ||
    normPName.includes('teh manis') ||
    normPName.includes('aquviva') ||
    normPName.includes('air mineral') ||
    normPName.includes('jus') ||
    normPName.includes('boba') ||
    normPName.includes('pop ice') ||
    normPName.includes('nutrisari') ||
    normPName.includes('good day');

  if (isMinumanCategory || isMinumanProduct) {
    return 'minuman';
  }

  // ----------------------------------------------------
  // 4. SNACK ('snack')
  // ----------------------------------------------------
  const isSnackCategory =
    catName.includes('snack') ||
    catName.includes('camilan') ||
    catName.includes('keripik');

  const isSnackProduct =
    normPName.includes('snack') ||
    normPName.includes('chiki') ||
    normPName.includes('beng beng') ||
    normPName.includes('chocolatos') ||
    normPName.includes('coki coki') ||
    normPName.includes('wafel') ||
    normPName.includes('widaran') ||
    normPName.includes('zyluc') ||
    normPName.includes('duosus') ||
    normPName.includes('keripik') ||
    normPName.includes('roti') ||
    normPName.includes('wafer') ||
    normPName.includes('biskuit') ||
    normPName.includes('tango') ||
    normPName.includes('roma');

  if (isSnackCategory || isSnackProduct) {
    return 'snack';
  }

  // ----------------------------------------------------
  // 5. FC / PRINTING CATEGORIES
  // ----------------------------------------------------
  if (product.business_unit === 'FC_PRINT') {
    const isAtkCategory = catName.includes('atk') || catName.includes('tulis') || catName.includes('buku') || catName.includes('kertas');
    const isAtkProduct = normPName.includes('atk') || normPName.includes('pulpen') || normPName.includes('pensil') || normPName.includes('buku') || normPName.includes('kertas') || normPName.includes('hvs') || normPName.includes('penggaris') || normPName.includes('spidol') || normPName.includes('map') || normPName.includes('amplop');
    if (isAtkCategory || isAtkProduct) return 'atk';

    const isFotokopiCategory = catName.includes('fotokopi') || catName.includes('copy') || catName.includes('fc');
    const isFotokopiProduct = normPName.includes('fotokopi') || normPName.includes('fotocopy') || normPName.includes('fc') || normPName.includes('copy');
    if (isFotokopiCategory || isFotokopiProduct) return 'fotokopi';

    const isPrintingCategory = catName.includes('print') || catName.includes('cetak');
    const isPrintingProduct = normPName.includes('print') || normPName.includes('cetak') || normPName.includes('banner') || normPName.includes('stiker');
    if (isPrintingCategory || isPrintingProduct) return 'printing';

    const isJasaCategory = catName.includes('jasa') || catName.includes('desain') || catName.includes('ketik') || catName.includes('laminasi');
    const isJasaProduct = normPName.includes('jasa') || normPName.includes('desain') || normPName.includes('ketik') || normPName.includes('laminasi') || normPName.includes('scan') || normPName.includes('stempel');
    if (isJasaCategory || isJasaProduct) return 'jasa';

    return 'dll_fc';
  }

  // ----------------------------------------------------
  // 6. DEFAULT FALLBACK FOR FNB: DLL / MAKANAN ('dll_makanan')
  // ----------------------------------------------------
  return 'dll_makanan';
};
