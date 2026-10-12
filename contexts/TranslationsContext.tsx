import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Language, AppTranslations } from '../types';
import { DEFAULT_LANGUAGE, APP_VERSION } from '../constants';
import { enTranslations, heTranslations, ptTranslations, hiTranslations, arTranslations, idTranslations, zhTranslations } from '../translations';

const translationsData = {
  [Language.EN]: enTranslations,
  [Language.HE]: heTranslations,
  [Language.PT]: ptTranslations,
  [Language.HI]: hiTranslations,
  [Language.AR]: arTranslations,
  [Language.ID]: idTranslations,
  [Language.ZH]: zhTranslations,
};

const getInitialLanguage = (): Language => {
  try {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const urlLang = searchParams.get('lang');
      if (urlLang && Object.values(Language).includes(urlLang as Language)) {
        try {
          localStorage.setItem('saywhaaat_language', urlLang);
        } catch (_) {}
        return urlLang as Language;
      }
      const savedLang = localStorage.getItem('saywhaaat_language');
      if (savedLang && Object.values(Language).includes(savedLang as Language)) {
        return savedLang as Language;
      }
      if (typeof navigator !== 'undefined' && navigator.language) {
        const sysLang = navigator.language.toLowerCase();
        if (sysLang.startsWith('he')) return Language.HE;
        if (sysLang.startsWith('ar')) return Language.AR;
        if (sysLang.startsWith('pt')) return Language.PT;
        if (sysLang.startsWith('hi')) return Language.HI;
        if (sysLang.startsWith('id')) return Language.ID;
        if (sysLang.startsWith('zh')) return Language.ZH;
      }
    }
  } catch (error) {
    console.warn('Could not access localStorage for initial language:', error);
  }
  return DEFAULT_LANGUAGE;
};

interface TranslationsContextType {
  language: Language;
  setLanguage: (language: Language, persist?: boolean) => void;
  t: (key: keyof AppTranslations, replacements?: { [key: string]: string | number }) => string;
  isLoading: boolean;
}

const TranslationsContext = createContext<TranslationsContextType | undefined>(undefined);

export const TranslationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);
  const [isLoading, setIsLoading] = useState(false);

  // Keep html document dir and lang attributes in sync
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (language === Language.HE || language === Language.AR) {
        document.documentElement.dir = 'rtl';
        document.documentElement.lang = language;
      } else {
        document.documentElement.dir = 'ltr';
        document.documentElement.lang = language;
      }
    }
  }, [language]);

  const translations = translationsData[language] || translationsData[Language.EN];

  const setLanguage = useCallback((newLanguage: Language, persist: boolean = true) => {
    setLanguageState(newLanguage);
    if (persist) {
      try {
        localStorage.setItem('saywhaaat_language', newLanguage);
      } catch (error) {
        console.warn('Could not save language preference to localStorage:', error);
      }
    }
  }, []);

  const t = useCallback((key: keyof AppTranslations, replacements?: { [key: string]: string | number }): string => {
    let template = translations[key] || key;
    if (typeof template !== 'string') return key;

    if ( replacements ) {
        Object.entries(replacements).forEach(([placeholder, value]) => {
            template = template.replace(`{${placeholder}}`, String(value));
        });
    }

    return template;
  }, [translations]);

  const value = { language, setLanguage, t, isLoading };

  return (
    <TranslationsContext.Provider value={value}>
      {children}
    </TranslationsContext.Provider>
  );
};

export const useTranslations = (): TranslationsContextType => {
  const context = useContext(TranslationsContext);
  if (context === undefined) {
    throw new Error('useTranslations must be used within a TranslationsProvider');
  }
  return context;
};