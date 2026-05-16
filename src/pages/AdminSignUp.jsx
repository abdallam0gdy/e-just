import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';

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
    if (password !== confirmPassword) { setError('كلمة المرور غير متطابقة'); return; }
    if (password.length < 6) { setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }
    if (!email.toLowerCase().endsWith('@ejust.edu.eg')) {
      setError('غير مسموح بإنشاء حساب إلا للبريد الجامعي (@ejust.edu.eg)');
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, fullName, 'admin');
      setSuccess('تم إنشاء حساب مدير النظام بنجاح!');
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
    <div className="min-h-screen flex flex-col bg-gray-50" dir="rtl">
      <PublicHeader subtitle="بوابة الإدارة السرية" accent="red" />

      <div className="flex-1 flex items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-md animate-slide-up">
          <div className="card p-4 sm:p-6 bg-white rounded-xl shadow-lg border-t-3 border-t-red-600 my-2">
            <div className="text-center mb-4 sm:mb-5">
              <h2 className="text-xl sm:text-2xl font-black text-red-700 mb-1">إنشاء حساب مدير نظام</h2>
              <p className="text-gray-500 text-xs font-bold">مخصصة لمديري النظام (Admins) فقط.</p>
            </div>

            {error && <div className="alert-error mb-4 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-bold">{error}</div>}
            {success && <div className="alert-success mb-4 p-3 rounded-lg bg-green-50 text-green-700 border border-green-200 text-xs font-bold">{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy-800 mb-1.5">الاسم بالكامل</label>
                <input type="text" className="input-field w-full px-3 py-2 sm:py-2.5 rounded-lg border border-gray-200 focus:border-red-600 outline-none text-sm" placeholder="اسم مدير النظام" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-800 mb-1.5">البريد الإلكتروني الجامعي</label>
                <input type="email" className="input-field w-full px-3 py-2 sm:py-2.5 rounded-lg border border-gray-200 focus:border-red-600 outline-none text-left text-sm" placeholder="admin@ejust.edu.eg" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy-800 mb-1.5">كلمة المرور</label>
                  <input type="password" className="input-field w-full px-3 py-2 sm:py-2.5 rounded-lg border border-gray-200 focus:border-red-600 outline-none text-left text-sm" placeholder="6 أحرف على الأقل" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} dir="ltr" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy-800 mb-1.5">تأكيد كلمة المرور</label>
                  <input type="password" className="input-field w-full px-3 py-2 sm:py-2.5 rounded-lg border border-gray-200 focus:border-red-600 outline-none text-left text-sm" placeholder="أعد كتابة كلمة المرور" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required dir="ltr" />
                </div>
              </div>

              <button type="submit" className="w-full bg-red-600 text-white font-bold rounded-lg py-2.5 hover:bg-red-700 transition-colors shadow-sm text-sm mt-2" disabled={loading}>
                {loading ? (<span className="flex items-center justify-center gap-2"><div className="spinner !w-4 !h-4 !border-2"></div>جاري الإنشاء...</span>) : 'تأكيد وإنشاء الحساب'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
