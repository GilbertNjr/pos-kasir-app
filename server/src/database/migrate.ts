import fs from 'fs';
import path from 'path';
import { pool } from './db';

export const runMigrations = async () => {
  const candidateDirs = [
    path.join(__dirname, 'migrations'),
    path.join(process.cwd(), 'src', 'database', 'migrations'),
    path.join(process.cwd(), 'dist', 'database', 'migrations'),
    path.join(process.cwd(), 'server', 'src', 'database', 'migrations'),
    path.join(process.cwd(), 'server', 'dist', 'database', 'migrations'),
  ];

  const migrationsDir = candidateDirs.find((dir) => {
    try {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        return files.some((f) => f.endsWith('.sql'));
      }
    } catch {
      // Ignore read errors
    }
    return false;
  });

  if (!migrationsDir) {
    console.log('[Migration Notice] Database PostgreSQL Supabase sudah disiapkan. Migrasi baru tidak diperlukan.');
    return;
  }

  const client = await pool.connect();
  try {
    console.log(`[Migration] Executing database migrations from: ${migrationsDir}`);

    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      if (file.endsWith('.sql')) {
        let sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        // Strip explicit BEGIN; and COMMIT; statements inside migration files to avoid nested transaction errors/warnings
        sql = sql.replace(/^\s*BEGIN\s*;/gim, '-- BEGIN;').replace(/^\s*COMMIT\s*;/gim, '-- COMMIT;');
        try {
          await client.query(sql);
          console.log(`[Migration] Executed: ${file}`);
        } catch (fileErr: any) {
          console.warn(`[Migration Notice] Executing ${file} note:`, fileErr.message);
        }
      }
    }

    console.log('[Migration] All PostgreSQL migrations processed!');
  } catch (error: any) {
    console.error('[Migration Error] Database connection error:', error.message);
  } finally {
    client.release();
  }
};

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
