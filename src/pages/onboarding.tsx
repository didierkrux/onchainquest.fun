import { Box, Card, CardBody, Heading, Text, Link, Button } from '@chakra-ui/react'
import { useAppKit } from '@reown/appkit/react'
import { useAccount } from 'wagmi'
import { useTranslation } from 'react-i18next'
export default function Onboarding() {
  const { t } = useTranslation()
  const { open } = useAppKit()
  const { address } = useAccount()

  const QUESTS = [
    {
      title: 'Create a crypto wallet & connect it to this app',
      instructions: (
        <>
          <Link isExternal href="https://app.banklessacademy.com/lessons/creating-a-crypto-wallet">
            How to create a crypto wallet
          </Link>
        </>
      ),
      points: 5,
      isCompleted: true,
    },
    {
      title: 'Setup your profile',
      instructions: (
        <>
          - go to your <Link href="/profile">profile</Link>
          <br />- select your username (ENS name)
          <br />- select your avatar
        </>
      ),
      points: 5,
      isCompleted: true,
    },
    {
      title: 'Claim the event POAP (Proof of Attendance Protocol)',
      instructions: <>📍 Location: Booth #XX</>,
      points: 5,
      isCompleted: true,
    },
    {
      title: 'Join the private Line or Telegram group for this event',
      instructions: (
        <>
          -{' '}
          <Link href="/" isExternal>
            Line invite link
          </Link>
          <br />-{' '}
          <Link href="/" isExternal>
            Telegram invite link
          </Link>
        </>
      ),
      points: 5,
      isCompleted: true,
    },
    {
      title: 'Protect your wallet with Harpie',
      instructions: (
        <>
          Go to{' '}
          <Link isExternal href="https://harpie.io/">
            Harpie
          </Link>{' '}
          and connect your wallet...
        </>
      ),
      points: 5,
      isCompleted: true,
    },
    {
      title: 'Claim 1$ worth of ETH and USDC on Base',
      instructions: (
        <>
          <Button
            onClick={() => {
              alert('TODO: Claiming...')
            }}
          >
            Claim
          </Button>
          {` (requires the event POAP)`}
        </>
      ),
      points: 5,
      isCompleted: true,
    },
    {
      title: 'Swap 1$ worth of USDC to ETH on Base',
      instructions: (
        <>
          <Button
            onClick={() => {
              open({ view: 'Account' })
            }}
          >
            Swap
          </Button>
          {` (requires owning ETH on Base)`}
        </>
      ),
      points: 5,
      isCompleted: false,
    },
    {
      title: 'Revoke your USDC token permission',
      instructions: (
        <>
          Go to{' '}
          <Link isExternal href={`https://harpie.io/app/dashboard/${address}/?chainId=8453`}>
            Harpie
          </Link>{' '}
          and revoke the permission for USDC
        </>
      ),
      points: 5,
      isCompleted: false,
    },
    {
      title: 'Share your event pictures.',
      instructions: (
        <>
          Go to the{' '}
          <Link isExternal href="https://moments.poap.xyz/upload?drop=178066">
            POAP event page
          </Link>
          <br />- Connect your wallet
          <br />- Share your event pictures
        </>
      ),
      points: '5 x number of pictures shared',
      isCompleted: false,
    },
    {
      title: 'Attest people you meet by scanning their qrcode',
      instructions: (
        <>
          <Button
            onClick={() => {
              alert(`TODO: show QR code and attest me`)
            }}
          >
            Attest Me
          </Button>
          <Button
            onClick={() => {
              alert(`TODO: enter someone's username and attest them`)
            }}
            ml={4}
          >
            Attest Someone
          </Button>
        </>
      ),
      points: '5 x number of people attested',
      isCompleted: false,
    },
  ]
  return (
    <Box>
      <Heading as="h1">{t('Onboarding tasks')}</Heading>
      {QUESTS.map((quest, index) => (
        <Card mt={4} key={index}>
          <CardBody display="flex" justifyContent="space-between" alignItems="center" gap={4}>
            <Box>
              <Heading size="md">
                {index + 1}. {quest.title}
              </Heading>
              <Text pt="2">Points: {quest.points} ⭐️</Text>
              <Box pt="2">
                <Box>👉 {t('Instructions')}:</Box>
                {quest.instructions}
              </Box>
            </Box>
            <Box>{quest.isCompleted ? '✅' : '❌'}</Box>
          </CardBody>
        </Card>
      ))}
    </Box>
  )
}
