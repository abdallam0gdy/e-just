/**
 * PublicHeader - Shared header for public pages (Login, SignUp, AdminSignUp)
 * @param {object} props
 * @param {string} props.subtitle - The subtitle text (e.g. "تسجيل الدخول للبوابة")
 * @param {'navy'|'red'} [props.accent='navy'] - Accent color theme
 */
export default function PublicHeader({ subtitle = 'نظام EduAttend', accent = 'navy' }) {
  const accentBorder = accent === 'red' ? 'border-red-500' : 'border-gold-500';
  const accentTitle = accent === 'red' ? 'text-red-700' : 'text-navy-800';

  return (
    <header className="bg-white border-b-2 border-navy-100 shadow-sm w-full" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between py-3 sm:py-4">
          {/* Logo + University Name */}
          <div className="flex items-center gap-3 sm:gap-4">
            <img 
              src="/logo.png" 
              alt="E-JUST Logo" 
              className="h-10 sm:h-14 object-contain"
            />
            <div className="hidden sm:block border-r-2 border-navy-200 pr-4">
              <h1 className="text-base sm:text-lg font-bold text-navy-900 leading-tight">الجامعة المصرية اليابانية</h1>
              <h2 className="text-xs sm:text-sm font-semibold text-navy-500">للعلوم والتكنولوجيا</h2>
            </div>
          </div>

          {/* System Name Badge */}
          <div className={`hidden sm:block text-left border-l-4 ${accentBorder} pl-4`}>
            <h1 className={`text-base font-bold ${accentTitle}`}>نظام EduAttend</h1>
            <p className="text-xs text-navy-400 font-medium">{subtitle}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
