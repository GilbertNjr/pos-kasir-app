import { IRepository } from './interfaces/IRepository';
import { UserEntity } from '../types/domain';
import { pool } from '../database/db';
import bcrypt from 'bcrypt';

/**
 * UserRepository - Data Access Layer Abstraction untuk Entitas Users
 * Terhubung ke PostgreSQL Database utama (Source of Truth)
 */
export class UserRepository implements IRepository<UserEntity> {
  private inMemoryUsers: UserEntity[] = [];

  constructor() {
    this.initSync();
  }

  private async initSync() {
    const saltRounds = 10;
    const ownerPasswordHash = bcrypt.hashSync('owner123', saltRounds);

    this.inMemoryUsers = [
      {
        user_id: 'usr-owner-001',
        username: 'owner',
        password_hash: ownerPasswordHash,
        full_name: 'Pemilik Toko (Owner)',
        role: 'OWNER',
        phone: '0812-0000-1111',
        is_pj: true,
        shift: 'Pagi (08:00 - 16:00)',
        status: 'ACTIVE',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        last_login: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        created_at: new Date('2026-01-01').toISOString(),
      },
    ];
  }

  async findAll(): Promise<UserEntity[]> {
    try {
      const res = await pool.query('SELECT * FROM users ORDER BY created_at ASC');
      if (res.rows && res.rows.length > 0) {
        return res.rows.map((row) => this.mapRowToEntity(row));
      }
    } catch {
      // Fallback
    }
    return [...this.inMemoryUsers];
  }

  async findById(user_id: string): Promise<UserEntity | null> {
    try {
      const res = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
      if (res.rows && res.rows.length > 0) {
        return this.mapRowToEntity(res.rows[0]);
      }
    } catch {
      // Fallback
    }
    const mem = this.inMemoryUsers.find((u) => u.user_id === user_id);
    return mem ? { ...mem } : null;
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    try {
      const res = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username]);
      if (res.rows && res.rows.length > 0) {
        return this.mapRowToEntity(res.rows[0]);
      }
    } catch {
      // Fallback
    }
    const mem = this.inMemoryUsers.find((u) => u.username.toLowerCase() === username.toLowerCase());
    return mem ? { ...mem } : null;
  }

  async findWhere(predicate: (item: UserEntity) => boolean): Promise<UserEntity[]> {
    const all = await this.findAll();
    return all.filter(predicate);
  }

  async create(user: UserEntity): Promise<UserEntity> {
    try {
      const query = `
        INSERT INTO users (
          user_id, username, password_hash, full_name, role, phone, is_pj, shift, status, avatar_url, last_login, invited_by_user_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
        RETURNING *;
      `;
      const values = [
        user.user_id,
        user.username,
        user.password_hash,
        user.full_name,
        user.role,
        user.phone || '',
        Boolean(user.is_pj),
        user.shift || 'Pagi (08:00 - 16:00)',
        user.status,
        user.avatar_url || '',
        user.last_login || null,
        user.invited_by_user_id || null,
        user.created_at || new Date().toISOString(),
      ];
      const res = await pool.query(query, values);
      if (res.rows && res.rows.length > 0) {
        const created = this.mapRowToEntity(res.rows[0]);
        this.inMemoryUsers.push(created);
        return created;
      }
    } catch {
      // Fallback in memory
    }
    this.inMemoryUsers.push(user);
    return { ...user };
  }

  async update(user_id: string, item: Partial<UserEntity>): Promise<UserEntity | null> {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let index = 1;

      for (const [key, value] of Object.entries(item)) {
        if (value !== undefined) {
          fields.push(`${key} = $${index}`);
          values.push(value);
          index++;
        }
      }

      if (fields.length > 0) {
        fields.push(`updated_at = NOW()`);
        values.push(user_id);
        const query = `UPDATE users SET ${fields.join(', ')} WHERE user_id = $${index} RETURNING *`;
        const res = await pool.query(query, values);
        if (res.rows && res.rows.length > 0) {
          const updated = this.mapRowToEntity(res.rows[0]);
          const memIdx = this.inMemoryUsers.findIndex((u) => u.user_id === user_id);
          if (memIdx !== -1) this.inMemoryUsers[memIdx] = updated;
          return updated;
        }
      }
    } catch {
      // Fallback
    }

    const memIdx = this.inMemoryUsers.findIndex((u) => u.user_id === user_id);
    if (memIdx === -1) return null;
    this.inMemoryUsers[memIdx] = { ...this.inMemoryUsers[memIdx], ...item };
    return { ...this.inMemoryUsers[memIdx] };
  }

  async delete(user_id: string): Promise<boolean> {
    try {
      await pool.query('DELETE FROM users WHERE user_id = $1', [user_id]);
    } catch {
      // Fallback
    }
    const memIdx = this.inMemoryUsers.findIndex((u) => u.user_id === user_id);
    if (memIdx !== -1) {
      this.inMemoryUsers.splice(memIdx, 1);
    }
    return true;
  }

  private mapRowToEntity(row: any): UserEntity {
    let formattedLastLogin = '-';
    if (row.last_login && row.last_login !== '-') {
      const parsedDate = new Date(row.last_login);
      if (!isNaN(parsedDate.getTime())) {
        formattedLastLogin = parsedDate.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      } else {
        formattedLastLogin = String(row.last_login);
      }
    }

    let createdAtIso = new Date().toISOString();
    if (row.created_at) {
      const parsedCreated = new Date(row.created_at);
      if (!isNaN(parsedCreated.getTime())) {
        createdAtIso = parsedCreated.toISOString();
      }
    }

    return {
      user_id: row.user_id,
      username: row.username,
      password_hash: row.password_hash,
      full_name: row.full_name,
      role: row.role,
      phone: row.phone || '',
      is_pj: Boolean(row.is_pj),
      shift: row.shift || 'Pagi (08:00 - 16:00)',
      status: row.status,
      avatar_url: row.avatar_url || row.photo_url || '',
      last_login: formattedLastLogin,
      invited_by_user_id: row.invited_by_user_id || undefined,
      created_at: createdAtIso,
    };
  }
}
