import { Box, Heading, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/router'

import { Event } from 'entities/data'

export default function AppsPage({ event }: { event: Event }) {
  const { t } = useTranslation()
  const router = useRouter()
  const { eventId } = router.query

  return (
    <Box>
      <Heading as="h1">{t('Apps')}</Heading>
      <Text mt={4}>TODO: App showcase</Text>
    </Box>
  )
}
