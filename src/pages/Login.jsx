import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user, profile } = useAuth();
  const { t, dir } = useLanguage();
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
    } catch (err) {
      console.error("Login Error Debug:", err);
      if (err.message?.includes('Invalid login credentials')) {
        setError(t('auth.invalidCredentials'));
      } else if (err.message?.includes('Email not confirmed')) {
        setError(t('auth.emailNotConfirmed'));
      } else {
        setError(`${t('auth.errorPrefix')} ${err.message || JSON.stringify(err)} ${err.status ? t('auth.codePrefix') + ' ' + err.status + ')' : ''}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" dir={dir}>
      <PublicHeader subtitle={t('login.subtitle')} />

      <div className="flex-1 flex items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="card p-5 sm:p-6 bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="text-center mb-5 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-navy-900 mb-1">{t('login.title')}</h2>
              <p className="text-gray-500 text-xs sm:text-sm">{t('system.subtitle')}</p>
            </div>

            {error && (
              <div className="alert-error mb-4 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-navy-800 mb-1.5">{t('login.email')}</label>
                <input id="email" type="email" className="input-field w-full px-3 py-2 sm:py-2.5 rounded-lg border border-gray-200 focus:border-navy-600 outline-none text-left text-sm" placeholder="user@ejust.edu.eg" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" />
              </div>
              <div>
                <label htmlFor="password" className="block text-xs font-bold text-navy-800 mb-1.5">{t('login.password')}</label>
                <input id="password" type="password" className="input-field w-full px-3 py-2 sm:py-2.5 rounded-lg border border-gray-200 focus:border-navy-600 outline-none text-left text-sm" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required dir="ltr" />
              </div>
              <button type="submit" className="w-full bg-navy-900 text-white font-bold rounded-lg py-2.5 hover:bg-navy-800 transition-colors shadow-sm text-sm" disabled={loading}>
                {loading ? (<span className="flex items-center justify-center gap-2"><div className="spinner !w-4 !h-4 !border-2"></div>{t('login.submitting')}</span>) : t('login.submit')}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-gray-100 text-center">
              <p className="text-gray-600 text-xs">
                {t('login.noAccount')}{' '}
                <Link to="/signup" className="text-navy-600 hover:text-navy-900 font-bold underline decoration-1 underline-offset-4">{t('login.createAccount')}</Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
