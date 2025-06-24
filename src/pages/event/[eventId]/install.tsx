import { Box, Heading, Text, Button } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import InstallPWA from 'components/InstallPWA'
import { useTranslation } from 'react-i18next'
import { useLocalStorage } from 'usehooks-ts'
import { Info } from '@phosphor-icons/react'
import { isAndroid, isIOS } from 'react-device-detect'

export default function InstallPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { eventId } = router.query
  const [, setShowInstallPWA] = useLocalStorage('showInstallPWA', false)
  const [pwa] = useLocalStorage<boolean | null>('pwa', null)

  if (!eventId) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" p={8}>
        <Heading>Loading...</Heading>
      </Box>
    )
  }

  return (
    <Box display="flex" flexDirection="column" alignItems="center" p={8}>
      <Heading as="h1" mb={4}>
        {t('Install App')}
      </Heading>
      <Text mb={6} textAlign="center" color="gray.600">
        {t('Install this app for a better experience at the event')}
      </Text>

      {(isAndroid || isIOS) && pwa === false && (
        <Button leftIcon={<Info size={22} />} onClick={() => setShowInstallPWA(true)}>
          Install
        </Button>
      )}
    </Box>
  )
}
