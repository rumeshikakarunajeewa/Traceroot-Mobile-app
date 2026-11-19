import { useState, useEffect } from 'react';
import {
  AppLanguage,
  SUPPORTED_LANGUAGES,
  LanguageOption,
  translations,
  TranslationKey,
} from './translations';

let currentLanguage: AppLanguage = 'en';
const listeners = new Set<(lang: AppLanguage) => void>();

function notify() {
  listeners.forEach((listener) => listener(currentLanguage));
}

export function getLanguage(): AppLanguage {
  return currentLanguage;
}

export function setLanguage(lang: AppLanguage) {
  if (currentLanguage !== lang) {
    currentLanguage = lang;
    notify();
  }
}

export function t(key: TranslationKey): string {
  const langDict = translations[currentLanguage] || translations.en;
  return langDict[key] || translations.en[key] || key;
}

export function getCurrentLanguageOption(): LanguageOption {
  return (
    SUPPORTED_LANGUAGES.find((opt) => opt.code === currentLanguage) ||
    SUPPORTED_LANGUAGES[0]
  );
}

/**
 * React hook to subscribe to real-time language state changes
 */
export function useLanguage(): {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: TranslationKey) => string;
  currentOption: LanguageOption;
  supportedLanguages: LanguageOption[];
} {
  const [lang, setLang] = useState<AppLanguage>(currentLanguage);

  useEffect(() => {
    const listener = (newLang: AppLanguage) => setLang(newLang);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    language: lang,
    setLanguage,
    t,
    currentOption: getCurrentLanguageOption(),
    supportedLanguages: SUPPORTED_LANGUAGES,
  };
}
