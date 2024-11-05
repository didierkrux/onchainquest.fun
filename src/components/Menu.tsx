import {
  Box,
  Flex,
  useMediaQuery,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
  Link,
} from '@chakra-ui/react'
import NextLink from 'next/link'
import { useAccount } from 'wagmi'
import {
  CalendarCheck,
  ListChecks,
  Ranking,
  Plugs,
  InstagramLogo,
  SquaresFour,
} from '@phosphor-icons/react'
import { useRouter } from 'next/router'
import { useAppKit, useAppKitState } from '@reown/appkit/react'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import styled from '@emotion/styled'

import { MENU } from 'config'
import { useLocalStorage } from 'usehooks-ts'
import { profileAvatar } from 'utils'
import { Profile } from 'entities/profile'
import { Avatar } from 'components/Avatar'
type MenuItemProps = {
  label: string
  isActive: boolean
  children: React.ReactNode
} & React.ComponentPropsWithoutRef<'div'>

export const NoHoverDecoration = styled(Box)`
  a:hover,
  a[data-hover] {
    -webkit-text-decoration: none !important;
    text-decoration: none !important;
  }
`

const MenuItem = ({ label, isActive, children, ...props }: MenuItemProps) => {
  const [isMobile] = useMediaQuery('(max-width: 1024px)')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <Box
      color={isActive ? 'white' : '#C06FDB'}
      _hover={
        !isActive ? (isMobile ? { color: '#C06FDB' } : { color: 'salmon' }) : { color: 'white' }
      }
      {...props}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      w="100%"
      h="100%"
      style={{
        borderBottom: isActive && !isMobile ? '2px solid white' : '2px solid #3D154C',
      }}
    >
      {children}
      <Box fontSize={['10px', '16px']}>{mounted ? label : ''}</Box>
    </Box>
  )
}

const Menu = () => {
  const { t } = useTranslation()
  const [isMobile] = useMediaQuery('(max-width: 1024px)')
  const { isConnected } = useAccount()
  const { open } = useAppKit()
  const { open: isOpen } = useAppKitState()
  const [pwa] = useLocalStorage<boolean | null>('pwa', null)
  const [profile] = useLocalStorage<Profile | null>('profile', null)
  const [appDeploymentId, setAppDeploymentId] = useLocalStorage('app-deployment-id', '')
  const [latestDeploymentId, setLatestDeploymentId] = useState(appDeploymentId)

  const { pathname } = useRouter()

  const MENU_ITEMS = [
    {
      label: t('Event'),
      icon: CalendarCheck,
      href: MENU[0].href,
    },
    {
      label: t('Social'),
      icon: InstagramLogo,
      href: MENU[1].href,
    },
    {
      label: t('Onboarding'),
      icon: ListChecks,
      href: MENU[2].href,
    },
    {
      label: t('Leaderboard'),
      icon: Ranking,
      href: MENU[3].href,
    },
  ]

  const isProfileActive = pathname === MENU[4].href

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

    // Add visibility change listener
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchDeploymentId('interval-load')
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [appDeploymentId])

  const newVersionAvailable =
    latestDeploymentId && latestDeploymentId !== '' && latestDeploymentId !== appDeploymentId

  return (
    <Box
      as="nav"
      position={isMobile ? 'fixed' : 'static'}
      bottom={isMobile ? 0 : 'auto'}
      left={0}
      right={0}
      bg={newVersionAvailable ? 'white.300' : '#3D154C'}
      boxShadow={isMobile ? '0 -1px 2px rgba(0, 0, 0, 0.1)' : 'none'}
      zIndex={10}
      pb={isMobile && pwa ? '16px' : '0'}
    >
      <NoHoverDecoration>
        <Flex justify="space-around" align="center" h="60px" maxW="container.md" mx="auto">
          {newVersionAvailable ? (
            <Box
              display="flex"
              alignItems="center"
              gap={2}
              justifyContent="center"
              bg="white.300"
              color="gray.900"
              p={4}
              w="100%"
              h="100%"
            >
              <SquaresFour />
              {t('New app version available!')}
              {' · '}
              <Link onClick={() => window.location.reload()}>{t('Refresh')}</Link>
            </Box>
          ) : (
            <>
              {MENU_ITEMS.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Box
                    key={item.href}
                    w="100%"
                    h="100%"
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <NextLink href={item.href} style={{ width: '100%', height: '100%' }}>
                      <MenuItem label={item.label} isActive={isActive}>
                        <item.icon size={24} />
                      </MenuItem>
                    </NextLink>
                  </Box>
                )
              })}
            </>
          )}
          {newVersionAvailable ? null : (
            <>
              <Popover isOpen={!isConnected && isProfileActive && !isOpen}>
                <PopoverTrigger>
                  <Box w="100%" h="100%" display="flex" justifyContent="center" alignItems="center">
                    <NextLink href={MENU[4].href} style={{ width: '100%', height: '100%' }}>
                      <MenuItem
                        label={isConnected ? t('Profile') : t('Connect')}
                        isActive={isProfileActive}
                        onClick={() => {
                          if (!isConnected) {
                            open({ view: 'Connect' })
                          }
                        }}
                      >
                        {profile && isConnected ? (
                          <Box
                            border={isProfileActive ? '1px solid white' : '1px solid #C06FDB'}
                            borderRadius="full"
                          >
                            <Avatar width="24px" src={profileAvatar(profile)} />
                          </Box>
                        ) : (
                          <Plugs size={24} />
                        )}
                      </MenuItem>
                    </NextLink>
                  </Box>
                </PopoverTrigger>
                <PopoverContent>
                  <PopoverArrow />
                  <PopoverBody>
                    {t('Click here to connect your wallet & access your profile')}
                  </PopoverBody>
                </PopoverContent>
              </Popover>
            </>
          )}
        </Flex>
      </NoHoverDecoration>
    </Box>
  )
}

export default Menu
