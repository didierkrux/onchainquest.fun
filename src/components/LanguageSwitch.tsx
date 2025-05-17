import React, { useState, useEffect } from 'react'
import { Box } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import SelectTab from './SelectTab'

export type LanguageType = 'en' | 'th'
export type LanguageDescriptionType = { [Key in LanguageType as string]?: string }
export const LanguageDescription: LanguageDescriptionType = Object.fromEntries(
  Object.entries({
    en: 'English',
    th: 'ไทย',
  }).sort((a, b) => a[1].localeCompare(b[1]))
)

const LanguageSwitch = ({ eventLanguage }: { eventLanguage: string[] }): React.ReactElement => {
  const { i18n } = useTranslation()
  const languages = Object.keys(LanguageDescription).filter((lang): lang is LanguageType =>
    eventLanguage?.includes(lang)
  )
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  useEffect(() => {
    const currentIndex = languages.findIndex((lang) => i18n.language?.startsWith(lang))
    setSelectedIndex(currentIndex >= 0 ? currentIndex : 0)
  }, [i18n.language, languages])

  const handleTabChange = (index: number) => {
    const newLanguage = languages[index]
    i18n.changeLanguage(newLanguage)
  }

  if (selectedIndex === null) return <></>

  return (
    <Box>
      <SelectTab
        colorScheme="purple"
        tabLabels={languages.map((lang) => LanguageDescription[lang] || lang)}
        selectedIndex={selectedIndex}
        onTabChange={handleTabChange}
      />
    </Box>
  )
}

export default LanguageSwitch
