import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import AdminSignUp from './pages/AdminSignUp';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';

function RoleRedirect() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="opacity-60 text-lg">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // If user is authenticated but profile hasn't loaded yet from the database
  if (user && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-navy-600 text-lg font-bold">جاري تحميل بيانات الحساب...</p>
        </div>
      </div>
    );
  }

  switch (profile.role) {
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'doctor':
      return <Navigate to="/doctor" replace />;
    case 'student':
    default:
      return <Navigate to="/student" replace />;
  }
}

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/admin-secret-register-9921" element={<AdminSignUp />} />

      {/* Protected Routes with Layout */}
      <Route element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        {/* Student Route */}
        <Route
          path="/student"
          element={
            <PrivateRoute allowedRoles={['student']}>
              <StudentDashboard />
            </PrivateRoute>
          }
        />

        {/* Admin Route */}
        <Route
          path="/admin"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />

        {/* Doctor Route - Same dashboard as admin but read-only */}
        <Route
          path="/doctor"
          element={
            <PrivateRoute allowedRoles={['doctor']}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
      </Route>

      {/* Root redirect based on role */}
      <Route path="/" element={<RoleRedirect />} />

      {/* 404 - Redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
