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

interface TranslationsContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: keyof AppTranslations, replacements?: { [key: string]: string | number }) => string;
  isLoading: boolean;
}

const TranslationsContext = createContext<TranslationsContextType | undefined>(undefined);

export const TranslationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize language from localStorage safely after mount
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('saywhaaat_language');
      if (savedLang && Object.values(Language).includes(savedLang as Language)) {
        setLanguageState(savedLang as Language);
      }
    } catch (error) {
      // localStorage might not be available in some environments
      console.warn('Could not access localStorage for language preference:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const translations = translationsData[language] || translationsData[Language.EN];

  const setLanguage = useCallback((newLanguage: Language) => {
    setLanguageState(newLanguage);
    try {
      localStorage.setItem('saywhaaat_language', newLanguage);
    } catch (error) {
      console.warn('Could not save language preference to localStorage:', error);
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