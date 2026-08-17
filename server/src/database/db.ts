import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

export const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl: process.env.NODE_ENV === 'production' || connectionString.includes('render.com') || connectionString.includes('dpg-') ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 1500,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME || 'pos_kasir_db',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 1500,
      }
);

let dbAuthFailed = false;

export const query = async (text: string, params?: any[]) => {
  if (dbAuthFailed) {
    throw new Error('Database authentication failed (using in-memory fallback)');
  }
  try {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production' && duration > 100) {
      console.log('[DB Query Warning] Slow Query:', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (err: any) {
    if (err && err.message && (err.message.includes('password authentication failed') || err.message.includes('authentication failed'))) {
      if (!dbAuthFailed) {
        dbAuthFailed = true;
        console.warn('\n⚠️ [DB Connection Notice] Kredensial DATABASE_URL PostgreSQL di server/.env salah atau telah expired.');
        console.warn('⚠️ Sistem otomatis mengalihkan seluruh transaksi & data ke In-Memory Storage secara stabil.\n');
      }
    }
    throw err;
  }
};

export default {
  pool,
  query,
};
