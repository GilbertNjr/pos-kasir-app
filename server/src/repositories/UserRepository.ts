import { IRepository } from './interfaces/IRepository';
import { UserEntity } from '../types/domain';
import bcrypt from 'bcrypt';

/**
 * UserRepository - DAL Abstraction untuk Entitas Users
 * Menyediakan data seed tersanitasi & di-hash dengan Bcrypt
 */
export class UserRepository implements IRepository<UserEntity> {
  private users: UserEntity[] = [];

  constructor() {
    this.seedUsers();
  }

  private async seedUsers() {
    const saltRounds = 10;
    const ownerPasswordHash = await bcrypt.hash('owner123', saltRounds);
    const cashierPasswordHash = await bcrypt.hash('kasir123', saltRounds);

    this.users = [
      {
        user_id: 'usr-owner-001',
        username: 'owner',
        password_hash: ownerPasswordHash,
        full_name: 'Pemilik Toko (Owner)',
        role: 'OWNER',
        status: 'ACTIVE',
        created_at: new Date('2026-01-01').toISOString(),
      },
      {
        user_id: 'usr-budi-002',
        username: 'budi',
        password_hash: cashierPasswordHash,
        full_name: 'Budi Santoso',
        role: 'KARYAWAN',
        status: 'ACTIVE',
        created_at: new Date('2026-01-02').toISOString(),
      },
      {
        user_id: 'usr-siti-003',
        username: 'siti',
        password_hash: cashierPasswordHash,
        full_name: 'Siti Rahmawati',
        role: 'KARYAWAN',
        status: 'ACTIVE',
        created_at: new Date('2026-01-03').toISOString(),
      },
    ];
  }

  async findAll(): Promise<UserEntity[]> {
    return [...this.users];
  }

  async findById(user_id: string): Promise<UserEntity | null> {
    const user = this.users.find((u) => u.user_id === user_id);
    return user ? { ...user } : null;
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    const user = this.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    return user ? { ...user } : null;
  }

  async findWhere(predicate: (item: UserEntity) => boolean): Promise<UserEntity[]> {
    return this.users.filter(predicate);
  }

  async create(user: UserEntity): Promise<UserEntity> {
    this.users.push(user);
    return { ...user };
  }

  async update(user_id: string, item: Partial<UserEntity>): Promise<UserEntity | null> {
    const index = this.users.findIndex((u) => u.user_id === user_id);
    if (index === -1) return null;

    this.users[index] = { ...this.users[index], ...item };
    return { ...this.users[index] };
  }
}
