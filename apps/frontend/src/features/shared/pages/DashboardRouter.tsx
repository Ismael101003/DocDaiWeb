import { Navigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { homePathForRole } from '@/utils/formatters';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export function DashboardRouter() {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen label="Loading workspace" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={homePathForRole(user.role)} replace />;
}
