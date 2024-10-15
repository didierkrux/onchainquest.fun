import React from 'react'
import { Box, Button } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
// import { useRouter } from 'next/router'
import styled from '@emotion/styled'

export type LanguageType = 'en' | 'th'
export type LanguageDescriptionType = { [Key in LanguageType as string]?: string }
export const LanguageDescription: LanguageDescriptionType = Object.fromEntries(
  Object.entries({
    en: 'English',
    th: 'ไทย',
  }).sort((a, b) => a[1].localeCompare(b[1]))
)

const StyledButton = styled(Button)<{ isselected?: string }>`
  padding: 16px;
  //width: 60px;
  /* height: 56px; */
  border-radius: 12px;
  padding: 10px 16px !important;
  :hover {
    background: #3f3253;
    border: 0;
    padding: 10px 16px !important;
  }
  ${(props) =>
    props.isselected === 'true' &&
    `
    background: linear-gradient(132deg, #67407E 0%, #354374 100%);
    border: 1px solid #B85FF1 !important;
    padding: 10px 16px !important;
    :hover {
      background: linear-gradient(132deg, #67407E 0%, #354374 100%);
      border: 1px solid #B85FF1 !important;
      padding: 10px 16px !important;
    }
  `}
`

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
                variant={i18n.language === l ? 'solid' : 'outline'}
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
