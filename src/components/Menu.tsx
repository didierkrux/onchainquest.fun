import { Box, Button, Flex, Image, useMediaQuery } from '@chakra-ui/react'
import NextLink from 'next/link'
import { useAccount, useEnsName } from 'wagmi'
import { CalendarCheck, ListChecks, MapTrifold, Ranking, UserCircle } from '@phosphor-icons/react'
import { useRouter } from 'next/router'
import { mainnet } from 'wagmi/chains'

const Menu = () => {
  const [isMobile] = useMediaQuery('(max-width: 48em)')
  const { address, isConnected } = useAccount()
  const result = useEnsName({ address, chainId: mainnet.id })
  console.log(result)

  const { asPath } = useRouter()

  const iconSpacing = isMobile ? 0 : '1'

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
      label: 'Quests',
      icon: ListChecks,
      href: '/quests',
    },
    {
      label: 'Leaderboard',
      icon: Ranking,
      href: '/leaderboard',
    },
  ]

  return (
    <Box
      as="nav"
      position={isMobile ? 'fixed' : 'static'}
      bottom={isMobile ? 0 : 'auto'}
      left={0}
      right={0}
      bg="#3c1e1e"
      boxShadow={isMobile ? '0 -1px 2px rgba(0, 0, 0, 0.1)' : 'none'}
    >
      <Flex justify="space-around" align="center" py={3} px={4} maxW="container.lg" mx="auto">
        {MENU_ITEMS.map((item) => {
          console.log(asPath)

          const isActive = asPath === item.href
          return (
            <NextLink key={item.href} href={item.href}>
              <Button isActive={isActive} leftIcon={<item.icon />} iconSpacing={iconSpacing}>
                {!isMobile && item.label}
              </Button>
            </NextLink>
          )
        })}
        {isConnected ? (
          <NextLink href="/profile">
            <Button
              as="a"
              href="/profile"
              leftIcon={
                address ? (
                  <Image
                    h="20px"
                    borderRadius="full"
                    src={`https://ensdata.net/media/avatar/${address}`}
                  />
                ) : (
                  <UserCircle />
                )
              }
              iconSpacing={iconSpacing}
            >
              {!isMobile && 'Profile'}
            </Button>
          </NextLink>
        ) : (
          <w3m-button label="Connect Wallet" />
        )}
        <Button
          variant="solid"
          isActive={false}
          onClick={() => {
            // TODO: implement language toggle
            alert('Language toggle')
          }}
        >
          🇹🇭
        </Button>
      </Flex>
    </Box>
  )
}

export default Menu
