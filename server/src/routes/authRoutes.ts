import { Router } from 'express';
import { userRepository } from '../repositories/sharedRepositories';
import { AuthService } from '../services/AuthService';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middlewares/AuthMiddleware';
import { requireOwner } from '../middlewares/rbacMiddleware';

const router = Router();

// Inisialisasi Dependensi (Dependency Injection)
const authService = new AuthService(userRepository);
const authController = new AuthController(authService, userRepository);

// Route Auth Public
router.post('/login', authController.login);
router.post('/activate', authController.activateAccount);
router.post('/recover-password', authController.recoverPassword);

// Route Auth Protected (Guarded for Authenticated Users)
router.get('/me', authMiddleware, authController.getProfile);
router.post('/change-password', authMiddleware, authController.changePassword);

// Route Auth Owner Only (Guarded with requireOwner RBAC Middleware)
router.get('/users', authMiddleware, requireOwner, authController.getAllUsers);
router.post('/users', authMiddleware, requireOwner, authController.createUser);
router.put('/users/:id', authMiddleware, requireOwner, authController.updateUser);
router.patch('/users/:id/status', authMiddleware, requireOwner, authController.toggleUserStatus);
router.delete('/users/:id', authMiddleware, requireOwner, authController.deleteUser);
router.post('/users/:id/activation-code', authMiddleware, requireOwner, authController.generateActivationCode);
router.post('/users/assign-pj', authMiddleware, requireOwner, authController.assignEmployeeToPJ);

export default router;
