import fs from 'fs';
import path from 'path';
import { UserRepository } from '../repositories/UserRepository';

const DATA_DIR = path.join(process.cwd(), 'data');
const SETTINGS_FILE_PATH = path.join(DATA_DIR, 'system_settings.json');

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
  private settings: SystemSettingsData;

  constructor() {
    this.settings = this.loadFromDisk();
  }

  private getDefaultSettings(): SystemSettingsData {
    return {
      store_profile: {
        name: '',
        owner_name: '',
        email: '',
        phone: '',
        description: '',
        logo_url: '',
        address: '',
        district: '',
        city: '',
        postal_code: '',
        country: '',
      },
      theme_settings: {
        theme_color: 'dark_slate',
        sidebar_color: '#090d16',
        primary_hex: '#2563eb',
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
  }

  private loadFromDisk(): SystemSettingsData {
    const defaultData = this.getDefaultSettings();
    try {
      if (fs.existsSync(SETTINGS_FILE_PATH)) {
        const raw = fs.readFileSync(SETTINGS_FILE_PATH, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.store_profile) {
          return {
            ...defaultData,
            ...parsed,
            store_profile: {
              ...defaultData.store_profile,
              ...(parsed.store_profile || {}),
            },
            theme_settings: {
              ...defaultData.theme_settings,
              ...(parsed.theme_settings || {}),
            },
            operating_hours: {
              ...defaultData.operating_hours,
              ...(parsed.operating_hours || {}),
            },
            store_preferences: {
              ...defaultData.store_preferences,
              ...(parsed.store_preferences || {}),
            },
            finance_and_transactions: {
              ...defaultData.finance_and_transactions,
              ...(parsed.finance_and_transactions || {}),
            },
          };
        }
      }
    } catch (err: any) {
      console.warn('[SettingsService] Failed to read system_settings.json from disk:', err.message);
    }
    return defaultData;
  }

  private saveToDisk(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(this.settings, null, 2), 'utf8');
    } catch (err: any) {
      console.warn('[SettingsService] Failed to save system_settings.json to disk:', err.message);
    }
  }

  public async getSettings(): Promise<SystemSettingsData> {
    return { ...this.settings };
  }

  public async updateSettings(newSettings: Partial<SystemSettingsData>): Promise<SystemSettingsData> {
    if (newSettings.store_profile) {
      this.settings.store_profile = {
        ...this.settings.store_profile,
        ...newSettings.store_profile,
      };

      if (newSettings.store_profile.owner_name) {
        try {
          const userRepo = new UserRepository();
          const owners = await userRepo.findWhere((u) => u.role === 'OWNER' || u.username === 'owner');
          for (const owner of owners) {
            await userRepo.update(owner.user_id, { full_name: newSettings.store_profile.owner_name });
          }
        } catch (err: any) {
          console.warn('[SettingsService] Notice: Failed to sync owner full_name to UserRepository:', err.message);
        }
      }
    }

    if (newSettings.theme_settings) {
      const sbColor = newSettings.theme_settings.sidebar_color;
      const validSbColor = sbColor && sbColor.startsWith('#') ? sbColor : '#090d16';
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
    this.saveToDisk();
    return { ...this.settings };
  }

  public async updateLastBackupTime(): Promise<void> {
    this.settings.last_backup_time = new Date().toISOString();
    this.saveToDisk();
  }
}

export const settingsService = new SettingsService();

