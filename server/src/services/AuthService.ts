import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/UserRepository';
import { UserEntity } from '../types/domain';

const JWT_SECRET = process.env.JWT_SECRET || 'pos-kasir-super-secret-jwt-key-2026';

export interface SanitizedUser {
  user_id: string;
  username: string;
  full_name: string;
  role: 'OWNER' | 'KARYAWAN';
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

export interface LoginResponse {
  token: string;
  user: SanitizedUser;
}

export class AuthService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  /**
   * Sanitasi entitas user (menghapus password_hash sebelum dikirim ke client)
   */
  public sanitizeUser(user: UserEntity): SanitizedUser {
    const { password_hash, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Eksekusi Otentikasi Login User
   */
  public async login(username: string, passwordPlain: string): Promise<LoginResponse> {
    if (!username || !passwordPlain) {
      throw new Error('Username dan password wajib diisi');
    }

    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      throw new Error('Username atau password tidak valid');
    }

    if (user.status !== 'ACTIVE') {
      throw new Error('Akun Anda tidak aktif. Silakan hubungi Owner.');
    }

    const isMatch = await bcrypt.compare(passwordPlain, user.password_hash);
    if (!isMatch) {
      throw new Error('Username atau password tidak valid');
    }

    // Generate JWT Token (berlaku 24 jam)
    const token = jwt.sign(
      {
        user_id: user.user_id,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: this.sanitizeUser(user),
    };
  }

  /**
   * Dapatkan profil user berdasarkan ID (setelah AuthMiddleware lolos)
   */
  public async getUserProfile(user_id: string): Promise<SanitizedUser> {
    const user = await this.userRepository.findById(user_id);
    if (!user) {
      throw new Error('Pengguna tidak ditemukan');
    }
    return this.sanitizeUser(user);
  }
}
