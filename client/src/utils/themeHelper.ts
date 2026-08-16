export interface ThemePalette {
  id: string;
  name: string;
  primaryHex: string;
  secondaryHex: string;
  gradient: string;
  sidebarBg: string;
  sidebarBorder: string;
  accentBg: string;
  accentText: string;
  dashboardBg: string;
}

export const THEME_PALETTES: Record<string, ThemePalette> = {
  brown: {
    id: 'brown',
    name: 'Coklat Mocha',
    primaryHex: '#b45309',
    secondaryHex: '#92400e',
    gradient: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
    sidebarBg: '#1c140e',
    sidebarBorder: '#2e1c12',
    accentBg: 'rgba(180, 83, 9, 0.15)',
    accentText: '#b45309',
    dashboardBg: '#fcf8f6',
  },
  blue: {
    id: 'blue',
    name: 'Biru Classic',
    primaryHex: '#2563eb',
    secondaryHex: '#1d4ed8',
    gradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    sidebarBg: '#0f172a',
    sidebarBorder: '#1e293b',
    accentBg: 'rgba(37, 99, 235, 0.15)',
    accentText: '#2563eb',
    dashboardBg: '#f8fafc',
  },
  emerald: {
    id: 'emerald',
    name: 'Hijau Fresh',
    primaryHex: '#10b981',
    secondaryHex: '#059669',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    sidebarBg: '#064e3b',
    sidebarBorder: '#065f46',
    accentBg: 'rgba(16, 185, 129, 0.15)',
    accentText: '#059669',
    dashboardBg: '#f4fbf7',
  },
  purple: {
    id: 'purple',
    name: 'Ungu Modern',
    primaryHex: '#7c3aed',
    secondaryHex: '#6d28d9',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
    sidebarBg: '#2e1065',
    sidebarBorder: '#3b0764',
    accentBg: 'rgba(124, 58, 237, 0.15)',
    accentText: '#7c3aed',
    dashboardBg: '#faf5ff',
  },
  amber: {
    id: 'amber',
    name: 'Warm Amber',
    primaryHex: '#d97706',
    secondaryHex: '#b45309',
    gradient: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
    sidebarBg: '#451a03',
    sidebarBorder: '#78350f',
    accentBg: 'rgba(217, 119, 6, 0.15)',
    accentText: '#d97706',
    dashboardBg: '#fffbeb',
  },
  dark_slate: {
    id: 'dark_slate',
    name: 'Dark Charcoal',
    primaryHex: '#334155',
    secondaryHex: '#1e293b',
    gradient: 'linear-gradient(135deg, #475569 0%, #0f172a 100%)',
    sidebarBg: '#020617',
    sidebarBorder: '#0f172a',
    accentBg: 'rgba(51, 65, 85, 0.15)',
    accentText: '#475569',
    dashboardBg: '#f1f5f9',
  },
};

export const applyGlobalTheme = (
  colorKeyOrHex: string,
  customSidebarBg?: string,
  customDashboardBg?: string
) => {
  let palette: ThemePalette;

  if (THEME_PALETTES[colorKeyOrHex]) {
    palette = { ...THEME_PALETTES[colorKeyOrHex] };
  } else if (colorKeyOrHex && colorKeyOrHex.startsWith('#')) {
    const hex = colorKeyOrHex;
    palette = {
      id: hex,
      name: `Kustom (${hex})`,
      primaryHex: hex,
      secondaryHex: hex,
      gradient: `linear-gradient(135deg, ${hex} 0%, #111827 100%)`,
      sidebarBg: customSidebarBg || '#18181b',
      sidebarBorder: '#27272a',
      accentBg: `${hex}25`,
      accentText: hex,
      dashboardBg: customDashboardBg || '#f8fafc',
    };
  } else {
    palette = { ...THEME_PALETTES.brown };
  }

  if (customSidebarBg && customSidebarBg.startsWith('#')) {
    palette.sidebarBg = customSidebarBg;
  }

  if (customDashboardBg && customDashboardBg.startsWith('#')) {
    palette.dashboardBg = customDashboardBg;
  }

  const root = document.documentElement;
  root.style.setProperty('--color-primary', palette.primaryHex);
  root.style.setProperty('--color-primary-dark', palette.secondaryHex);
  root.style.setProperty('--primary-gradient', palette.gradient);
  root.style.setProperty('--sidebar-bg', palette.sidebarBg);
  root.style.setProperty('--sidebar-border', palette.sidebarBorder);
  root.style.setProperty('--accent-bg', palette.accentBg);
  root.style.setProperty('--accent-text', palette.accentText);
  root.style.setProperty('--dashboard-bg', palette.dashboardBg);

  localStorage.setItem('pos_app_theme_color', colorKeyOrHex);
  if (palette.sidebarBg) {
    localStorage.setItem('pos_app_sidebar_bg', palette.sidebarBg);
  }
  if (palette.dashboardBg) {
    localStorage.setItem('pos_app_dashboard_bg', palette.dashboardBg);
  }
};
