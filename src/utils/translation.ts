import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// EN = English
import common from 'translation/en/common.json'
import data_en from 'translation/en/data.json'
// TH = Thai
import commonTH from 'translation/th/common.json'
import data_th from 'translation/th/data.json'

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
        data: data_en,
      },
      th: {
        common: commonTH,
        data: data_th,
      },
    },
    defaultNS,
  })
