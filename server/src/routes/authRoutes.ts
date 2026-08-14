import { Router } from 'express';
import { UserRepository } from '../repositories/UserRepository';
import { AuthService } from '../services/AuthService';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middlewares/AuthMiddleware';
import { requireOwner } from '../middlewares/rbacMiddleware';

const router = Router();

// Inisialisasi Dependensi (Dependency Injection)
const userRepository = new UserRepository();
const authService = new AuthService(userRepository);
const authController = new AuthController(authService, userRepository);

// Route Auth Public
router.post('/login', authController.login);

// Route Auth Protected (Guarded for Authenticated Users)
router.get('/me', authMiddleware, authController.getProfile);

// Route Auth Owner Only (Guarded with requireOwner RBAC Middleware)
router.get('/users', authMiddleware, requireOwner, authController.getAllUsers);

export default router;
