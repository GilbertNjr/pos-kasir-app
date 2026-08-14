import { Response } from 'express';
import { AuthService } from '../services/AuthService';
import { UserRepository } from '../repositories/UserRepository';
import { AuthenticatedRequest } from '../middlewares/AuthMiddleware';

export class AuthController {
  private authService: AuthService;
  private userRepository: UserRepository;

  constructor(authService: AuthService, userRepository: UserRepository) {
    this.authService = authService;
    this.userRepository = userRepository;
  }

  public login = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { username, password } = req.body;
      const result = await this.authService.login(username, password);

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
   * Endpoint Khusus Owner: Mengambil daftar seluruh pengguna terdaftar
   */
  public getAllUsers = async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const allUsers = await this.userRepository.findAll();
      const sanitizedUsers = allUsers.map((u) => this.authService.sanitizeUser(u));

      return res.status(200).json({
        data: sanitizedUsers,
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error.message || 'Gagal mengambil daftar pengguna',
      });
    }
  };
}
