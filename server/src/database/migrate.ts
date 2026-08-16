import fs from 'fs';
import path from 'path';
import { pool } from './db';

export const runMigrations = async () => {
  const client = await pool.connect();
  try {
    console.log('[Migration] Starting PostgreSQL database migrations...');
    await client.query('BEGIN');

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      if (file.endsWith('.sql')) {
        console.log(`[Migration] Executing migration file: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await client.query(sql);
      }
    }

    await client.query('COMMIT');
    console.log('[Migration] All PostgreSQL migrations completed successfully!');
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('[Migration Error] Failed to execute migrations:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
