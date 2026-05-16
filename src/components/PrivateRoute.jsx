import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * PrivateRoute - Protects routes by authentication and optionally by role
 * @param {object} props
 * @param {React.ReactNode} props.children - The component to render
 * @param {string[]} [props.allowedRoles] - Optional array of allowed roles
 */
export default function PrivateRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-50">
        <div className="text-center">
          <div className="spinner mx-auto mb-3"></div>
          <p className="text-navy-400 text-xs">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User exists but profile hasn't loaded yet - let children render
  // (the RoleRedirect in App.jsx handles the error state)
  if (!profile) {
    return children;
  }

  // Check role if allowedRoles is specified
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    // Redirect to their correct dashboard
    if (profile.role === 'student') return <Navigate to="/student" replace />;
    if (profile.role === 'admin') return <Navigate to="/admin" replace />;
    if (profile.role === 'doctor') return <Navigate to="/doctor" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}
