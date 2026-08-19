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
  // PRIORITY 1: HIGH-PRECISION PRODUCT NAME KEYWORDS (Seblak & Ice Cream)
  // Ensures products named "Seblak Level 5" or "Aice Mango" are NEVER misclassified
  // into generic "Makanan Utama" even if assigned cat-makanan in DB.
  // ----------------------------------------------------
  const isEsKrimName =
    normPName.includes('es krim') ||
    normPName.includes('eskrim') ||
    normPName.includes('ice cream') ||
    normPName.includes('aice') ||
    normPName.includes('kul kul') ||
    normPName.includes('kulkul') ||
    normPName.includes('lolipop es') ||
    normPName.includes('sundae') ||
    normPName.includes('walls') ||
    normPName.includes('joyday') ||
    normPName.includes('campina');

  if (isEsKrimName) return 'es_krim';
  if (normPName.includes('seblak')) return 'seblak';

  // ----------------------------------------------------
  // PRIORITY 2: EXPLICIT DATABASE CATEGORY NAME (catName)
  // ----------------------------------------------------
  if (catName) {
    if (
      catName.includes('es krim') ||
      catName.includes('eskrim') ||
      catName.includes('ice cream') ||
      catName.includes('icecream') ||
      catName.includes('aice') ||
      catName.includes('walls') ||
      catName.includes('joyday') ||
      catName.includes('campina')
    ) {
      return 'es_krim';
    }

    if (catName.includes('seblak')) {
      return 'seblak';
    }

    if (catName.includes('minuman') || catName.includes('drink') || catName.includes('kopi') || catName.includes('teh')) {
      return 'minuman';
    }

    if (catName.includes('gorengan') || catName.includes('goreng')) {
      return 'gorengan';
    }

    if (catName.includes('snack') || catName.includes('camilan') || catName.includes('keripik')) {
      return 'snack';
    }

    if (catName.includes('atk') || catName.includes('tulis') || catName.includes('buku') || catName.includes('kertas')) {
      return 'atk';
    }

    if (catName.includes('fotokopi') || catName.includes('copy') || catName.includes('fc')) {
      return 'fotokopi';
    }

    if (catName.includes('print') || catName.includes('cetak')) {
      return 'printing';
    }

    if (catName.includes('jasa') || catName.includes('desain') || catName.includes('ketik') || catName.includes('laminasi')) {
      return 'jasa';
    }
  }

  // ----------------------------------------------------
  // PRIORITY 3: FALLBACK TO OTHER PRODUCT NAME KEYWORD MATCHES
  // ----------------------------------------------------
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
    normPName.includes('good day') ||
    normPName.includes('es chocolatos') ||
    normPName.includes('es chocolato') ||
    normPName.includes('es beng beng') ||
    normPName.includes('es milo') ||
    normPName.includes('es capcin') ||
    normPName.includes('es jeruk') ||
    normPName.includes('es cokelat') ||
    normPName.includes('es coklat') ||
    normPName.includes('es sirup') ||
    normPName.includes('es susu') ||
    normPName.includes('chocolatos es');

  if (isMinumanProduct) return 'minuman';

  const isGorenganProduct =
    normPName.includes('gorengan') ||
    normPName.includes('goreng') ||
    normPName.includes('tahu') ||
    normPName.includes('tempe') ||
    normPName.includes('mendoan') ||
    normPName.includes('bakwan') ||
    normPName.includes('bala') ||
    normPName.includes('pisang') ||
    normPName.includes('cireng') ||
    normPName.includes('risol') ||
    normPName.includes('molen') ||
    normPName.includes('pastel') ||
    normPName.includes('lumpia') ||
    normPName.includes('martabak') ||
    normPName.includes('geprek');

  if (isGorenganProduct) return 'gorengan';

  const isSnackProduct =
    normPName.includes('snack') ||
    normPName.includes('camilan') ||
    normPName.includes('keripik') ||
    normPName.includes('chiki') ||
    normPName.includes('wafer') ||
    normPName.includes('biskuit') ||
    normPName.includes('roti') ||
    normPName.includes('sosis') ||
    normPName.includes('nugget') ||
    normPName.includes('french fries') ||
    normPName.includes('kentang');

  if (isSnackProduct) return 'snack';

  const isAtkProduct =
    normPName.includes('pulpen') ||
    normPName.includes('pena') ||
    normPName.includes('pensil') ||
    normPName.includes('buku') ||
    normPName.includes('penghapus') ||
    normPName.includes('penggaris') ||
    normPName.includes('tipp ex') ||
    normPName.includes('tippex') ||
    normPName.includes('tip ex') ||
    normPName.includes('spidol') ||
    normPName.includes('stabilo') ||
    normPName.includes('map') ||
    normPName.includes('amplop') ||
    normPName.includes('kertas') ||
    normPName.includes('binder') ||
    normPName.includes('stapler') ||
    normPName.includes('isi stapler') ||
    normPName.includes('lakban') ||
    normPName.includes('solasi') ||
    normPName.includes('lem');

  if (isAtkProduct) return 'atk';

  const isFotokopiProduct =
    normPName.includes('fotokopi') ||
    normPName.includes('fotocopy') ||
    normPName.includes('foto kopi') ||
    normPName.includes('fc a4') ||
    normPName.includes('fc f4');

  if (isFotokopiProduct) return 'fotokopi';

  const isPrintingProduct =
    normPName.includes('print') ||
    normPName.includes('cetak') ||
    normPName.includes('stiker') ||
    normPName.includes('banner') ||
    normPName.includes('brosur') ||
    normPName.includes('poster');

  if (isPrintingProduct) return 'printing';

  const isJasaProduct =
    normPName.includes('jasa') ||
    normPName.includes('ketik') ||
    normPName.includes('desain') ||
    normPName.includes('laminasi') ||
    normPName.includes('jilid') ||
    normPName.includes('scan');

  if (isJasaProduct) return 'jasa';

  // ----------------------------------------------------
  // PRIORITY 4: GENERIC CATEGORY FALLBACK (e.g. Makanan Utama)
  // ----------------------------------------------------
  if (catName.includes('makanan') || catName.includes('jajan')) {
    return 'snack';
  }

  // Final Business Unit Fallback
  return product.business_unit === 'FC_PRINT' ? 'atk' : 'snack';
};
