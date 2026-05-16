import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
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
  const { t, dir } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password !== confirmPassword) { setError(t('auth.passwordMismatch')); return; }
    if (password.length < 6) { setError(t('auth.passwordTooShort')); return; }
    if (!email.toLowerCase().endsWith('@ejust.edu.eg')) {
      setError(t('auth.emailDomainError'));
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, fullName, 'admin');
      setSuccess(t('adminSignup.success'));
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      console.error("Admin SignUp Error Debug:", err);
      if (err.message?.includes('already registered')) {
        setError(t('auth.alreadyRegistered'));
      } else {
        setError(`${t('auth.errorPrefix')} ${err.message || JSON.stringify(err)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" dir={dir}>
      <PublicHeader subtitle={t('adminSignup.subtitle')} accent="red" />

      <div className="flex-1 flex items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-md animate-slide-up">
          <div className="card p-4 sm:p-6 bg-white rounded-xl shadow-lg border-t-3 border-t-red-600 my-2">
            <div className="text-center mb-4 sm:mb-5">
              <h2 className="text-xl sm:text-2xl font-black text-red-700 mb-1">{t('adminSignup.title')}</h2>
              <p className="text-gray-500 text-xs font-bold">{t('adminSignup.desc')}</p>
            </div>

            {error && <div className="alert-error mb-4 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-bold">{error}</div>}
            {success && <div className="alert-success mb-4 p-3 rounded-lg bg-green-50 text-green-700 border border-green-200 text-xs font-bold">{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy-800 mb-1.5">{t('adminSignup.fullName')}</label>
                <input type="text" className="input-field w-full px-3 py-2 sm:py-2.5 rounded-lg border border-gray-200 focus:border-red-600 outline-none text-sm" placeholder={t('adminSignup.fullNamePlaceholder')} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-800 mb-1.5">{t('signup.uniEmail')}</label>
                <input type="email" className="input-field w-full px-3 py-2 sm:py-2.5 rounded-lg border border-gray-200 focus:border-red-600 outline-none text-left text-sm" placeholder="admin@ejust.edu.eg" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy-800 mb-1.5">{t('signup.password')}</label>
                  <input type="password" className="input-field w-full px-3 py-2 sm:py-2.5 rounded-lg border border-gray-200 focus:border-red-600 outline-none text-left text-sm" placeholder={t('signup.passwordPlaceholder')} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} dir="ltr" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy-800 mb-1.5">{t('signup.confirmPassword')}</label>
                  <input type="password" className="input-field w-full px-3 py-2 sm:py-2.5 rounded-lg border border-gray-200 focus:border-red-600 outline-none text-left text-sm" placeholder={t('signup.confirmPasswordPlaceholder')} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required dir="ltr" />
                </div>
              </div>

              <button type="submit" className="w-full bg-red-600 text-white font-bold rounded-lg py-2.5 hover:bg-red-700 transition-colors shadow-sm text-sm mt-2" disabled={loading}>
                {loading ? (<span className="flex items-center justify-center gap-2"><div className="spinner !w-4 !h-4 !border-2"></div>{t('adminSignup.submitting')}</span>) : t('adminSignup.submit')}
              </button>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
