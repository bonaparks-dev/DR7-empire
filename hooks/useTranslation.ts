
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations';
import type { Language } from '../types';

export const useTranslation = () => {
  const { language } = useLanguage();

  const t = (key: keyof typeof translations): string => {
    return translations[key]?.[language] || key.toString().replace(/_/g, ' ');
  };
  
  const getTranslated = <T extends string | { en: string; it: string }>(field: T): string => {
      if (typeof field === 'string') {
          return field;
      }
      return field[language];
  }

  return { t, lang: language, getTranslated };
};