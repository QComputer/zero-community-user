import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Import translation files
import enTranslations from './locales/en/translation.json';
import faTranslations from './locales/fa/translation.json';

const resources = {
  en: {
    translation: enTranslations
  },
  fa: {
    translation: faTranslations
  }
};

i18n
  // Use the LanguageDetector to detect user language
  .use(LanguageDetector)
  // Allow loading translations from backend (optional)
  .use(Backend)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    fallbackLng: 'fa',
    lng: 'fa', // Set Persian as the default language
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false, // React already protects from XSS
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;