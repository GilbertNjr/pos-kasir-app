import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './AuthMiddleware';
import { UserRole } from '../types/domain';
import { hasPermission, PermissionAction } from '../utils/rbac';

/**
 * Middleware untuk membatasi endpoint khusus Role tertentu (misal: OWNER)
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Tidak terautentikasi.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Akses ditolak. Fitur ini memerlukan role ${allowedRoles.join(' atau ')}.`,
      });
    }

    next();
  };
};

/**
 * Middleware khusus Owner Only (Shorthand)
 */
export const requireOwner = requireRole('OWNER');

/**
 * Middleware untuk memverifikasi permission aksi tertentu
 */
export const requirePermission = (action: PermissionAction) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Tidak terautentikasi.' });
    }

    if (!hasPermission(req.user.role, action)) {
      return res.status(403).json({
        error: `Akses ditolak. Role Anda (${req.user.role}) tidak memiliki izin untuk aksi '${action}'.`,
      });
    }

    next();
  };
};
