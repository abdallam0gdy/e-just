import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * PrivateRoute - Protects routes by authentication and optionally by role
 * @param {object} props
 * @param {React.ReactNode} props.children - The component to render
 * @param {string[]} [props.allowedRoles] - Optional array of allowed roles
 */
export default function PrivateRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-500 text-lg">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role if allowedRoles is specified
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // Redirect to their correct dashboard
    if (profile.role === 'student') return <Navigate to="/student" replace />;
    if (profile.role === 'admin') return <Navigate to="/admin" replace />;
    if (profile.role === 'doctor') return <Navigate to="/doctor" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}
