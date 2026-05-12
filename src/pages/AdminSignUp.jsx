import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AdminSignUp() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
      // Hardcoded to 'admin'
      await signUp(email, password, fullName, 'admin');
      setSuccess('تم إنشاء حساب مدير النظام بنجاح! يمكنك الآن تسجيل الدخول.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      console.error("Admin SignUp Error Debug:", err);
      if (err.message?.includes('already registered')) {
        setError('البريد الإلكتروني مسجل بالفعل');
      } else {
        setError(`رسالة الخطأ: ${err.message || JSON.stringify(err)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-right" dir="rtl">
      {/* Formal Header */}
      <header className="bg-white border-b border-gray-200 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="/logo.png" 
              alt="E-JUST Logo" 
              className="h-14 sm:h-16 object-contain"
            />
            <div className="border-r-2 border-gray-300 pr-4">
              <h1 className="text-xl sm:text-2xl font-bold text-navy-900 leading-tight">الجامعة المصرية اليابانية</h1>
              <h2 className="text-sm sm:text-base font-semibold text-navy-600">للعلوم والتكنولوجيا</h2>
            </div>
          </div>
          <div className="hidden sm:block text-left border-l-4 border-red-600 pl-4">
            <h1 className="text-lg font-bold text-red-700">بوابة الإدارة السرية</h1>
            <p className="text-xs text-gray-500">نظام EduAttend</p>
          </div>
        </div>
      </header>

      {/* SignUp Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg animate-slide-up">
          <div className="card p-6 sm:p-8 bg-white rounded-xl shadow-lg border-t-4 border-t-red-600 my-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-red-700 mb-2">إنشاء حساب مدير نظام</h2>
              <p className="text-gray-500 font-bold">هذه الصفحة مخصصة لمديري النظام (Admins) فقط.</p>
            </div>

            {error && <div className="alert-error mb-6 p-4 rounded-lg bg-red-50 text-red-700 border border-red-200 font-bold">{error}</div>}
            {success && <div className="alert-success mb-6 p-4 rounded-lg bg-green-50 text-green-700 border border-green-200 font-bold">{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-navy-800 mb-2">الاسم بالكامل</label>
                <input
                  type="text"
                  className="input-field w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-red-600 focus:ring-0 outline-none"
                  placeholder="اسم مدير النظام"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-navy-800 mb-2">البريد الإلكتروني الجامعي الإداري</label>
                <input
                  type="email"
                  className="input-field w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-red-600 focus:ring-0 outline-none text-left"
                  placeholder="admin@ejust.edu.eg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-navy-800 mb-2">كلمة المرور</label>
                  <input
                    type="password"
                    className="input-field w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-red-600 focus:ring-0 outline-none text-left"
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
                    className="input-field w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-red-600 focus:ring-0 outline-none text-left"
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
                className="w-full bg-red-600 text-white font-bold rounded-lg py-3 hover:bg-red-700 transition-colors shadow-md mt-6" 
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="spinner !w-5 !h-5 !border-2"></div>
                    جاري الإنشاء...
                  </span>
                ) : (
                  'تأكيد وإنشاء الحساب الإداري'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
