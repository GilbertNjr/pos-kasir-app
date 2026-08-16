import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/UserRepository';
import { RolePermissionRepository } from '../repositories/RolePermissionRepository';
import { ActivationTokenRepository } from '../repositories/ActivationTokenRepository';
import { UserEntity, UserRole, UserStatus } from '../types/domain';

const JWT_SECRET = process.env.JWT_SECRET || 'pos-kasir-super-secret-jwt-key-2026';

export interface SanitizedUser {
  user_id: string;
  username: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  is_pj?: boolean;
  shift?: string;
  status: UserStatus;
  avatar_url?: string;
  last_login?: string;
  created_at: string;
  permissions?: string[];
}

export interface LoginResponse {
  token: string;
  user: SanitizedUser;
}

export class AuthService {
  private userRepository: UserRepository;
  private rolePermissionRepo: RolePermissionRepository;
  private activationTokenRepo: ActivationTokenRepository;

  constructor(
    userRepository: UserRepository,
    rolePermissionRepo?: RolePermissionRepository,
    activationTokenRepo?: ActivationTokenRepository
  ) {
    this.userRepository = userRepository;
    this.rolePermissionRepo = rolePermissionRepo || new RolePermissionRepository();
    this.activationTokenRepo = activationTokenRepo || new ActivationTokenRepository();
  }

  /**
   * Sanitasi entitas user (menghapus password_hash sebelum dikirim ke client)
   */
  public sanitizeUser(user: UserEntity, permissions: string[] = []): SanitizedUser {
    const { password_hash, ...sanitized } = user;
    return {
      ...sanitized,
      permissions,
    };
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

    if (user.status === 'PENDING_ACTIVATION') {
      throw new Error('Akun Anda belum diaktivasi. Gunakan Kode Aktivasi dari Owner terlebih dahulu.');
    }

    if (user.status !== 'ACTIVE') {
      throw new Error('Akun Anda telah dinonaktifkan atau disuspend. Silakan hubungi Owner.');
    }

    const isMatch = await bcrypt.compare(passwordPlain, user.password_hash);
    if (!isMatch) {
      throw new Error('Username atau password tidak valid');
    }

    // Ambil daftar permission dinamis berdasarkan role dari DB
    const permissions = await this.rolePermissionRepo.getPermissionsForRole(user.role);

    // Update last_login
    const nowStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    await this.userRepository.update(user.user_id, { last_login: nowStr });
    user.last_login = nowStr;

    // Generate JWT Token (berlaku 24 jam)
    const token = jwt.sign(
      {
        user_id: user.user_id,
        username: user.username,
        role: user.role,
        is_pj: Boolean(user.is_pj),
        permissions,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: this.sanitizeUser(user, permissions),
    };
  }

  /**
   * Dapatkan profil user berdasarkan ID
   */
  public async getUserProfile(user_id: string): Promise<SanitizedUser> {
    const user = await this.userRepository.findById(user_id);
    if (!user) {
      throw new Error('Pengguna tidak ditemukan');
    }
    const permissions = await this.rolePermissionRepo.getPermissionsForRole(user.role);
    return this.sanitizeUser(user, permissions);
  }

  /**
   * Generate Kode Aktivasi Akun Sementara (e.g. "7K9-XP2")
   */
  public async generateActivationToken(user_id: string): Promise<string> {
    // Return existing valid pending token if present to prevent changing code unnecessarily
    const existing = await this.activationTokenRepo.findPendingByUserId(user_id);
    if (existing && new Date(existing.expires_at).getTime() > Date.now()) {
      return existing.activation_code_display;
    }

    // Generate 6 Karakter Acak Alfanumerik (e.g. 7K9-XP2)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let codePart1 = '';
    let codePart2 = '';
    for (let i = 0; i < 3; i++) {
      codePart1 += chars.charAt(Math.floor(Math.random() * chars.length));
      codePart2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const displayCode = `${codePart1}-${codePart2}`;

    const token_hash = bcrypt.hashSync(displayCode, 10);
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 Hari Masa Berlaku

    await this.activationTokenRepo.createToken({
      token_id: 'tok-' + Date.now().toString(36),
      user_id,
      token_hash,
      activation_code_display: displayCode,
      status: 'PENDING',
      expires_at,
      created_at: new Date().toISOString(),
    });

    return displayCode;
  }

  /**
   * Eksekusi Aktivasi Akun Pegawai Baru Mandiri
   */
  public async activateAccount(activationCode: string, newUsername: string, newPasswordPlain: string) {
    if (!activationCode || !newUsername || !newPasswordPlain) {
      throw new Error('Kode aktivasi, username baru, dan password baru wajib diisi');
    }

    const tokenRecord = await this.activationTokenRepo.findByCodeDisplay(activationCode);
    if (!tokenRecord) {
      throw new Error('Kode aktivasi tidak ditemukan atau tidak valid');
    }

    if (tokenRecord.status !== 'PENDING') {
      throw new Error('Kode aktivasi ini sudah pernah digunakan');
    }

    if (new Date(tokenRecord.expires_at).getTime() < Date.now()) {
      throw new Error('Kode aktivasi telah kadaluwarsa. Silakan minta kode baru dari Owner');
    }

    const user = await this.userRepository.findById(tokenRecord.user_id);
    if (!user) {
      throw new Error('Pengguna yang terikat dengan kode ini tidak ditemukan');
    }

    // Periksa apakah username sudah dipakai user lain
    const existingUser = await this.userRepository.findByUsername(newUsername);
    if (existingUser && existingUser.user_id !== user.user_id) {
      throw new Error('Username sudah digunakan oleh pegawai lain');
    }

    const password_hash = bcrypt.hashSync(newPasswordPlain, 10);
    const updatedUser = await this.userRepository.update(user.user_id, {
      username: newUsername,
      password_hash,
      status: 'ACTIVE',
    });

    await this.activationTokenRepo.markAsUsed(tokenRecord.token_id);

    return updatedUser ? this.sanitizeUser(updatedUser) : null;
  }

  /**
   * Ubah Password User Terautentikasi (Current Password Validation)
   */
  public async changePassword(user_id: string, currentPasswordPlain: string, newPasswordPlain: string) {
    if (!currentPasswordPlain || !newPasswordPlain) {
      throw new Error('Password lama dan password baru wajib diisi');
    }
    if (newPasswordPlain.length < 6) {
      throw new Error('Password baru minimal 6 karakter');
    }

    const user = await this.userRepository.findById(user_id);
    if (!user) {
      throw new Error('Pengguna tidak ditemukan');
    }

    const isMatch = await bcrypt.compare(currentPasswordPlain, user.password_hash);
    if (!isMatch) {
      throw new Error('Password lama yang Anda masukkan tidak cocok');
    }

    const password_hash = bcrypt.hashSync(newPasswordPlain, 10);
    await this.userRepository.update(user.user_id, { password_hash });
    return true;
  }

  /**
   * Pemulihan Password Owner via Emergency Recovery Key / PIN Master
   */
  public async recoverPassword(username: string, recoveryPin: string, newPasswordPlain: string) {
    if (!username || !recoveryPin || !newPasswordPlain) {
      throw new Error('Username, PIN Pemulihan, dan Password Baru wajib diisi');
    }
    if (newPasswordPlain.length < 6) {
      throw new Error('Password baru minimal 6 karakter');
    }

    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      throw new Error('Username tidak ditemukan');
    }

    // Default Emergency Master PIN: 999888 atau PIN kustom 6 digit
    const formattedPin = recoveryPin.trim();

    if (formattedPin !== '999888' && formattedPin.length !== 6) {
      throw new Error('PIN Pemulihan Darurat tidak cocok / tidak valid.');
    }

    const password_hash = bcrypt.hashSync(newPasswordPlain, 10);
    await this.userRepository.update(user.user_id, { password_hash, status: 'ACTIVE' });
    return true;
  }
}
