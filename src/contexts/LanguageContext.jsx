import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import translations from '../lib/translations';

const LanguageContext = createContext({});

export const useLanguage = () => useContext(LanguageContext);

/**
 * LanguageProvider - Provides i18n support (Arabic / English)
 * - Persists language choice in localStorage
 * - Dynamically updates <html> dir and lang attributes
 * - t('key.path') resolves translation strings
 * - t('key', { name: 'value' }) supports {name} placeholders
 */
export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('eduattend-lang') || 'ar';
  });

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  // Update <html> element attributes when language changes
  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
    localStorage.setItem('eduattend-lang', lang);
  }, [lang, dir]);

  const toggleLang = useCallback(() => {
    setLang(prev => prev === 'ar' ? 'en' : 'ar');
  }, []);

  // Translation function: t('section.key') or t('section.key', { name: 'value' })
  const t = useCallback((key, params) => {
    const keys = key.split('.');
    let result = translations[lang];
    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) return key; // fallback to key if not found
    }
    // Handle {placeholder} replacements
    if (params && typeof result === 'string') {
      Object.entries(params).forEach(([k, v]) => {
        result = result.replace(`{${k}}`, v);
      });
    }
    return result;
  }, [lang]);

  const value = { lang, dir, t, toggleLang };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
