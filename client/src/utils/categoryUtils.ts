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
  // PRIORITY 1: IF DATABASE CATEGORY (catName) IS EXPLICITLY SET, RESPECT IT FIRST!
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

    if (catName.includes('snack') || catName.includes('camilan') || catName.includes('keripik')) {
      return 'snack';
    }

    if (catName.includes('gorengan') || catName.includes('goreng') || catName.includes('jajan')) {
      return 'gorengan';
    }

    if (catName.includes('makanan')) {
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
  // PRIORITY 2: FALLBACK TO PRODUCT NAME KEYWORD MATCHING IF CATEGORY NAME IS UNASSIGNED/GENERIC
  // ----------------------------------------------------
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
    normPName.includes('campina');

  if (isEsKrimProduct) return 'es_krim';

  if (normPName.includes('seblak')) return 'seblak';

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
    normPName.includes('sosis') ||
    normPName.includes('nugget') ||
    normPName.includes('otak') ||
    normPName.includes('singkong') ||
    normPName.includes('ubi') ||
    normPName.includes('gandasturi') ||
    normPName.includes('lilit') ||
    normPName.includes('geprek') ||
    normPName.includes('crispy') ||
    normPName.includes('krispi');

  if (isGorenganProduct) return 'gorengan';

  const isSnackProduct =
    normPName.includes('snack') ||
    normPName.includes('chiki') ||
    (normPName.includes('beng beng') && !normPName.includes('es beng beng')) ||
    (normPName.includes('chocolatos') && !normPName.includes('es chocolatos') && !normPName.includes('es chocolato')) ||
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

  if (isSnackProduct) return 'snack';

  if (product.business_unit === 'FC_PRINT') {
    if (normPName.includes('atk') || normPName.includes('pulpen') || normPName.includes('pensil') || normPName.includes('buku') || normPName.includes('kertas')) return 'atk';
    if (normPName.includes('fotokopi') || normPName.includes('fotocopy') || normPName.includes('fc') || normPName.includes('copy')) return 'fotokopi';
    if (normPName.includes('print') || normPName.includes('cetak')) return 'printing';
    if (normPName.includes('jasa') || normPName.includes('desain') || normPName.includes('ketik') || normPName.includes('laminasi')) return 'jasa';
    return 'dll_fc';
  }

  return 'dll_makanan';
};
