import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

export class GoogleSheetsClient {
  private static instance: GoogleSheetsClient;
  private sheetsApi: any = null;
  private spreadsheetId: string = '';
  private isConfigured: boolean = false;

  private constructor() {
    this.init();
  }

  public static getInstance(): GoogleSheetsClient {
    if (!GoogleSheetsClient.instance) {
      GoogleSheetsClient.instance = new GoogleSheetsClient();
    }
    return GoogleSheetsClient.instance;
  }

  private init() {
    dotenv.config({ override: true });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (spreadsheetId && clientEmail && privateKey) {
      try {
        // Handle escaped newline characters in private key string
        privateKey = privateKey.replace(/\\n/g, '\n');

        const auth = new google.auth.JWT({
          email: clientEmail,
          key: privateKey,
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        this.sheetsApi = google.sheets({ version: 'v4', auth });
        this.spreadsheetId = spreadsheetId;
        this.isConfigured = true;
        console.log('[GoogleSheetsClient] ✅ Google Sheets API berhasil dikonfigurasi.');
      } catch (err: any) {
        console.error('[GoogleSheetsClient] ⚠️ Gagal inisialisasi Google Sheets API:', err.message);
        this.isConfigured = false;
      }
    } else {
      console.log('[GoogleSheetsClient] ℹ️ GOOGLE_SHEET_ID / Credential belum diatur di .env. Menggunakan memori internal.');
      this.isConfigured = false;
    }
  }

  public isReady(): boolean {
    if (!this.isConfigured) {
      this.init();
    }
    return this.isConfigured && !!this.sheetsApi;
  }

  public getSpreadsheetId(): string {
    return this.spreadsheetId;
  }

  public getApi(): any {
    return this.sheetsApi;
  }
}
