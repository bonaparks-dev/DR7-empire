import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations';
import type { Language, Translations } from '../types';

type Translatable = keyof Translations | { en: string; it: string };

export const useTranslation = () => {
  const { language, setLanguage } = useLanguage();

  const t = (field: Translatable): string => {
    if (typeof field === 'string') {
      const key = field as keyof Translations;
      return translations[key]?.[language] || key.toString().replace(/_/g, ' ');
    }
    if (typeof field === 'object' && field !== null && 'en' in field && 'it' in field) {
      return field[language];
    }
    return '';
  };
  
  const getTranslated = <T extends string | { en: string; it: string }>(field: T): string => {
      if (typeof field === 'string') {
          return field;
      }
      return field[language];
  }

  return { t, language, setLanguage, lang: language, getTranslated };
};
