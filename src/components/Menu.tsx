import { Box, Flex, Image, useMediaQuery } from '@chakra-ui/react'
import NextLink from 'next/link'
import { useAccount } from 'wagmi'
import { CalendarCheck, ListChecks, MapTrifold, Ranking, Plugs } from '@phosphor-icons/react'
import { useRouter } from 'next/router'
import { useAppKit } from '@reown/appkit/react'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import styled from '@emotion/styled'

import { MENU } from 'config'
import { useLocalStorage } from 'usehooks-ts'

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
  const [isMobile] = useMediaQuery('(max-width: 48em)')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
      cursor={isActive ? 'default' : 'pointer'}
    >
      {children}
      <Box fontSize={['10px', '16px']}>{mounted ? label : ''}</Box>
    </Box>
  )
}

const Menu = () => {
  const { t } = useTranslation()
  const [isMobile] = useMediaQuery('(max-width: 48em)')
  const { address, isConnected } = useAccount()
  const { open } = useAppKit()
  const [pwa] = useLocalStorage('pwa', false)

  const { pathname } = useRouter()

  const MENU_ITEMS = [
    {
      label: t(MENU[0].label),
      icon: CalendarCheck,
      href: MENU[0].href,
    },
    {
      label: t(MENU[1].label),
      icon: MapTrifold,
      href: MENU[1].href,
    },
    {
      label: t(MENU[2].label),
      icon: ListChecks,
      href: MENU[2].href,
    },
    {
      label: t(MENU[3].label),
      icon: Ranking,
      href: MENU[3].href,
    },
  ]

  const isProfileActive = pathname === MENU[4].href

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
      pb={isMobile && pwa ? '16px' : '0'}
    >
      <NoHoverDecoration>
        <Flex justify="space-around" align="center" h="60px" maxW="container.md" mx="auto">
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
          <Box w="100%" h="100%" display="flex" justifyContent="center" alignItems="center">
            <NextLink href={MENU[4].href} style={{ width: '100%', height: '100%' }}>
              <MenuItem
                label={isConnected ? t(MENU[4].label) : t('Connect')}
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
                    border={isProfileActive ? '1px solid orange' : '1px solid white'}
                  />
                ) : (
                  <Plugs size={24} />
                )}
              </MenuItem>
            </NextLink>
          </Box>
        </Flex>
      </NoHoverDecoration>
    </Box>
  )
}

export default Menu
