import React, { createContext, useContext } from 'react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translations from '../locales/it.json';

// Inizializzazione di i18next
i18n
  .use(initReactI18next)
  .init({
    resources: {
      it: {
        translation: translations
      }
    },
    lng: 'it',
    fallbackLng: 'it',
    interpolation: {
      escapeValue: false
    },
    compatibilityJSON: 'v3'
  });

// Definizione dell'interfaccia del contesto
interface LanguageContextType {
  t: (key: string, params?: Record<string, any>) => string;
  changeLanguage: (lang: string) => void;
}

// Creazione del contesto
export const LanguageContext = createContext<LanguageContextType>({
  t: (key: string) => key,
  changeLanguage: () => {},
});

// Funzione helper per ottenere la traduzione
const getTranslation = (key: string, params?: Record<string, any>): string => {
  try {
    // Usa i18next per la traduzione
    return i18n.t(key, params);
  } catch (error) {
    // Gestiamo silenziosamente l'errore e ritorniamo il valore di fallback
    return params?.defaultValue || key;
  }
};

// Provider del contesto
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Funzione di traduzione
  const t = (key: string, params?: Record<string, any>) => {
    return getTranslation(key, params);
  };

  // Funzione per cambiare lingua
  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const value = {
    t,
    changeLanguage
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook per utilizzare il contesto
export const useTranslation = () => {
  const context = useContext(LanguageContext);
  
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  
  return context;
}; 