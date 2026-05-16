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
  const { user, profile, loading, profileError, retryProfile, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-50" dir="rtl">
        <div className="text-center">
          <div className="spinner mx-auto mb-3"></div>
          <p className="text-navy-400 text-sm">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Profile failed to load - show error with retry/logout options
  if (user && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-50 p-4" dir="rtl">
        <div className="text-center max-w-sm bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          {profileError ? (
            <>
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-navy-900 mb-2">فشل تحميل البيانات</h3>
              <p className="text-navy-400 text-xs mb-5">تعذر تحميل بيانات حسابك. تأكد من اتصالك بالإنترنت.</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={retryProfile}
                  className="bg-navy-900 hover:bg-navy-800 text-white font-bold py-2 px-5 rounded-lg text-xs transition-colors"
                >
                  إعادة المحاولة
                </button>
                <button
                  onClick={signOut}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-5 rounded-lg text-xs transition-colors"
                >
                  تسجيل الخروج
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="spinner mx-auto mb-3"></div>
              <p className="text-navy-500 text-sm font-bold">جاري تحميل بيانات الحساب...</p>
            </>
          )}
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
