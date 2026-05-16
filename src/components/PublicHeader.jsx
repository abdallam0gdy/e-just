/**
 * PublicHeader - Shared header for public pages (Login, SignUp, AdminSignUp)
 */
export default function PublicHeader({ subtitle = 'نظام EduAttend', accent = 'navy' }) {
  const accentBorder = accent === 'red' ? 'border-red-500' : 'border-gold-500';
  const accentTitle = accent === 'red' ? 'text-red-700' : 'text-navy-800';

  return (
    <header className="bg-white border-b border-navy-100 shadow-sm w-full" dir="rtl">
      <div className="max-w-6xl mx-auto px-3 sm:px-5 lg:px-8">
        <div className="flex items-center justify-between py-2 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src="/logo.png" alt="E-JUST Logo" className="h-8 sm:h-11 object-contain" />
            <div className="hidden sm:block border-r border-navy-200 pr-3">
              <h1 className="text-sm sm:text-base font-bold text-navy-900 leading-tight">الجامعة المصرية اليابانية</h1>
              <h2 className="text-[10px] sm:text-xs font-semibold text-navy-500">للعلوم والتكنولوجيا</h2>
            </div>
          </div>
          <div className={`hidden sm:block text-left border-l-3 ${accentBorder} pl-3`}>
            <h1 className={`text-sm font-bold ${accentTitle}`}>نظام EduAttend</h1>
            <p className="text-[10px] text-navy-400">{subtitle}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
