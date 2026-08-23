import { Navigate, Outlet } from 'react-router-dom';
import { hasPermission, type Permission } from '../config/permissions';
import { useAuth } from '../context/AuthContext';

export function PermissionRoute({ permission }: { permission: Permission }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (!hasPermission(user.role, permission)) return <Navigate to="/unauthorized" replace />;

  return <Outlet />;
}
