import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../config/routes';

export default function RoleRoute({ roles = [] }) {
  const { user } = useAuth();
  return roles.includes(user?.role) ? <Outlet /> : <Navigate to={ROUTES.HOME} replace />;
}
