import fs from 'fs';
import path from 'path';
import { UserRepository } from '../repositories/UserRepository';
import { pool } from '../database/db';

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
  private isDbInitialized: boolean = false;

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

  private async ensureDbTable(): Promise<void> {
    if (this.isDbInitialized) return;
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS system_settings (
          setting_id VARCHAR(36) PRIMARY KEY DEFAULT 'GLOBAL_SETTING',
          store_name VARCHAR(150),
          store_phone VARCHAR(50),
          store_address TEXT,
          store_logo_url TEXT,
          tax_ppn_percent NUMERIC(5,2) DEFAULT 11.00,
          service_charge_percent NUMERIC(5,2) DEFAULT 5.00,
          cash_active BOOLEAN DEFAULT TRUE,
          qris_active BOOLEAN DEFAULT TRUE,
          debit_card_active BOOLEAN DEFAULT FALSE,
          full_settings JSONB,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await pool.query(`
        ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS full_settings JSONB;
      `);
      await pool.query(`
        ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS store_logo_url TEXT;
      `);
      this.isDbInitialized = true;
    } catch (err: any) {
      console.warn('[SettingsService Notice] DB Table Init:', err.message);
    }
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

  private async saveToDb(settings: SystemSettingsData): Promise<void> {
    try {
      await this.ensureDbTable();
      const storeName = settings.store_profile?.name || '';
      const storePhone = settings.store_profile?.phone || '';
      const storeAddress = settings.store_profile?.address || '';
      const storeLogoUrl = settings.store_profile?.logo_url || '';
      const taxPpn = settings.finance_and_transactions?.tax_ppn_percent ?? 11;
      const serviceCharge = settings.finance_and_transactions?.service_charge_percent ?? 5;
      const cashActive = settings.finance_and_transactions?.payment_methods?.cash ?? true;
      const qrisActive = settings.finance_and_transactions?.payment_methods?.qris ?? true;
      const debitActive = settings.finance_and_transactions?.payment_methods?.debit_card ?? false;

      const query = `
        INSERT INTO system_settings (
          setting_id, store_name, store_phone, store_address, store_logo_url,
          tax_ppn_percent, service_charge_percent, cash_active, qris_active, debit_card_active,
          full_settings, updated_at
        ) VALUES (
          'GLOBAL_SETTING', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()
        )
        ON CONFLICT (setting_id) DO UPDATE SET
          store_name = EXCLUDED.store_name,
          store_phone = EXCLUDED.store_phone,
          store_address = EXCLUDED.store_address,
          store_logo_url = EXCLUDED.store_logo_url,
          tax_ppn_percent = EXCLUDED.tax_ppn_percent,
          service_charge_percent = EXCLUDED.service_charge_percent,
          cash_active = EXCLUDED.cash_active,
          qris_active = EXCLUDED.qris_active,
          debit_card_active = EXCLUDED.debit_card_active,
          full_settings = EXCLUDED.full_settings,
          updated_at = NOW();
      `;

      await pool.query(query, [
        storeName,
        storePhone,
        storeAddress,
        storeLogoUrl,
        taxPpn,
        serviceCharge,
        cashActive,
        qrisActive,
        debitActive,
        JSON.stringify(settings),
      ]);
    } catch (err: any) {
      console.warn('[SettingsService] Database saveToDb fallback notice:', err.message);
    }
  }

  public async getSettings(): Promise<SystemSettingsData> {
    try {
      await this.ensureDbTable();
      const res = await pool.query("SELECT * FROM system_settings WHERE setting_id = 'GLOBAL_SETTING'");
      if (res.rows && res.rows.length > 0) {
        const row = res.rows[0];
        let dbSettings: Partial<SystemSettingsData> = {};
        if (row.full_settings) {
          dbSettings = typeof row.full_settings === 'string' ? JSON.parse(row.full_settings) : row.full_settings;
        }

        const defaultData = this.getDefaultSettings();
        const merged: SystemSettingsData = {
          ...defaultData,
          ...this.settings,
          ...dbSettings,
          store_profile: {
            ...defaultData.store_profile,
            ...(this.settings.store_profile || {}),
            ...(dbSettings.store_profile || {}),
            name: row.store_name || dbSettings.store_profile?.name || this.settings.store_profile?.name || '',
            phone: row.store_phone || dbSettings.store_profile?.phone || this.settings.store_profile?.phone || '',
            address: row.store_address || dbSettings.store_profile?.address || this.settings.store_profile?.address || '',
            logo_url: dbSettings.store_profile?.logo_url || row.store_logo_url || this.settings.store_profile?.logo_url || '',
          },
          theme_settings: {
            ...defaultData.theme_settings,
            ...(this.settings.theme_settings || {}),
            ...(dbSettings.theme_settings || {}),
          },
          operating_hours: {
            ...defaultData.operating_hours,
            ...(this.settings.operating_hours || {}),
            ...(dbSettings.operating_hours || {}),
          },
          store_preferences: {
            ...defaultData.store_preferences,
            ...(this.settings.store_preferences || {}),
            ...(dbSettings.store_preferences || {}),
          },
          finance_and_transactions: {
            ...defaultData.finance_and_transactions,
            ...(this.settings.finance_and_transactions || {}),
            ...(dbSettings.finance_and_transactions || {}),
          },
        };

        this.settings = merged;
        this.saveToDisk();
        return { ...this.settings };
      }
    } catch (err: any) {
      console.warn('[SettingsService] Database getSettings fallback to disk/memory:', err.message);
    }
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
    await this.saveToDb(this.settings);
    return { ...this.settings };
  }

  public async updateLastBackupTime(): Promise<void> {
    this.settings.last_backup_time = new Date().toISOString();
    this.saveToDisk();
    await this.saveToDb(this.settings);
  }
}

export const settingsService = new SettingsService();

