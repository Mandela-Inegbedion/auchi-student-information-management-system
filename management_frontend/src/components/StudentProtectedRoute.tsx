import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { FullPageLoader } from './FullPageLoader';
import { useStudentAuth } from '../context/StudentAuthContext';

export function StudentProtectedRoute() {
  const { student, isLoading } = useStudentAuth();
  const location = useLocation();

  if (isLoading) return <FullPageLoader />;
  if (!student) return <Navigate to="/login" replace state={{ from: location }} />;

  return <Outlet />;
}
