import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user, profile } = useAuth();
  const navigate = useNavigate();

  // Handle automatic redirect if already logged in and profile is loaded
  useEffect(() => {
    if (user && profile) {
      navigate('/', { replace: true });
    }
  }, [user, profile, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      // Removed the setTimeout navigate from here because useEffect will handle it
      // when the auth state updates and profile is fetched.
    } catch (err) {
      console.error("Login Error Debug:", err);
      if (err.message?.includes('Invalid login credentials')) {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('يرجى تأكيد بريدك الإلكتروني أولاً');
      } else {
        setError(`رسالة الخطأ: ${err.message || JSON.stringify(err)} ${err.status ? '(كود: ' + err.status + ')' : ''}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-right">
      <PublicHeader subtitle="تسجيل الدخول للبوابة" />

      {/* Login Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-slide-up">
          <div className="card p-8 bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-navy-900 mb-2">تسجيل الدخول</h2>
              <p className="text-gray-500">نظام الحضور الإلكتروني - EduAttend</p>
            </div>

            {error && (
              <div className="alert-error mb-6 p-4 rounded bg-red-50 text-red-700 border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-navy-800 mb-2">
                  البريد الإلكتروني الجامعي
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    className="input-field w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-navy-600 focus:ring-0 outline-none text-left"
                    placeholder="user@ejust.edu.eg"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-bold text-navy-800 mb-2">
                  كلمة المرور
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    className="input-field w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-navy-600 focus:ring-0 outline-none text-left"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    dir="ltr"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-navy-900 text-white font-bold rounded-lg py-3 hover:bg-navy-800 transition-colors shadow-md mt-2"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="spinner !w-5 !h-5 !border-2"></div>
                    جاري الدخول...
                  </span>
                ) : (
                  'تسجيل الدخول'
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-gray-600 text-sm">
                ليس لديك حساب؟{' '}
                <Link
                  to="/signup"
                  className="text-navy-600 hover:text-navy-900 font-bold underline decoration-2 underline-offset-4"
                >
                  إنشاء حساب جديد
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
