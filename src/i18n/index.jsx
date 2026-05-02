import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, supportedLanguages } from './translations';

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('sb-lang');
    if (saved && translations[saved]) return saved;
    const browserLang = navigator.language.slice(0, 2);
    return translations[browserLang] ? browserLang : 'he';
  });

  const t = useCallback(
    (key, fallback = '') => {
      const val = translations[lang]?.[key];
      return val !== undefined ? val : (translations['en']?.[key] ?? fallback);
    },
    [lang]
  );

  const dir = translations[lang]?.dir ?? 'rtl';

  useEffect(() => {
    localStorage.setItem('sb-lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const currentLanguage = supportedLanguages.find((l) => l.code === lang);

  return (
    <I18nContext.Provider value={{ lang, setLang, t, dir, currentLanguage, supportedLanguages }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be inside I18nProvider');
  return ctx;
}
