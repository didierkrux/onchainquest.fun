import React, { useEffect } from 'react'
import { Box, useMediaQuery, Spinner, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'

import Menu from 'components/Menu'
import { useEventData } from 'hooks/useEventData'
import { useLocalStorage } from 'usehooks-ts'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t } = useTranslation()
  const [isMobile] = useMediaQuery('(max-width: 48em)')
  const { event, isLoading, error } = useEventData()
  const [pwa, setPwa] = useLocalStorage('pwa', false)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('pwa=true')) {
      setPwa(true)
    }
  }, [setPwa])

  return (
    <Box>
      <header>
        <Menu />
      </header>
      <main>
        <Box
          p="4"
          maxW="container.lg"
          mx="auto"
          mb={isMobile ? `calc(60px + ${pwa ? '16px' : '0px'})` : 0}
        >
          {isLoading ? (
            <Box textAlign="center" py={10}>
              <Spinner size="xl" />
              <Text mt={4}>{t('Loading event data...')}</Text>
            </Box>
          ) : error ? (
            <Box textAlign="center" py={10}>
              <Text color="red.500">
                {t('Error: ')} {error.message}
              </Text>
            </Box>
          ) : event === null ? (
            <Box textAlign="center" py={10}>
              <Text>{t('No event data available.')}</Text>
            </Box>
          ) : (
            React.Children.map(children, (child) => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child as React.ReactElement<any>, { event })
              }
              return child
            })
          )}
        </Box>
      </main>
    </Box>
  )
}

export default Layout
