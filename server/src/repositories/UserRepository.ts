import { IRepository } from './interfaces/IRepository';
import { UserEntity } from '../types/domain';
import { pool } from '../database/db';
import { FileStorageAdapter } from '../database/fileStorage';
import bcrypt from 'bcrypt';

/**
 * UserRepository - Data Access Layer Abstraction untuk Entitas Users
 * Terhubung ke PostgreSQL Database utama (Source of Truth) & File Cache Fallback
 */
export class UserRepository implements IRepository<UserEntity> {
  private static inMemoryUsers: UserEntity[] = [];

  constructor() {
    this.initSync();
  }

  private async initSync() {
    if (UserRepository.inMemoryUsers.length > 0) return;
    const saltRounds = 10;
    const ownerPasswordHash = bcrypt.hashSync('owner123', saltRounds);

    const defaultSeed: UserEntity[] = [
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

    UserRepository.inMemoryUsers = FileStorageAdapter.readData<UserEntity>('users.json', defaultSeed);
  }

  private saveFileCache() {
    FileStorageAdapter.saveData('users.json', UserRepository.inMemoryUsers);
  }

  async findAll(): Promise<UserEntity[]> {
    let dbUsers: UserEntity[] = [];
    try {
      const res = await pool.query('SELECT * FROM users ORDER BY created_at ASC');
      if (res.rows && res.rows.length > 0) {
        dbUsers = res.rows.map((row) => this.mapRowToEntity(row));
      }
    } catch (err: any) {
      console.warn('[UserRepository.findAll Notice] Database query fallback:', err.message);
    }

    // Load file cache if memory is empty
    if (UserRepository.inMemoryUsers.length === 0) {
      UserRepository.inMemoryUsers = FileStorageAdapter.readData<UserEntity>('users.json', []);
    }

    // Seamlessly merge PostgreSQL DB users with In-Memory & FileStorage users
    const userMap = new Map<string, UserEntity>();
    
    // 1. Populate from inMemoryUsers (contains locally created & cached users)
    UserRepository.inMemoryUsers.forEach((u) => {
      if (u && u.user_id) userMap.set(u.user_id, u);
    });

    // 2. Augment / overwrite with DB users from PostgreSQL
    dbUsers.forEach((u) => {
      if (u && u.user_id) userMap.set(u.user_id, u);
    });

    const combined = Array.from(userMap.values());
    UserRepository.inMemoryUsers = combined;
    this.saveFileCache();

    return combined;
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
    const mem = UserRepository.inMemoryUsers.find((u) => u.user_id === user_id);
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
    const mem = UserRepository.inMemoryUsers.find((u) => u.username.toLowerCase() === username.toLowerCase());
    return mem ? { ...mem } : null;
  }

  async findWhere(predicate: (item: UserEntity) => boolean): Promise<UserEntity[]> {
    const all = await this.findAll();
    return all.filter(predicate);
  }

  async create(user: UserEntity): Promise<UserEntity> {
    let createdEntity: UserEntity = { ...user };
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
        user.status || 'ACTIVE',
        user.avatar_url || '',
        user.last_login || null,
        user.invited_by_user_id || null,
        user.created_at || new Date().toISOString(),
      ];
      const res = await pool.query(query, values);
      if (res.rows && res.rows.length > 0) {
        createdEntity = this.mapRowToEntity(res.rows[0]);
      }
    } catch (dbErr: any) {
      console.warn('[UserRepository.create Notice] Database insert fallback:', dbErr.message);
      // Fallback if status enum constraint in PostgreSQL rejected PENDING_ACTIVATION
      if (dbErr.message && dbErr.message.includes('user_status_enum') && user.status === 'PENDING_ACTIVATION') {
        try {
          const fallbackQuery = `
            INSERT INTO users (
              user_id, username, password_hash, full_name, role, phone, is_pj, shift, status, avatar_url, last_login, invited_by_user_id, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE', $10, $11, $12, $13, NOW())
            RETURNING *;
          `;
          const valuesFallback = [
            user.user_id,
            user.username,
            user.password_hash,
            user.full_name,
            user.role,
            user.phone || '',
            Boolean(user.is_pj),
            user.shift || 'Pagi (08:00 - 16:00)',
            user.avatar_url || '',
            user.last_login || null,
            user.invited_by_user_id || null,
            user.created_at || new Date().toISOString(),
          ];
          const res2 = await pool.query(fallbackQuery, valuesFallback);
          if (res2.rows && res2.rows.length > 0) {
            createdEntity = this.mapRowToEntity(res2.rows[0]);
          }
        } catch (retryErr: any) {
          console.warn('[UserRepository.create Warning] Retry insert failed:', retryErr.message);
        }
      }
    }

    // Always update inMemoryUsers and persist to users.json file cache
    const existingIdx = UserRepository.inMemoryUsers.findIndex((u) => u.user_id === createdEntity.user_id);
    if (existingIdx !== -1) {
      UserRepository.inMemoryUsers[existingIdx] = createdEntity;
    } else {
      UserRepository.inMemoryUsers.push(createdEntity);
    }
    this.saveFileCache();

    return createdEntity;
  }

  async update(user_id: string, item: Partial<UserEntity>): Promise<UserEntity | null> {
    let updatedEntity: UserEntity | null = null;
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
          updatedEntity = this.mapRowToEntity(res.rows[0]);
        }
      }
    } catch (err: any) {
      console.warn('[UserRepository.update Notice] Database update fallback:', err.message);
    }

    const memIdx = UserRepository.inMemoryUsers.findIndex((u) => u.user_id === user_id);
    if (memIdx !== -1) {
      UserRepository.inMemoryUsers[memIdx] = {
        ...UserRepository.inMemoryUsers[memIdx],
        ...item,
        ...(updatedEntity || {}),
      };
      this.saveFileCache();
      return { ...UserRepository.inMemoryUsers[memIdx] };
    } else if (updatedEntity) {
      UserRepository.inMemoryUsers.push(updatedEntity);
      this.saveFileCache();
      return updatedEntity;
    }
    return null;
  }

  async delete(user_id: string): Promise<boolean> {
    try {
      await pool.query('DELETE FROM users WHERE user_id = $1', [user_id]);
    } catch (err: any) {
      console.warn('[UserRepository.delete Notice] Database delete fallback:', err.message);
    }
    const memIdx = UserRepository.inMemoryUsers.findIndex((u) => u.user_id === user_id);
    if (memIdx !== -1) {
      UserRepository.inMemoryUsers.splice(memIdx, 1);
      this.saveFileCache();
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
