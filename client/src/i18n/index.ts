import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Import translation resources
import enTranslations from './locales/en.json';
import hiTranslations from './locales/hi.json';
import bnTranslations from './locales/bn.json';
import taTranslations from './locales/ta.json';
import teTranslations from './locales/te.json';
import mrTranslations from './locales/mr.json';
import guTranslations from './locales/gu.json';
import knTranslations from './locales/kn.json';
import mlTranslations from './locales/ml.json';
import paTranslations from './locales/pa.json';
import orTranslations from './locales/or.json';
import asTranslations from './locales/as.json';

// Language configuration
export const supportedLanguages = {
  en: { name: 'English', nativeName: 'English', flag: '🇺🇸' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  bn: { name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  ta: { name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  te: { name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  mr: { name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  gu: { name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  kn: { name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  ml: { name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  pa: { name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  or: { name: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  as: { name: 'Assamese', nativeName: 'অসমীয়া', flag: '🇮🇳' },
};

export const defaultLanguage = 'hi'; // Hindi as default for Indian market
export const fallbackLanguage = 'en';

// Translation resources
const resources = {
  en: { translation: enTranslations },
  hi: { translation: hiTranslations },
  bn: { translation: bnTranslations },
  ta: { translation: taTranslations },
  te: { translation: teTranslations },
  mr: { translation: mrTranslations },
  gu: { translation: guTranslations },
  kn: { translation: knTranslations },
  ml: { translation: mlTranslations },
  pa: { translation: paTranslations },
  or: { translation: orTranslations },
  as: { translation: asTranslations },
};

// Language detection options
const detectionOptions = {
  order: ['localStorage', 'navigator', 'htmlTag'],
  lookupLocalStorage: 'vyapar-mitra-language',
  caches: ['localStorage'],
  excludeCacheFor: ['cimode'],
};

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: defaultLanguage,
    fallbackLng: fallbackLanguage,
    
    detection: detectionOptions,
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    react: {
      useSuspense: false, // Disable suspense for better error handling
    },
    
    backend: {
      loadPath: '/locales/{{lng}}.json',
    },
    
    // Namespace configuration
    defaultNS: 'translation',
    ns: ['translation'],
    
    // Debug mode (disable in production)
    debug: process.env.NODE_ENV === 'development',
    
    // Key separator
    keySeparator: '.',
    nsSeparator: ':',
    
    // Pluralization
    pluralSeparator: '_',
    contextSeparator: '_',
    
    // Return objects for complex translations
    returnObjects: true,
    returnEmptyString: false,
    
    // Formatting
    formatSeparator: ',',
    
    // Missing key handling
    saveMissing: process.env.NODE_ENV === 'development',
    missingKeyHandler: (lng, ns, key) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Missing translation key: ${key} for language: ${lng}`);
      }
    },
  });

// Helper functions
export const changeLanguage = (language: string) => {
  return i18n.changeLanguage(language);
};

export const getCurrentLanguage = () => {
  return i18n.language || defaultLanguage;
};

export const isRTL = (language?: string) => {
  const lang = language || getCurrentLanguage();
  // Add RTL languages if needed (none in current Indian languages)
  return false;
};

export const getLanguageDirection = (language?: string) => {
  return isRTL(language) ? 'rtl' : 'ltr';
};

export const formatCurrency = (amount: number, language?: string) => {
  const lang = language || getCurrentLanguage();
  
  // Indian Rupee formatting for all Indian languages
  if (lang !== 'en') {
    return new Intl.NumberFormat('hi-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }
  
  // English formatting
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatNumber = (number: number, language?: string) => {
  const lang = language || getCurrentLanguage();
  
  if (lang !== 'en') {
    return new Intl.NumberFormat('hi-IN').format(number);
  }
  
  return new Intl.NumberFormat('en-IN').format(number);
};

export const formatDate = (date: Date, language?: string) => {
  const lang = language || getCurrentLanguage();
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  if (lang !== 'en') {
    return new Intl.DateTimeFormat(`${lang}-IN`, options).format(date);
  }
  
  return new Intl.DateTimeFormat('en-IN', options).format(date);
};

export default i18n;