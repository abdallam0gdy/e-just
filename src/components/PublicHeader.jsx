import { useLanguage } from '../contexts/LanguageContext';

/**
 * PublicHeader - Shared header for public pages (Login, SignUp, AdminSignUp)
 */
export default function PublicHeader({ subtitle = '', accent = 'navy' }) {
  const { t, lang, toggleLang } = useLanguage();
  const accentBorder = accent === 'red' ? 'border-red-500' : 'border-gold-500';
  const accentTitle = accent === 'red' ? 'text-red-700' : 'text-navy-800';

  return (
    <header className="bg-white border-b border-navy-100 shadow-sm w-full">
      <div className="max-w-6xl mx-auto px-3 sm:px-5 lg:px-8">
        <div className="flex items-center justify-between py-2 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src="/logo.png" alt="E-JUST Logo" className="h-8 sm:h-11 object-contain" />
            <div className="hidden sm:block border-r border-navy-200 pr-3 rtl:border-r rtl:pr-3 ltr:border-l ltr:pl-3 ltr:border-r-0 ltr:pr-0">
              <h1 className="text-sm sm:text-base font-bold text-navy-900 leading-tight">{t('uni.name')}</h1>
              <h2 className="text-[10px] sm:text-xs font-semibold text-navy-500">{t('uni.sub')}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <button
              onClick={toggleLang}
              title={lang === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
              className="relative flex items-center bg-white border border-navy-200 shadow-sm hover:shadow-md rounded-full py-1 px-1 sm:py-1 sm:px-1.5 transition-all duration-300"
            >
              <span className={`relative flex items-center w-12 sm:w-14 h-5 sm:h-6 rounded-full transition-colors duration-300 ${lang === 'ar' ? 'bg-navy-900' : 'bg-gold-500'}`}>
                <span className={`absolute top-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full shadow-md transition-all duration-300 flex items-center justify-center text-[8px] font-black ${lang === 'ar' ? 'right-0.5 text-navy-900' : 'left-0.5 text-gold-600'}`}>
                  {lang === 'ar' ? 'ع' : 'E'}
                </span>
                <span className={`absolute text-[8px] sm:text-[9px] font-black text-white transition-all duration-300 ${lang === 'ar' ? 'left-1.5' : 'right-1'}`}>
                  {lang === 'ar' ? 'EN' : 'عر'}
                </span>
              </span>
            </button>
            <div className={`hidden sm:block text-left border-l-3 ${accentBorder} pl-3`}>
              <h1 className={`text-sm font-bold ${accentTitle}`}>{t('system.name')}</h1>
              <p className="text-[10px] text-navy-400">{subtitle || t('system.name')}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
