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
              className="bg-navy-50 hover:bg-navy-100 text-navy-800 border border-navy-200 py-1 px-2.5 sm:py-1.5 sm:px-3 rounded-md text-[11px] sm:text-xs font-bold transition-all duration-200 flex items-center gap-1"
              title={lang === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
            >
              🌐 {lang === 'ar' ? 'EN' : 'عربي'}
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
