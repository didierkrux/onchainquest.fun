import { Box, Card, CardBody, Heading, Image, Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import data_en from 'translation/en/data.json'
import data_th from 'translation/th/data.json'

export default function Venue() {
  const { t, i18n } = useTranslation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const data = mounted ? (i18n.language === 'en' ? data_en : data_th) : { booths: [], venue: [] }
  const VENUE_MAP = data.venue?.[0]?.image || ''
  const BOOTH_INFO = data.booths || []
  if (!mounted) {
    return null
  }

  return (
    <Box>
      <Heading as="h1">{t('Venue map')}</Heading>
      {VENUE_MAP && <Image src={VENUE_MAP} />}
      <Heading as="h1" mt={4}>
        {t('Booths')}
      </Heading>
      {BOOTH_INFO.map((booth, index) => (
        <Card mt={4} key={index}>
          <CardBody display="flex" justifyContent="space-between" alignItems="center" gap={4}>
            <Box>
              <Text as="h3" mb={4}>
                {booth.name}: {booth.description}
              </Text>
            </Box>
          </CardBody>
        </Card>
      ))}
    </Box>
  )
}
