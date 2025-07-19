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

import {
  CalendarCheck,
  ListChecks,
  Ranking,
  Plugs,
  InstagramLogo,
  SquaresFour,
  AppWindow,
} from '@phosphor-icons/react'
import { useRouter } from 'next/router'
import { useAppKit, useAppKitState } from '@reown/appkit/react'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import styled from '@emotion/styled'

import { MENU, eventId, PROJECT_WALLET_TYPE } from 'config'
import { useLocalStorage } from 'usehooks-ts'
import { profileAvatar } from 'utils'
import { Profile } from 'entities/profile'
import { Avatar } from 'components/Avatar'
import { useWalletAccount, useWalletModal } from 'hooks/useWallet'

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

  // Use the appropriate hooks based on wallet type
  const { isConnected: privyConnected } = useWalletAccount()
  const { open: openPrivyModal } = useWalletModal()

  // AppKit hooks for WalletConnect
  const { open } = useAppKit()
  const { open: isOpen } = useAppKitState()

  // For now, only use Privy hooks to avoid conditional hook calls
  // TODO: Implement proper dual provider support
  const isConnected = privyConnected

  const [pwa] = useLocalStorage<boolean | null>('pwa', null)
  const { pathname, query } = useRouter()
  const currentEventId = (query.eventId as string) || eventId
  const [profile] = useLocalStorage<Profile | null>(`profile-${currentEventId}`, null)
  const [appDeploymentId, setAppDeploymentId] = useLocalStorage('app-deployment-id', '')
  const [latestDeploymentId, setLatestDeploymentId] = useState(appDeploymentId)

  const MENU_ITEMS = [
    {
      label: t('Event'),
      icon: CalendarCheck,
      href: '/event/[eventId]',
      path: '',
    },
    {
      label: eventId === 3 ? t('Apps') : t('Social'),
      icon: eventId === 3 ? AppWindow : InstagramLogo,
      href: eventId === 3 ? '/event/[eventId]/apps' : '/event/[eventId]/social',
      path: eventId === 3 ? '/apps' : '/social',
    },
    {
      label: eventId === 3 ? t('Quest') : t('Onboarding'),
      icon: ListChecks,
      href: '/event/[eventId]/onboarding',
      path: '/onboarding',
    },
    {
      label: t('Leaderboard'),
      icon: Ranking,
      href: '/event/[eventId]/leaderboard',
      path: '/leaderboard',
    },
  ]

  const isProfileActive = pathname?.split('/')[3] === 'profile'

  // Debug logging
  console.log('🔍 Menu Debug:', {
    PROJECT_WALLET_TYPE,
    privyConnected,
    isConnected,
    isProfileActive,
    isOpen,
  })

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
  }, [])

  const newVersionAvailable =
    latestDeploymentId && latestDeploymentId !== '' && latestDeploymentId !== appDeploymentId

  const handleMenuClick = (href: string) => {
    if (pathname === href) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleWalletOpen = () => {
    console.log('🔍 handleWalletOpen called:', { PROJECT_WALLET_TYPE, isConnected })
    if (PROJECT_WALLET_TYPE === 'privy') {
      console.log('🔍 Opening Privy modal')
      openPrivyModal()
    } else if (PROJECT_WALLET_TYPE === 'walletconnect') {
      console.log('🔍 Opening WalletConnect modal')
      open({ view: 'Connect' })
    }
  }

  return (
    <Box
      as="nav"
      position={isMobile ? 'fixed' : 'static'}
      bottom={isMobile ? 0 : 'auto'}
      left={0}
      right={0}
      bg={'#3D154C'}
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
              bg="#3D154C"
              color="white"
              p={4}
              w="100%"
              h="100%"
            >
              <SquaresFour />
              {t('New app version available!')}
              {' · '}
              <Link onClick={() => window.location.reload()} color="#C06FDB !important">
                {t('Refresh')}
              </Link>
            </Box>
          ) : (
            <>
              {MENU_ITEMS.map((item) => {
                const isActive = pathname?.split('/')[3] === item.path?.split('/')[1]
                return (
                  <Box
                    key={item.href}
                    w="100%"
                    h="100%"
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <NextLink
                      href={item.href}
                      as={`/event/${currentEventId}${item.path}`}
                      style={{ width: '100%', height: '100%' }}
                    >
                      <MenuItem
                        label={item.label}
                        isActive={isActive}
                        onClick={() => handleMenuClick(`/event/${currentEventId}${item.path}`)}
                      >
                        <item.icon size={24} />
                      </MenuItem>
                    </NextLink>
                  </Box>
                )
              })}
              {newVersionAvailable ? null : (
                <Popover isOpen={!isConnected && isProfileActive && !isOpen}>
                  {!isConnected ? (
                    <Box
                      w="100%"
                      h="100%"
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                    >
                      <PopoverTrigger>
                        <Box
                          w="100%"
                          h="100%"
                          display="flex"
                          justifyContent="center"
                          alignItems="center"
                        >
                          <NextLink
                            href={MENU[4].href}
                            as={`/event/${currentEventId}/profile`}
                            style={{ width: '100%', height: '100%' }}
                          >
                            <MenuItem
                              label={isConnected ? t('Profile') : t('Connect')}
                              isActive={isProfileActive}
                              onClick={() => {
                                if (!isConnected) {
                                  handleWalletOpen()
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
                    </Box>
                  ) : (
                    <Box
                      w="100%"
                      h="100%"
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                    >
                      <NextLink
                        href={MENU[4].href}
                        as={`/event/${currentEventId}/profile`}
                        style={{ width: '100%', height: '100%' }}
                      >
                        <MenuItem label={t('Profile')} isActive={isProfileActive}>
                          {profile && (
                            <Box
                              border={isProfileActive ? '1px solid white' : '1px solid #C06FDB'}
                              borderRadius="full"
                            >
                              <Avatar width="24px" src={profileAvatar(profile)} />
                            </Box>
                          )}
                        </MenuItem>
                      </NextLink>
                    </Box>
                  )}
                  <PopoverContent>
                    <PopoverArrow />
                    <PopoverBody>
                      {t('Click here to connect your wallet & access your profile')}
                    </PopoverBody>
                  </PopoverContent>
                </Popover>
              )}
            </>
          )}
        </Flex>
      </NoHoverDecoration>
    </Box>
  )
}

export default Menu
