import { Response } from 'express';
import { AuthService } from '../services/AuthService';
import { UserRepository } from '../repositories/UserRepository';
import { EmployeeAssignmentRepository } from '../repositories/EmployeeAssignmentRepository';
import { ActivationTokenRepository } from '../repositories/ActivationTokenRepository';
import { AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { sseManager } from '../utils/sseManager';

export class AuthController {
  private authService: AuthService;
  private userRepository: UserRepository;
  private assignmentRepository: EmployeeAssignmentRepository;
  private activationTokenRepo: ActivationTokenRepository;

  constructor(
    authService: AuthService,
    userRepository: UserRepository,
    assignmentRepository?: EmployeeAssignmentRepository,
    activationTokenRepo?: ActivationTokenRepository
  ) {
    this.authService = authService;
    this.userRepository = userRepository;
    this.assignmentRepository = assignmentRepository || new EmployeeAssignmentRepository();
    this.activationTokenRepo = activationTokenRepo || new ActivationTokenRepository();
  }

  public login = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { username, password } = req.body;
      const result = await this.authService.login(username, password);

      sseManager.broadcast('USER_UPDATED', { action: 'LOGIN', user: result.user });

      return res.status(200).json({
        message: 'Login berhasil',
        data: result,
      });
    } catch (error: any) {
      return res.status(401).json({
        error: error.message || 'Login gagal',
      });
    }
  };

  public getProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Tidak terautentikasi' });
      }

      const userProfile = await this.authService.getUserProfile(req.user.user_id);
      return res.status(200).json({
        data: userProfile,
      });
    } catch (error: any) {
      return res.status(404).json({
        error: error.message || 'Profil pengguna tidak ditemukan',
      });
    }
  };

  /**
   * Endpoint Khusus Owner: Mengambil daftar seluruh pengguna terdaftar beserta kode aktivasi
   */
  public getAllUsers = async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const allUsers = await this.userRepository.findAll();
      const sanitizedUsers = await Promise.all(
        allUsers.map(async (u) => {
          const tokenRecord = await this.activationTokenRepo.findPendingByUserId(u.user_id);
          return {
            ...this.authService.sanitizeUser(u),
            activation_code: tokenRecord?.activation_code_display || undefined,
          };
        })
      );

      return res.status(200).json({
        data: sanitizedUsers,
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error.message || 'Gagal mengambil daftar pengguna',
      });
    }
  };

  /**
   * Owner Membuat Pegawai Baru + Menerbitkan Kode Aktivasi
   */
  public createUser = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { username, full_name, role, phone, is_pj, shift, status, password, avatar_url } = req.body;
      if (!full_name) {
        return res.status(400).json({ error: 'Nama Lengkap wajib diisi' });
      }

      // Auto-resolve username conflict jika username sudah ada
      let targetUsername = username && username.trim() !== '' ? username.trim() : `user_${Date.now().toString(36)}`;
      const existing = await this.userRepository.findByUsername(targetUsername);
      if (existing && existing.status !== 'PENDING_ACTIVATION') {
        targetUsername = `${targetUsername}_${Math.floor(100 + Math.random() * 900)}`;
      }

      const bcrypt = require('bcrypt');
      const passHash = password ? bcrypt.hashSync(password, 10) : bcrypt.hashSync('temp_' + Date.now(), 10);
      const user_id = 'usr-' + Date.now().toString(36);
      const initialStatus = status || 'PENDING_ACTIVATION';

      const newUser = await this.userRepository.create({
        user_id,
        username: targetUsername,
        full_name,
        password_hash: passHash,
        role: role || 'KARYAWAN',
        phone: phone || '',
        is_pj: Boolean(is_pj || role === 'PENANGGUNG_JAWAB'),
        shift: shift || 'Pagi (08:00 - 16:00)',
        status: initialStatus,
        avatar_url: avatar_url || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`,
        last_login: '-',
        invited_by_user_id: req.user?.user_id,
        created_at: new Date().toISOString(),
      });

      // Menerbitkan Kode Aktivasi Sementara
      let activationCode = await this.authService.generateActivationToken(newUser.user_id);

      sseManager.broadcast('USER_UPDATED', { action: 'CREATED', user_id: newUser.user_id });

      return res.status(201).json({
        message: 'Pegawai berhasil ditambahkan',
        data: {
          ...this.authService.sanitizeUser(newUser),
          activation_code: activationCode,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Gagal menambahkan pegawai' });
    }
  };

  /**
   * Endpoint Publik: Pegawai Melakukan Aktivasi Akun Mandiri via Kode Aktivasi
   */
  public activateAccount = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { activation_code, username, password } = req.body;
      const result = await this.authService.activateAccount(activation_code, username, password);

      sseManager.broadcast('USER_UPDATED', { action: 'ACTIVATED', user: result.user });

      return res.status(200).json({
        message: 'Akun pegawai berhasil diaktivasi. Otomatis masuk ke sistem POS.',
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        error: error.message || 'Gagal melakukan aktivasi akun',
      });
    }
  };

  /**
   * Owner Menghasilkan Kode Aktivasi Baru untuk Reset / Undangan Ulang
   */
  public generateActivationCode = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const user = await this.userRepository.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'Pegawai tidak ditemukan' });
      }

      const activationCode = await this.authService.generateActivationToken(id);
      await this.userRepository.update(id, { status: 'PENDING_ACTIVATION' });

      return res.status(200).json({
        message: 'Kode aktivasi baru berhasil dibuat',
        data: {
          user_id: id,
          activation_code: activationCode,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Gagal menerbitkan kode aktivasi' });
    }
  };

  public updateUser = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { full_name, username, role, phone, is_pj, shift, status, password, avatar_url } = req.body;

      const user = await this.userRepository.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
      }

      const updates: any = {};
      if (full_name) updates.full_name = full_name;
      if (username) updates.username = username;
      if (role) {
        updates.role = role;
        if (role === 'PENANGGUNG_JAWAB') updates.is_pj = true;
      }
      if (phone !== undefined) updates.phone = phone;
      if (is_pj !== undefined) updates.is_pj = Boolean(is_pj);
      if (shift) updates.shift = shift;
      if (status) updates.status = status;
      if (avatar_url) updates.avatar_url = avatar_url;

      if (password) {
        const bcrypt = require('bcrypt');
        updates.password_hash = bcrypt.hashSync(password, 10);
      }

      const updatedUser = await this.userRepository.update(id, updates);
      return res.status(200).json({
        message: 'Data pegawai berhasil diperbarui',
        data: updatedUser ? this.authService.sanitizeUser(updatedUser) : null,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Gagal memperbarui data pegawai' });
    }
  };

  public toggleUserStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const updatedUser = await this.userRepository.update(id, { status });
      if (!updatedUser) {
        return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
      }

      return res.status(200).json({
        message: `Status pegawai diperbarui menjadi ${status}`,
        data: this.authService.sanitizeUser(updatedUser),
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Gagal mengubah status pegawai' });
    }
  };

  public deleteUser = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const user = await this.userRepository.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
      }

      if (user.role === 'OWNER') {
        return res.status(403).json({ error: 'Akun Owner tidak dapat dihapus' });
      }

      await this.userRepository.delete(id);
      return res.status(200).json({
        message: `Akun pegawai ${user.full_name} (${user.username}) berhasil dihapus.`,
        data: { user_id: id },
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Gagal menghapus pegawai' });
    }
  };

  /**
   * Owner Menugaskan Karyawan ke PJ Tertentu (Employee Assignment)
   */
  public assignEmployeeToPJ = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { supervisor_user_id, employee_user_id } = req.body;
      if (!supervisor_user_id || !employee_user_id) {
        return res.status(400).json({ error: 'supervisor_user_id dan employee_user_id wajib diisi' });
      }

      const supervisor = await this.userRepository.findById(supervisor_user_id);
      if (!supervisor || (supervisor.role !== 'PENANGGUNG_JAWAB' && supervisor.role !== 'OWNER')) {
        return res.status(400).json({ error: 'User atasan harus memiliki role PENANGGUNG_JAWAB atau OWNER' });
      }

      const assignment = await this.assignmentRepository.assignEmployee(supervisor_user_id, employee_user_id);
      return res.status(200).json({
        message: 'Assignment pegawai berhasil diperbarui',
        data: assignment,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Gagal menugaskan pegawai' });
    }
  };

  /**
   * Endpoint Ganti Password User Terautentikasi (Owner / Pegawai)
   */
  public changePassword = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Tidak terautentikasi' });
      }
      const { currentPassword, newPassword } = req.body;
      await this.authService.changePassword(req.user.user_id, currentPassword, newPassword);

      return res.status(200).json({
        message: 'Password berhasil diperbarui.',
      });
    } catch (error: any) {
      return res.status(400).json({
        error: error.message || 'Gagal memperbarui password',
      });
    }
  };

  /**
   * Endpoint Pemulihan Password Darurat (Lupa Password)
   */
  public recoverPassword = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { username, recoveryPin, newPassword } = req.body;
      await this.authService.recoverPassword(username, recoveryPin, newPassword);

      return res.status(200).json({
        message: 'Password berhasil dipulihkan! Silakan login dengan password baru Anda.',
      });
    } catch (error: any) {
      return res.status(400).json({
        error: error.message || 'Gagal memulihkan password',
      });
    }
  };
}
