export interface StoreBrandingProfile {
  name: string;
  ownerName?: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
}

/**
 * Retrieves the current cached store profile from localStorage or fallback defaults.
 */
export function getStoredBrandingProfile(): StoreBrandingProfile {
  try {
    const cached = localStorage.getItem('pos_store_profile');
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        name: parsed.name && !parsed.name.startsWith('Masukan ') ? parsed.name : 'POS KASIR',
        ownerName: parsed.ownerName || '',
        logoUrl: parsed.logoUrl || '',
        address: parsed.address || '',
        phone: parsed.phone || '',
        email: parsed.email || '',
      };
    }
  } catch (e) {
    // Ignore error
  }
  return {
    name: 'POS KASIR',
    ownerName: '',
    logoUrl: '',
    address: '',
    phone: '',
    email: '',
  };
}

/**
 * Renders HTML Header for Thermal Receipts (58mm / 80mm compact format).
 * Compact logo inline to the left of the store name (matched to font height).
 */
export function renderThermalReceiptHeaderHtml(options: {
  storeName?: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  subtitle?: string;
}): string {
  const profile = getStoredBrandingProfile();
  const name = options.storeName || profile.name || 'POS KASIR';
  const logo = options.logoUrl !== undefined ? options.logoUrl : profile.logoUrl;
  const addr = options.address !== undefined ? options.address : profile.address;
  const ph = options.phone !== undefined ? options.phone : profile.phone;
  const sub = options.subtitle || 'Nota POS Resmi & Shift Transaction';

  const hasLogo = Boolean(logo && logo.trim().length > 0);

  return `
    <div class="center" style="text-align: center; margin-bottom: 4px;">
      <div style="display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 2px;">
        ${
          hasLogo
            ? `<img src="${logo}" alt="${name}" style="height: 18px; max-width: 32px; object-fit: contain; vertical-align: middle; display: inline-block;" />`
            : ''
        }
        <span style="font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #000000; line-height: 1.2;">
          ${name.toUpperCase()}
        </span>
      </div>
      ${addr ? `<div style="font-size: 9.5px; color: #334155; margin-top: 2px;">${addr}</div>` : ''}
      ${ph ? `<div style="font-size: 9.5px; color: #334155;">Telp: ${ph}</div>` : ''}
      <div style="font-size: 10px; margin-top: 3px; font-weight: 600; text-transform: uppercase; color: #475569;">
        ${sub}
      </div>
    </div>
  `;
}

/**
 * Renders HTML Header for Full Page / PDF Reports (A4 / Full Sheet format).
 * Features a modern corporate header with dynamic logo inline to the left of the store name.
 */
export function renderFullPageReportHeaderHtml(options: {
  title: string;
  subtitle?: string;
  storeName?: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  dateRangeStr?: string;
}): string {
  const profile = getStoredBrandingProfile();
  const name = options.storeName || profile.name || 'POS KASIR';
  const logo = options.logoUrl !== undefined ? options.logoUrl : profile.logoUrl;
  const addr = options.address !== undefined ? options.address : profile.address;
  const ph = options.phone !== undefined ? options.phone : profile.phone;
  const emailStr = options.email !== undefined ? options.email : profile.email;

  const hasLogo = Boolean(logo && logo.trim().length > 0);

  return `
    <div style="border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; gap: 16px;">
      <div>
        <div style="display: flex; align-items: center; gap: 8px;">
          ${
            hasLogo
              ? `<img src="${logo}" alt="${name}" style="height: 24px; max-width: 42px; object-fit: contain; vertical-align: middle; border-radius: 4px; display: inline-block;" />`
              : ''
          }
          <h2 style="margin: 0; font-size: 1.25rem; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: -0.01em; display: inline-block;">
            ${name}
          </h2>
        </div>
        ${addr ? `<div style="font-size: 0.8rem; color: #475569; margin-top: 2px; font-weight: 600;">${addr}</div>` : ''}
        <div style="font-size: 0.775rem; color: #64748b; margin-top: 1px; display: flex; gap: 10px;">
          ${ph ? `<span>📞 ${ph}</span>` : ''}
          ${emailStr ? `<span>✉️ ${emailStr}</span>` : ''}
        </div>
      </div>

      <div style="text-align: right;">
        <h1 style="margin: 0; font-size: 1.15rem; font-weight: 900; color: #2563eb; text-transform: uppercase; letter-spacing: 0.02em;">
          ${options.title}
        </h1>
        ${options.subtitle ? `<div style="font-size: 0.825rem; font-weight: 700; color: #475569; margin-top: 2px;">${options.subtitle}</div>` : ''}
        ${options.dateRangeStr ? `<div style="font-size: 0.775rem; color: #64748b; font-weight: 600; margin-top: 3px;">Periode: ${options.dateRangeStr}</div>` : ''}
      </div>
    </div>
  `;
}
