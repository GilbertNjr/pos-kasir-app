import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './AuthMiddleware';
import { UserRole } from '../types/domain';
import { RolePermissionRepository } from '../repositories/RolePermissionRepository';

const rolePermissionRepo = new RolePermissionRepository();

/**
 * Middleware untuk membatasi endpoint khusus Role tertentu (misal: OWNER, PENANGGUNG_JAWAB)
 */
export const requireRole = (...allowedRoles: (UserRole | string)[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Tidak terautentikasi.' });
    }

    const userRole = String(req.user.role || '').trim().toUpperCase();
    const allowed = allowedRoles.map((r) => String(r).trim().toUpperCase());

    if (!allowed.includes(userRole)) {
      return res.status(403).json({
        error: `Akses ditolak. Fitur ini memerlukan role ${allowedRoles.join(' atau ')}. (Role Anda: ${req.user.role})`,
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
 * Middleware khusus Penanggung Jawab / Owner (Shorthand)
 */
export const requirePJOrOwner = requireRole('OWNER', 'PENANGGUNG_JAWAB');

/**
 * Middleware untuk memverifikasi permission aksi/fitur dinamis (e.g. 'dashboard.owner.view', 'employee.manage_all')
 */
export const requirePermission = (permissionCode: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Tidak terautentikasi.' });
    }

    if (req.user.role === 'OWNER') {
      return next(); // Owner memegang izin absolut terhadap seluruh fitur
    }

    let userPermissions = req.user.permissions || [];
    if (!userPermissions || userPermissions.length === 0) {
      userPermissions = await rolePermissionRepo.getPermissionsForRole(req.user.role);
    }

    if (!userPermissions.includes(permissionCode)) {
      return res.status(403).json({
        error: `Akses ditolak. Hak akses Anda (${req.user.role}) tidak memiliki izin '${permissionCode}'.`,
      });
    }

    next();
  };
};
