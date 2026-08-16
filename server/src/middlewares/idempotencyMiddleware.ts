import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './AuthMiddleware';
import { pool } from '../database/db';

// In-Memory LRU Cache untuk Idempotency Key (Fast Access)
const processedKeys = new Map<string, { status: number; body: any; timestamp: number }>();

// Clear expired keys older than 30 minutes from memory
setInterval(() => {
  const thirtyMinsAgo = Date.now() - 30 * 60 * 1000;
  for (const [key, value] of processedKeys.entries()) {
    if (value.timestamp < thirtyMinsAgo) {
      processedKeys.delete(key);
    }
  }
}, 60 * 1000);

export const idempotencyMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const idempotencyKey = req.headers['x-idempotency-key'] as string;

  if (!idempotencyKey) {
    return next();
  }

  // 1. Check RAM Cache
  const cachedResponse = processedKeys.get(idempotencyKey);
  if (cachedResponse) {
    console.log(`[Idempotency] Duplicate request prevented from RAM for key: ${idempotencyKey}`);
    return res.status(cachedResponse.status).json(cachedResponse.body);
  }

  // 2. Check PostgreSQL DB Persistence
  try {
    const dbCheck = await pool.query(
      `SELECT details FROM audit_logs WHERE action = 'IDEMPOTENCY_RESPONSE' AND entity_id = $1 LIMIT 1`,
      [idempotencyKey]
    );
    if (dbCheck.rows.length > 0) {
      const stored = JSON.parse(dbCheck.rows[0].details);
      processedKeys.set(idempotencyKey, { status: stored.status || 200, body: stored.body, timestamp: Date.now() });
      console.log(`[Idempotency] Duplicate request prevented from PostgreSQL DB for key: ${idempotencyKey}`);
      return res.status(stored.status || 200).json(stored.body);
    }
  } catch {
    // Fallback if DB check fails
  }

  // 3. Intercept res.json to capture & persist response payload
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const payload = { status: res.statusCode, body, timestamp: Date.now() };
      processedKeys.set(idempotencyKey, payload);

      // Persist asynchronously into audit_logs table
      pool.query(
        `INSERT INTO audit_logs (log_id, user_id, action, affected_entity, entity_id, details)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (log_id) DO NOTHING`,
        [
          `idemp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          req.user?.user_id || 'system',
          'IDEMPOTENCY_RESPONSE',
          'TRANSACTION',
          idempotencyKey,
          JSON.stringify(payload),
        ]
      ).catch((err) => console.warn('[Idempotency] Failed to persist key to DB:', err.message));
    }
    return originalJson(body);
  };

  next();
};

