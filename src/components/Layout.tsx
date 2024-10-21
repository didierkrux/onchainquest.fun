import React, { useEffect, useState } from 'react'
import { Box, useMediaQuery, Spinner, Text, Link } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { SquaresFour } from '@phosphor-icons/react'

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
  const [appDeploymentId, setAppDeploymentId] = useLocalStorage('app-deployment-id', '')
  const [latestDeploymentId, setLatestDeploymentId] = useState(appDeploymentId)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('pwa=true')) {
      setPwa(true)
    }
  }, [setPwa])

  useEffect(() => {
    const fetchDeploymentId = async (loadType: string) => {
      try {
        const res = await fetch('/api/deployment')
        const data = await res.json()
        const newDeploymentId = data.deploymentId
        if (newDeploymentId && newDeploymentId !== appDeploymentId) {
          // only update the app deployment id on first load
          if (loadType === 'first-load') {
            setAppDeploymentId(newDeploymentId)
          }
          setLatestDeploymentId(newDeploymentId)
        }
      } catch (error) {
        console.error('Failed to fetch deployment ID:', error)
      }
    }

    // call the api to get the deployment id every 1 minute
    const interval = setInterval(() => fetchDeploymentId('interval-load'), 60000)

    // on first load, fetch the deployment id
    fetchDeploymentId('first-load')

    return () => clearInterval(interval)
  }, [appDeploymentId])

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
          {latestDeploymentId &&
            latestDeploymentId !== '' &&
            latestDeploymentId !== appDeploymentId && (
              <Box
                mb={4}
                display="flex"
                alignItems="center"
                gap={2}
                justifyContent="center"
                bg="orange.300"
                color="gray.900"
                p={4}
                borderRadius="md"
              >
                <SquaresFour />
                {t('A new app version available!')}
                {' · '}
                <Link onClick={() => window.location.reload()}>{t('Refresh')}</Link>
              </Box>
            )}
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
