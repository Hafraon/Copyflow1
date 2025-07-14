'use client'

import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

// RTL languages
export const RTL_LANGUAGES = ['ar']

interface LanguageProviderProps {
  children: React.ReactNode
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation()

  // Update document direction when language changes
  useEffect(() => {
    const updateDocumentDirection = (language: string) => {
      const isRTL = RTL_LANGUAGES.includes(language)
      const direction = isRTL ? 'rtl' : 'ltr'
      
      document.documentElement.dir = direction
      document.documentElement.lang = language
      
      // Update body classes
      document.body.classList.remove('rtl', 'ltr')
      document.body.classList.add(direction)
    }

    // Set initial direction
    updateDocumentDirection(i18n.language)

    // Listen for language changes
    const handleLanguageChanged = (lng: string) => {
      updateDocumentDirection(lng)
    }

    i18n.on('languageChanged', handleLanguageChanged)
    
    return () => {
      i18n.off('languageChanged', handleLanguageChanged)
    }
  }, [i18n])

  return <>{children}</>
}

export default LanguageProvider