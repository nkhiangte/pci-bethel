import React, { createContext, useContext, ReactNode } from 'react';
// We import the hook and types directly from your translations file
import { useTranslation as useTranslationsHook, Language, translations } from '../translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  // This defines 't' as a function that takes a string path and returns the translated text
  t: (path: string) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // We use the hook we built to manage the state and provide the translation function
  const { t, lang, changeLanguage } = useTranslationsHook();

  const value = {
    language: lang,
    setLanguage: changeLanguage, 
    t: t, // This is now the working function!
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};