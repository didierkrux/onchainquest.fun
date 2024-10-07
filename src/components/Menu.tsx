import { Box, Flex, Image, useMediaQuery } from '@chakra-ui/react'
import NextLink from 'next/link'
import { useAccount } from 'wagmi'
import {
  CalendarCheck,
  ListChecks,
  MapTrifold,
  Ranking,
  Plugs,
  Translate,
} from '@phosphor-icons/react'
import { useRouter } from 'next/router'
import { useAppKit } from '@reown/appkit/react'
import { useState } from 'react'

type MenuItemProps = {
  label: string
  isActive: boolean
  children: React.ReactNode
} & React.ComponentPropsWithoutRef<'div'>

const MenuItem = ({ label, isActive, children, ...props }: MenuItemProps) => {
  const [isMobile] = useMediaQuery('(max-width: 48em)', { ssr: true })

  return (
    <Box
      color={isActive ? 'orange' : 'white'}
      _hover={!isActive ? { color: 'orange.200' } : { color: 'orange' }}
      {...props}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      w="100%"
      h="100%"
      borderBottom={isActive && !isMobile ? '1px solid orange' : '1px solid black'}
    >
      {children}
      <Box fontSize={['10px', '16px']}>{label}</Box>
    </Box>
  )
}

const Menu = () => {
  const [isMobile] = useMediaQuery('(max-width: 48em)', { ssr: true })
  const { address, isConnected } = useAccount()
  const { open } = useAppKit()

  const { asPath } = useRouter()

  const MENU_ITEMS = [
    {
      label: 'Agenda',
      icon: CalendarCheck,
      href: '/',
    },
    {
      label: 'Venue',
      icon: MapTrifold,
      href: '/venue',
    },
    {
      label: 'Onboarding',
      icon: ListChecks,
      href: '/onboarding',
    },
    {
      label: 'Leaderboard',
      icon: Ranking,
      href: '/leaderboard',
    },
  ]

  const isProfileActive = asPath === '/profile'

  return (
    <Box
      as="nav"
      position={isMobile ? 'fixed' : 'static'}
      bottom={isMobile ? 0 : 'auto'}
      left={0}
      right={0}
      bg="black"
      boxShadow={isMobile ? '0 -1px 2px rgba(0, 0, 0, 0.1)' : 'none'}
      zIndex={10}
    >
      <Flex
        justify="space-around"
        align="center"
        h="60px"
        maxW="container.md"
        mx="auto"
        _hover={{ textDecoration: 'none !important' }}
        textDecoration="center"
      >
        {MENU_ITEMS.map((item) => {
          const isActive = asPath === item.href
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
                style={{ textDecoration: 'none !important', width: '100%', height: '100%' }}
              >
                <MenuItem label={item.label} isActive={isActive}>
                  <item.icon size={24} />
                </MenuItem>
              </NextLink>
            </Box>
          )
        })}
        <Box
          w="100%"
          h="100%"
          display="flex"
          justifyContent="center"
          alignItems="center"
          _hover={{ textDecoration: 'none !important' }}
          textDecoration="center"
        >
          <NextLink
            href="/profile"
            style={{ textDecoration: 'none !important', width: '100%', height: '100%' }}
          >
            <MenuItem
              label={isConnected ? 'Profile' : 'Connect'}
              isActive={isProfileActive}
              onClick={() => {
                if (!isConnected) {
                  open({ view: 'Connect' })
                }
              }}
            >
              {address ? (
                <Image
                  h="24px"
                  borderRadius="full"
                  src={`https://ensdata.net/media/avatar/${address}`}
                  border={isProfileActive ? '1px solid orange' : '1px solid black'}
                />
              ) : (
                <Plugs size={24} />
              )}
            </MenuItem>
          </NextLink>
        </Box>
        {/* TODO: move language to profile page */}
        {/* <Box w="100%" h="100%" display="flex" justifyContent="center" alignItems="center">
          <MenuItem
            label="Language"
            isActive={isLanguageModalOpen}
            onClick={() => {
              setIsLanguageModalOpen(true)
            }}
          >
            <Translate />
          </MenuItem>
        </Box> */}
      </Flex>
    </Box>
  )
}

export default Menu
