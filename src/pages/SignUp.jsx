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
    if (password !== confirmPassword) { setError('كلمة المرور غير متطابقة'); return; }
    if (password.length < 6) { setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }
    if (!email.toLowerCase().endsWith('@ejust.edu.eg')) {
      setError('غير مسموح بإنشاء حساب إلا للبريد الجامعي (@ejust.edu.eg)');
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
        setError(`رسالة الخطأ: ${err.message || JSON.stringify(err)} ${err.status ? '(كود: ' + err.status + ')' : ''}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <PublicHeader subtitle="إنشاء حساب جديد" />

      <div className="flex-1 flex items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-md animate-slide-up">
          <div className="card p-4 sm:p-6 bg-white rounded-xl shadow-lg border border-gray-100 my-2">
            <div className="text-center mb-4 sm:mb-5">
              <h2 className="text-xl sm:text-2xl font-bold text-navy-900 mb-1">تسجيل حساب جديد</h2>
              <p className="text-gray-500 text-xs sm:text-sm">نظام الحضور الإلكتروني - EduAttend</p>
            </div>

            {error && <div className="alert-error mb-4 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs">{error}</div>}
            {success && <div className="alert-success mb-4 p-3 rounded-lg bg-green-50 text-green-700 border border-green-200 text-xs">{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy-800 mb-1.5">الاسم الرباعي</label>
                <input type="text" className="input-field w-full px-3 py-2 sm:py-2.5 rounded-lg border border-gray-200 focus:border-navy-600 outline-none text-sm" placeholder="أدخل اسمك بالكامل" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-800 mb-1.5">البريد الإلكتروني الجامعي</label>
                <input type="email" className="input-field w-full px-3 py-2 sm:py-2.5 rounded-lg border border-gray-200 focus:border-navy-600 outline-none text-left text-sm" placeholder="user@ejust.edu.eg" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-800 mb-1.5">صفة المستخدم</label>
                <div className="grid grid-cols-2 gap-2">
                  {roles.map((r) => (
                    <label key={r.value} className={`cursor-pointer border rounded-lg p-2 text-center text-xs font-bold transition-all ${role === r.value ? 'border-navy-900 bg-navy-50 text-navy-900' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                      <input type="radio" name="role" value={r.value} checked={role === r.value} onChange={(e) => setRole(e.target.value)} className="hidden" />
                      {r.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy-800 mb-1.5">كلمة المرور</label>
                  <input type="password" className="input-field w-full px-3 py-2 sm:py-2.5 rounded-lg border border-gray-200 focus:border-navy-600 outline-none text-left text-sm" placeholder="6 أحرف على الأقل" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} dir="ltr" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy-800 mb-1.5">تأكيد كلمة المرور</label>
                  <input type="password" className="input-field w-full px-3 py-2 sm:py-2.5 rounded-lg border border-gray-200 focus:border-navy-600 outline-none text-left text-sm" placeholder="أعد كتابة كلمة المرور" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required dir="ltr" />
                </div>
              </div>

              <button type="submit" className="w-full bg-navy-900 text-white font-bold rounded-lg py-2.5 hover:bg-navy-800 transition-colors shadow-sm text-sm mt-2" disabled={loading}>
                {loading ? (<span className="flex items-center justify-center gap-2"><div className="spinner !w-4 !h-4 !border-2"></div>جاري التسجيل...</span>) : 'تسجيل الحساب'}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
              <p className="text-gray-600 text-xs">
                لديك حساب بالفعل؟{' '}
                <Link to="/login" className="text-navy-600 hover:text-navy-900 font-bold underline decoration-1 underline-offset-4">العودة لتسجيل الدخول</Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
