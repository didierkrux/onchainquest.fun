import React from 'react'
import { Box, Button } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'

export type LanguageType = 'en' | 'th'
export type LanguageDescriptionType = { [Key in LanguageType as string]?: string }
export const LanguageDescription: LanguageDescriptionType = Object.fromEntries(
  Object.entries({
    en: 'English',
    th: 'ไทย',
  }).sort((a, b) => a[1].localeCompare(b[1]))
)

const LanguageSwitch = (): React.ReactElement => {
  const { i18n } = useTranslation()

  const languages = ['en', 'th']

  return (
    <Box>
      {languages?.length ? (
        <Box textAlign="center">
          <Box display="flex" flexWrap="wrap" justifyContent="center" alignItems="center" m="auto">
            {languages.map((l) => (
              <Button
                variant={i18n.language?.startsWith(l) ? 'solid' : 'outline'}
                key={l}
                onClick={() => {
                  i18n.changeLanguage(l)
                }}
                m={2}
              >
                {l in LanguageDescription ? LanguageDescription[l] : ''}
              </Button>
            ))}
          </Box>
        </Box>
      ) : null}
    </Box>
  )
}

export default LanguageSwitch
