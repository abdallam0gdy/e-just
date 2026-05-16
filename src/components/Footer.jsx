import { useLanguage } from '../contexts/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-navy-900 text-white py-4 sm:py-5 mt-auto w-full border-t-3 border-gold-500">
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-5 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center text-center sm:text-right gap-2 sm:gap-4">
          <div>
            <h3 className="font-bold text-sm sm:text-base mb-0.5">{t('uni.full')}</h3>
            <p className="text-navy-300 text-[11px] sm:text-xs">{t('system.desc')}</p>
          </div>
          <div className="text-navy-400 text-[11px] sm:text-xs" dir="ltr">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </div>
        </div>
      </div>
    </footer>
  );
}
