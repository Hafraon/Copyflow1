import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translation files
import enCommon from '../locales/en/common.json'
import ukCommon from '../locales/uk/common.json'

// Language resources
const resources = {
  en: {
    common: enCommon
  },
  uk: {
    common: ukCommon
  }
}

// Supported languages with metadata
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦', nativeName: 'Українська' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'es', name: 'Español', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', nativeName: 'Italiano' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱', nativeName: 'Polski' },
  { code: 'pt', name: 'Português', flag: '🇵🇹', nativeName: 'Português' },
  { code: 'zh', name: '中文', flag: '🇨🇳', nativeName: '中文' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', nativeName: '日本語' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', nativeName: 'العربية' }
] as const

// RTL languages
export const RTL_LANGUAGES = ['ar']

// Language detection options
const detectionOptions = {
  // Detection order
  order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
  
  // Cache user language
  caches: ['localStorage'],
  
  // Exclude certain detection methods
  excludeCacheFor: ['cimode'],
  
  // Check for supported languages only
  checkWhitelist: true
}

// Initialize i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    
    // Fallback language
    fallbackLng: 'en',
    
    // Supported languages
    supportedLngs: SUPPORTED_LANGUAGES.map(lang => lang.code),
    
    // Language detection
    detection: detectionOptions,
    
    // Namespace configuration
    defaultNS: 'common',
    ns: ['common'],
    
    // Interpolation options
    interpolation: {
      escapeValue: false // React already escapes
    },
    
    // React options
    react: {
      useSuspense: false // Disable suspense for SSR compatibility
    },
    
    // Debug mode (only in development)
    debug: process.env.NODE_ENV === 'development',
    
    // Key separator
    keySeparator: '.',
    
    // Nested separator
    nsSeparator: ':',
    
    // Return objects for nested keys
    returnObjects: true,
    
    // Return empty string for missing keys in production
    returnEmptyString: process.env.NODE_ENV === 'production',
    
    // Pluralization
    pluralSeparator: '_',
    
    // Context separator
    contextSeparator: '_',
    
    // Load path for additional languages (future)
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json'
    }
  })

// Language change handler with RTL support
i18n.on('languageChanged', (lng) => {
  // Set document direction for RTL languages
  const isRTL = RTL_LANGUAGES.includes(lng)
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
  document.documentElement.lang = lng
  
  // Add RTL class to body for CSS styling
  if (isRTL) {
    document.body.classList.add('rtl')
  } else {
    document.body.classList.remove('rtl')
  }
  
  // Store language preference
  localStorage.setItem('copyflow-language', lng)
})

// Helper functions
export const getCurrentLanguage = () => i18n.language
export const isRTL = () => RTL_LANGUAGES.includes(i18n.language)
export const getSupportedLanguage = (code: string) => 
  SUPPORTED_LANGUAGES.find(lang => lang.code === code)

export default i18n