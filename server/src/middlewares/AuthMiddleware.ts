import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'pos-kasir-super-secret-jwt-key-2026';

export interface AuthenticatedUserPayload {
  user_id: string;
  username: string;
  role: 'OWNER' | 'PENANGGUNG_JAWAB' | 'KARYAWAN';
  is_pj?: boolean;
  permissions?: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUserPayload;
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Akses ditolak. Token otentikasi tidak ditemukan.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUserPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Token otentikasi tidak valid atau telah kadaluwarsa.',
    });
  }
};
