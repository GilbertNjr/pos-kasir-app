import { ActivationTokenEntity } from '../types/domain';
import { pool } from '../database/db';
import { FileStorageAdapter } from '../database/fileStorage';

export class ActivationTokenRepository {
  private static inMemoryTokens: ActivationTokenEntity[] = FileStorageAdapter.readData<ActivationTokenEntity>('activation_tokens.json', []);

  private saveFileCache() {
    FileStorageAdapter.saveData('activation_tokens.json', ActivationTokenRepository.inMemoryTokens);
  }

  async createToken(token: ActivationTokenEntity): Promise<ActivationTokenEntity> {
    try {
      const query = `
        INSERT INTO activation_tokens (
          token_id, user_id, token_hash, activation_code_display, status, expires_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
      `;
      const values = [
        token.token_id,
        token.user_id,
        token.token_hash,
        token.activation_code_display,
        token.status,
        token.expires_at,
        token.created_at || new Date().toISOString(),
      ];
      const res = await pool.query(query, values);
      if (res.rows && res.rows.length > 0) {
        const created = this.mapRowToEntity(res.rows[0]);
        ActivationTokenRepository.inMemoryTokens.push(created);
        this.saveFileCache();
        return created;
      }
    } catch {
      // Fallback
    }
    ActivationTokenRepository.inMemoryTokens.push(token);
    this.saveFileCache();
    return { ...token };
  }

  async findByCodeDisplay(code: string): Promise<ActivationTokenEntity | null> {
    const rawFormatted = code.trim().toUpperCase();
    const cleanCode = code.replace(/[\s\-]/g, '').toUpperCase();
    try {
      // Try exact or space/hyphen normalized query first
      const res = await pool.query(
        "SELECT * FROM activation_tokens WHERE UPPER(REPLACE(REPLACE(activation_code_display, ' ', ''), '-', '')) = $1 ORDER BY created_at DESC LIMIT 1",
        [cleanCode]
      );
      if (res.rows && res.rows.length > 0) {
        return this.mapRowToEntity(res.rows[0]);
      }
    } catch {
      // Fallback
    }

    const mem = ActivationTokenRepository.inMemoryTokens
      .filter((t) => {
        const tClean = t.activation_code_display.replace(/[\s\-]/g, '').toUpperCase();
        return tClean === cleanCode || t.activation_code_display.toUpperCase() === rawFormatted;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    return mem ? { ...mem } : null;
  }

  async markAsUsed(token_id: string): Promise<boolean> {
    const now = new Date().toISOString();
    try {
      await pool.query('UPDATE activation_tokens SET status = $1, used_at = $2 WHERE token_id = $3', ['USED', now, token_id]);
    } catch {
      // Fallback
    }
    const mem = ActivationTokenRepository.inMemoryTokens.find((t) => t.token_id === token_id);
    if (mem) {
      mem.status = 'USED';
      mem.used_at = now;
      this.saveFileCache();
    }
    return true;
  }

  async findPendingByUserId(user_id: string): Promise<ActivationTokenEntity | null> {
    try {
      const res = await pool.query(
        "SELECT * FROM activation_tokens WHERE user_id = $1 AND status = 'PENDING' AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
        [user_id]
      );
      if (res.rows && res.rows.length > 0) {
        return this.mapRowToEntity(res.rows[0]);
      }
    } catch {
      // Fallback
    }
    const mem = ActivationTokenRepository.inMemoryTokens
      .filter((t) => t.user_id === user_id && t.status === 'PENDING')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    return mem ? { ...mem } : null;
  }

  private mapRowToEntity(row: any): ActivationTokenEntity {
    return {
      token_id: row.token_id,
      user_id: row.user_id,
      token_hash: row.token_hash,
      activation_code_display: row.activation_code_display,
      status: row.status,
      expires_at: new Date(row.expires_at).toISOString(),
      used_at: row.used_at ? new Date(row.used_at).toISOString() : undefined,
      created_at: new Date(row.created_at).toISOString(),
    };
  }
}
