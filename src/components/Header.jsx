import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function Header() {
  const { user, profile, signOut } = useAuth();
  const { t, lang, toggleLang } = useLanguage();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <header className="bg-white border-b border-navy-100 shadow-sm sticky top-0 z-50 w-full">
      <div className="max-w-6xl mx-auto px-3 sm:px-5 lg:px-8 w-full">
        <div className="flex justify-between items-center py-2 sm:py-3">
          {/* Logo and University Name */}
          <div className="flex items-center gap-2 sm:gap-3">
            <img 
              src="/logo.png" 
              alt="E-JUST Logo" 
              className="h-8 sm:h-11 object-contain"
            />
            <div className="hidden sm:block border-r border-navy-200 pr-3 rtl:border-r rtl:pr-3 ltr:border-l ltr:pl-3 ltr:border-r-0 ltr:pr-0">
              <h1 className="text-sm sm:text-base font-bold text-navy-900 leading-tight">{t('uni.name')}</h1>
              <h2 className="text-[10px] sm:text-xs font-semibold text-navy-500">{t('uni.sub')}</h2>
            </div>
          </div>

          {/* User Info & Actions */}
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <button
              onClick={toggleLang}
              title={lang === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
              className="relative flex items-center gap-1.5 bg-white border border-navy-200 shadow-sm hover:shadow-md rounded-full py-1 px-1 sm:py-1 sm:px-1.5 transition-all duration-300 group overflow-hidden"
            >
              {/* Track */}
              <span className={`relative flex items-center w-12 sm:w-14 h-5 sm:h-6 rounded-full transition-colors duration-300 ${lang === 'ar' ? 'bg-navy-900' : 'bg-gold-500'}`}>
                {/* Knob */}
                <span className={`absolute top-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full shadow-md transition-all duration-300 flex items-center justify-center text-[8px] font-black ${lang === 'ar' ? 'right-0.5 text-navy-900' : 'left-0.5 text-gold-600'}`}>
                  {lang === 'ar' ? 'ع' : 'E'}
                </span>
                {/* Label inside track */}
                <span className={`absolute text-[8px] sm:text-[9px] font-black text-white transition-all duration-300 ${lang === 'ar' ? 'left-1.5' : 'right-1'}`}>
                  {lang === 'ar' ? 'EN' : 'عر'}
                </span>
              </span>
            </button>

            {user && profile && (
              <>
                <div className="hidden md:flex flex-col items-end">
                  <p className="text-xs font-bold text-navy-900">{profile.full_name}</p>
                  <p className="text-[10px] text-navy-400" dir="ltr">{user.email}</p>
                </div>
                
                <span className="bg-navy-900 text-white px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-[11px] font-bold hidden sm:inline-flex">
                  {t(`roles.${profile.role}`) || t('user')}
                </span>

                <button
                  onClick={handleSignOut}
                  className="bg-navy-50 text-navy-800 border border-navy-200 hover:bg-navy-900 hover:text-white hover:border-navy-900 py-1 px-3 sm:py-1.5 sm:px-4 rounded-md text-[11px] sm:text-xs font-bold transition-all duration-200 whitespace-nowrap"
                >
                  {t('signOut')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
