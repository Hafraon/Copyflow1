import React from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SUPPORTED_LANGUAGES, RTL_LANGUAGES } from '@/i18n'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface LanguageSwitcherProps {
  variant?: 'default' | 'compact' | 'icon-only'
  className?: string
  showFlag?: boolean
  showNativeName?: boolean
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'default',
  className,
  showFlag = true,
  showNativeName = true
}) => {
  const { i18n, t } = useTranslation('common')
  const [isOpen, setIsOpen] = useState(false)
  
  const currentLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === i18n.language) || SUPPORTED_LANGUAGES[0]
  const isRTL = RTL_LANGUAGES.includes(i18n.language)

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await i18n.changeLanguage(languageCode)
      setIsOpen(false)
      
      // Store preference
      localStorage.setItem('copyflow-language', languageCode)
      
      // Analytics tracking (optional)
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'language_change', {
          language: languageCode,
          previous_language: currentLanguage.code
        })
      }
    } catch (error) {
      console.error('Failed to change language:', error)
    }
  }

  // Icon-only variant
  if (variant === 'icon-only') {
    return (
      <div className={cn('relative', className)}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="h-8 w-8 p-0"
          aria-label={t('settings.selectLanguage')}
        >
          <Globe className="h-4 w-4" />
        </Button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <Card className="absolute top-full right-0 mt-2 z-50 w-64 shadow-lg">
              <CardContent className="p-2">
                <div className="space-y-1">
                  {SUPPORTED_LANGUAGES.map((language) => (
                    <button
                      key={language.code}
                      onClick={() => handleLanguageChange(language.code)}
                      className={cn(
                        'w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-md transition-colors hover:bg-muted',
                        language.code === currentLanguage.code && 'bg-primary/10 text-primary'
                      )}
                    >
                      <span className="text-lg">{language.flag}</span>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{language.name}</div>
                        <div className="text-xs text-muted-foreground">{language.nativeName}</div>
                      </div>
                      {language.code === currentLanguage.code && (
                        <Check className="h-4 w-4" />
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    )
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={cn('relative', className)}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="h-8 px-2 gap-1"
        >
          {showFlag && <span className="text-sm">{currentLanguage.flag}</span>}
          <span className="text-xs font-medium">{currentLanguage.code.toUpperCase()}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            <Card className="absolute top-full right-0 mt-1 z-50 w-48 shadow-lg">
              <CardContent className="p-1">
                <div className="space-y-0.5">
                  {SUPPORTED_LANGUAGES.map((language) => (
                    <button
                      key={language.code}
                      onClick={() => handleLanguageChange(language.code)}
                      className={cn(
                        'w-full flex items-center space-x-2 px-2 py-1.5 text-sm rounded transition-colors hover:bg-muted',
                        language.code === currentLanguage.code && 'bg-primary/10 text-primary'
                      )}
                    >
                      <span>{language.flag}</span>
                      <span className="flex-1 text-left">{language.name}</span>
                      {language.code === currentLanguage.code && (
                        <Check className="h-3 w-3" />
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    )
  }

  // Default variant
  return (
    <div className={cn('relative', className)}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'justify-between min-w-[200px]',
          isRTL && 'flex-row-reverse'
        )}
      >
        <div className={cn(
          'flex items-center space-x-2',
          isRTL && 'space-x-reverse'
        )}>
          <Globe className="h-4 w-4" />
          <div className="flex items-center space-x-2">
            {showFlag && <span>{currentLanguage.flag}</span>}
            <span>{showNativeName ? currentLanguage.nativeName : currentLanguage.name}</span>
          </div>
        </div>
        <ChevronDown className="h-4 w-4" />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <Card className={cn(
            'absolute top-full mt-2 z-50 w-full shadow-lg',
            isRTL ? 'left-0' : 'right-0'
          )}>
            <CardContent className="p-2">
              <div className="space-y-1">
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">
                  {t('settings.selectLanguage')}
                </div>
                
                {SUPPORTED_LANGUAGES.map((language) => {
                  const isSelected = language.code === currentLanguage.code
                  const isRTLLang = RTL_LANGUAGES.includes(language.code)
                  
                  return (
                    <button
                      key={language.code}
                      onClick={() => handleLanguageChange(language.code)}
                      className={cn(
                        'w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-md transition-colors hover:bg-muted',
                        isSelected && 'bg-primary/10 text-primary',
                        isRTLLang && 'flex-row-reverse space-x-reverse'
                      )}
                      dir={isRTLLang ? 'rtl' : 'ltr'}
                    >
                      <span className="text-lg">{language.flag}</span>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{language.name}</div>
                        {showNativeName && language.name !== language.nativeName && (
                          <div className="text-xs text-muted-foreground">{language.nativeName}</div>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4" />
                      )}
                      {isRTLLang && (
                        <span className="text-xs text-muted-foreground">RTL</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

// Hook for language utilities
export const useLanguage = () => {
  const { i18n } = useTranslation()
  
  return {
    currentLanguage: i18n.language,
    isRTL: RTL_LANGUAGES.includes(i18n.language),
    changeLanguage: (code: string) => i18n.changeLanguage(code),
    supportedLanguages: SUPPORTED_LANGUAGES,
    getCurrentLanguageInfo: () => SUPPORTED_LANGUAGES.find(lang => lang.code === i18n.language)
  }
}