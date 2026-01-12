"use client"

import React, { createContext, useContext, useMemo, useState } from 'react'

// Import synchronously to avoid webpack issues
import en from '@/locales/en.json'
import fr from '@/locales/fr.json'
import de from '@/locales/de.json'
import es from '@/locales/es.json'

const messages: Record<string, any> = { en, fr, de, es }

type I18nContextValue = {
  locale: string
  setLocale: (l: string) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined)

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [locale, setLocale] = useState<string>('en')

  const value = useMemo(() => ({
    locale,
    setLocale,
    t: (key: string) => {
      const parts = key.split('.')
      let cur: any = messages[locale] || messages['en']
      for (const p of parts) {
        if (!cur) return key
        cur = cur[p]
      }
      return typeof cur === 'string' ? cur : key
    }
  }), [locale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export const useI18n = () => {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

export const useT = () => {
  const { t } = useI18n()
  return t
}

export default I18nProvider
