import { Navigate, Outlet } from 'react-router-dom';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/app/providers/AuthProvider';
import type { UserRole } from '@/types/auth';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children?: React.ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen label="Checking your session" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (children) {
    return <>{children}</>;
  }

  return <Outlet />;
}
