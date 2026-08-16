export interface StoreProfile {
  name: string;
  owner_name: string;
  email: string;
  phone: string;
  description: string;
  logo_url: string;
  address: string;
  district: string;
  city: string;
  postal_code: string;
  country: string;
}

export interface ThemeSettings {
  theme_color: string; // 'blue' | 'emerald' | 'purple' | 'amber' | 'brown' | 'dark_slate'
  sidebar_color: string;
  primary_hex: string;
}

export interface OperatingHours {
  is_enabled: boolean;
  open_time: string;
  close_time: string;
  operating_days: string[];
}

export interface StorePreferences {
  show_zero_stock: boolean;
  low_stock_alert: boolean;
  auto_print_receipt: boolean;
  fast_cashier_mode: boolean;
  total_rounding: boolean;
}

export interface FinanceAndTransactionsSettings {
  tax_ppn_percent: number;
  service_charge_percent: number;
  payment_methods: {
    cash: boolean;
    qris: boolean;
    debit_card: boolean;
    transfer: boolean;
    dp: boolean;
  };
  currency: string;
  timezone: string;
}

export interface SystemSettingsData {
  store_profile: StoreProfile;
  theme_settings: ThemeSettings;
  operating_hours: OperatingHours;
  store_preferences: StorePreferences;
  finance_and_transactions: FinanceAndTransactionsSettings;
  last_backup_time: string | null;
  updated_at: string;
}

class SettingsService {
  private settings: SystemSettingsData = {
    store_profile: {
      name: 'Toko Utama',
      owner_name: 'Ahmat Gebyar Gumelar',
      email: 'gebyargumelar@gmail.com',
      phone: '085808495978',
      description: 'Toko sembako dan kebutuhan sehari-hari.',
      logo_url: '',
      address: 'Jl. Kenanga No. 10, Kediri, Jawa Timur, Indonesia',
      district: 'Mojoroto',
      city: 'Kediri',
      postal_code: '64112',
      country: 'Indonesia',
    },
    theme_settings: {
      theme_color: 'brown',
      sidebar_color: '#1c140e',
      primary_hex: '#b45309',
    },
    operating_hours: {
      is_enabled: true,
      open_time: '07:00',
      close_time: '22:00',
      operating_days: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
    },
    store_preferences: {
      show_zero_stock: false,
      low_stock_alert: true,
      auto_print_receipt: true,
      fast_cashier_mode: false,
      total_rounding: false,
    },
    finance_and_transactions: {
      tax_ppn_percent: 11,
      service_charge_percent: 5,
      payment_methods: {
        cash: true,
        qris: true,
        debit_card: true,
        transfer: true,
        dp: true,
      },
      currency: 'Rupiah (IDR)',
      timezone: 'Asia/Jakarta (WIB)',
    },
    last_backup_time: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  public async getSettings(): Promise<SystemSettingsData> {
    return { ...this.settings };
  }

  public async updateSettings(newSettings: Partial<SystemSettingsData>): Promise<SystemSettingsData> {
    if (newSettings.store_profile) {
      this.settings.store_profile = {
        ...this.settings.store_profile,
        ...newSettings.store_profile,
      };
    }

    if (newSettings.theme_settings) {
      const sbColor = newSettings.theme_settings.sidebar_color;
      const validSbColor = sbColor && sbColor.startsWith('#') ? sbColor : '#1c140e';
      this.settings.theme_settings = {
        ...this.settings.theme_settings,
        ...newSettings.theme_settings,
        sidebar_color: validSbColor,
      };
    }

    if (newSettings.operating_hours) {
      this.settings.operating_hours = {
        ...this.settings.operating_hours,
        ...newSettings.operating_hours,
      };
    }

    if (newSettings.store_preferences) {
      this.settings.store_preferences = {
        ...this.settings.store_preferences,
        ...newSettings.store_preferences,
      };
    }

    if (newSettings.finance_and_transactions) {
      this.settings.finance_and_transactions = {
        ...this.settings.finance_and_transactions,
        ...newSettings.finance_and_transactions,
        payment_methods: {
          ...this.settings.finance_and_transactions.payment_methods,
          ...(newSettings.finance_and_transactions.payment_methods || {}),
        },
      };
    }

    this.settings.updated_at = new Date().toISOString();
    return { ...this.settings };
  }

  public async updateLastBackupTime(): Promise<void> {
    this.settings.last_backup_time = new Date().toISOString();
  }
}

export const settingsService = new SettingsService();
