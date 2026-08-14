import React from 'react';
import { UserRole } from '../types';

interface RoleGuardProps {
  userRole?: UserRole;
  allow: UserRole[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * RoleGuard Component - Menyaring elemen UI berdasarkan role pengguna
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  userRole,
  allow,
  fallback = null,
  children,
}) => {
  if (!userRole || !allow.includes(userRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
