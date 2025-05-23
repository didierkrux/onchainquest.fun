import React, { useEffect } from 'react'
import { Box, useMediaQuery, Spinner, Text, Image } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/router'

import Menu from 'components/Menu'
import { useEventData } from 'hooks/useEventData'
import { useLocalStorage } from 'usehooks-ts'
import InstallPWA from 'components/InstallPWA'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t } = useTranslation()
  const [isMobile] = useMediaQuery('(max-width: 1024px)')
  const { event, isLoading, error } = useEventData()
  const [pwa, setPwa] = useLocalStorage<boolean | null>('pwa', null)
  const [showInstallPWA, setShowInstallPWA] = useLocalStorage('showInstallPWA', false)
  const router = useRouter()
  const { eventId } = router.query

  console.log('eventId', eventId)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('pwa=true')) {
      setPwa(true)
    } else if (typeof window !== 'undefined') {
      setPwa(window.matchMedia('(display-mode: standalone)').matches)
      setShowInstallPWA(true)
    }
  }, [setPwa])

  const isHomepage =
    typeof window !== 'undefined' && window.location.pathname?.split('/').length === 3

  return (
    <Box>
      <header>
        <Menu />
      </header>
      {isHomepage && eventId && (
        <Image
          w="100vw"
          src={isMobile ? `/banner_mobile_${eventId}.jpg` : `/banner_${eventId}.jpg`}
          alt="Banner"
        />
      )}
      <main
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #FBF5EE 28%, #FBE6D5 100%)',
        }}
      >
        <Box
          p="4"
          maxW="container.lg"
          mx="auto"
          mb={isMobile ? `calc(60px + ${pwa ? '16px' : '0px'})` : 0}
        >
          {event !== null ? (
            React.Children.map(children, (child) => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child as React.ReactElement<any>, { event })
              }
              return child
            })
          ) : isLoading ? (
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
          ) : (
            <Box textAlign="center" py={10}>
              <Text>{t('No event data available.')}</Text>
            </Box>
          )}
          {pwa === false && showInstallPWA === true && (
            <InstallPWA onClose={() => setShowInstallPWA(false)} />
          )}
        </Box>
      </main>
    </Box>
  )
}

export default Layout
