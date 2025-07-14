import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translation files
import enCommon from '@/locales/en/common.json'
import ukCommon from '@/locales/uk/common.json'

// RTL languages - exported for use in LanguageProvider
export const RTL_LANGUAGES = ['ar']

const resources = {
  en: {
    common: enCommon,
  },
  uk: {
    common: ukCommon,
  },
  de: {
    common: enCommon, // Fallback to English for now
  },
  es: {
    common: enCommon, // Fallback to English for now
  },
  fr: {
    common: enCommon, // Fallback to English for now
  },
  it: {
    common: enCommon, // Fallback to English for now
  },
  pl: {
    common: enCommon, // Fallback to English for now
  },
  pt: {
    common: enCommon, // Fallback to English for now
  },
  zh: {
    common: enCommon, // Fallback to English for now
  },
  ja: {
    common: enCommon, // Fallback to English for now
  },
  ar: {
    common: enCommon, // Fallback to English for now
  },
}

// Initialize i18n only on client side
if (typeof window !== 'undefined') {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      lng: 'en',
      fallbackLng: 'en',
      debug: process.env.NODE_ENV === 'development',
      
      interpolation: {
        escapeValue: false,
      },
      
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
      }
    })
}

export default i18n

// Helper function to get current language
export function getCurrentLanguage(): string | undefined {
  if (typeof window === 'undefined') return undefined
  return i18n.language
}