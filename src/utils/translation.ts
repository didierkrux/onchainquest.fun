import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// EN = English
import common from 'translation/en/common.json'
// TH = Thai
import commonTH from 'translation/th/common.json'

export const defaultNS = 'common'

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: false,
    resources: {
      en: {
        common,
      },
      th: {
        common: commonTH,
      },
    },
    defaultNS,
  })
