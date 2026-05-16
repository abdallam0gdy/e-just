import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';

const roles = [
  { value: 'student', label: 'طالب' },
  { value: 'doctor', label: 'عضو هيئة تدريس' },
];

export default function SignUp() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('كلمة المرور غير متطابقة');
      return;
    }

    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (!email.toLowerCase().endsWith('@ejust.edu.eg')) {
      setError('غير مسموح بإنشاء حساب إلا للبريد الجامعي التابع لـ E-JUST (@ejust.edu.eg)');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, fullName, role);
      setSuccess('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      console.error("SignUp Error Debug:", err);
      if (err.message?.includes('already registered')) {
        setError('البريد الإلكتروني مسجل بالفعل');
      } else {
        // Show the exact error message and any code/status for debugging FortiGuard
        setError(`رسالة الخطأ: ${err.message || JSON.stringify(err)} ${err.status ? '(كود: ' + err.status + ')' : ''}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-right">
      <PublicHeader subtitle="إنشاء حساب جديد" />

      {/* SignUp Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg animate-slide-up">
          <div className="card p-6 sm:p-8 bg-white rounded-xl shadow-lg border border-gray-100 my-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-navy-900 mb-2">تسجيل حساب جديد</h2>
              <p className="text-gray-500">نظام الحضور الإلكتروني - EduAttend</p>
            </div>

            {error && <div className="alert-error mb-6 p-4 rounded bg-red-50 text-red-700 border border-red-200">{error}</div>}
            {success && <div className="alert-success mb-6 p-4 rounded bg-green-50 text-green-700 border border-green-200">{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-navy-800 mb-2">الاسم الرباعي</label>
                <input
                  type="text"
                  className="input-field w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-navy-600 focus:ring-0 outline-none"
                  placeholder="أدخل اسمك بالكامل كما في الكارنيه"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-navy-800 mb-2">البريد الإلكتروني الجامعي</label>
                <input
                  type="email"
                  className="input-field w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-navy-600 focus:ring-0 outline-none text-left"
                  placeholder="user@ejust.edu.eg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-navy-800 mb-2">صفة المستخدم</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {roles.map((r) => (
                    <label
                      key={r.value}
                      className={`
                        cursor-pointer border-2 rounded-lg p-3 text-center text-sm font-bold transition-all
                        ${role === r.value 
                          ? 'border-navy-900 bg-navy-50 text-navy-900' 
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'}
                      `}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={r.value}
                        checked={role === r.value}
                        onChange={(e) => setRole(e.target.value)}
                        className="hidden"
                      />
                      {r.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-navy-800 mb-2">كلمة المرور</label>
                  <input
                    type="password"
                    className="input-field w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-navy-600 focus:ring-0 outline-none text-left"
                    placeholder="6 أحرف على الأقل"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-navy-800 mb-2">تأكيد كلمة المرور</label>
                  <input
                    type="password"
                    className="input-field w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-navy-600 focus:ring-0 outline-none text-left"
                    placeholder="أعد كتابة كلمة المرور"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    dir="ltr"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-navy-900 text-white font-bold rounded-lg py-3 hover:bg-navy-800 transition-colors shadow-md mt-6" 
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="spinner !w-5 !h-5 !border-2"></div>
                    جاري التسجيل...
                  </span>
                ) : (
                  'تسجيل الحساب'
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-gray-600 text-sm">
                لديك حساب بالفعل؟{' '}
                <Link to="/login" className="text-navy-600 hover:text-navy-900 font-bold underline decoration-2 underline-offset-4">
                  العودة لتسجيل الدخول
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
