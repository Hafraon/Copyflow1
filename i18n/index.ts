import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translation files
import enCommon from '@/locales/en/common.json'
import ukCommon from '@/locales/uk/common.json'

// Safe DOM manipulation only on client side
const updateDocumentDirection = (language: string) => {
  if (typeof window === 'undefined') return
  
  const isRTL = ['ar'].includes(language)
  const direction = isRTL ? 'rtl' : 'ltr'
  
  document.documentElement.dir = direction
  document.documentElement.lang = language
  
  // Update body classes safely
  document.body.classList.remove('rtl', 'ltr')
  document.body.classList.add(direction)
}

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
      },
    })

  // Update document direction when language changes
  i18n.on('languageChanged', updateDocumentDirection)
  
  // Set initial direction
  updateDocumentDirection(i18n.language)
}

export default i18n
export { updateDocumentDirection }