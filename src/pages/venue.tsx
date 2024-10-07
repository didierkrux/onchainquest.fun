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

  const data = mounted ? (i18n.language === 'en' ? data_en : data_th) : { booths: [] }
  const BOOTH_INFO = data.booths || []

  if (!mounted) {
    return null
  }

  return (
    <Box>
      <Heading as="h1">{t('Venue map')}</Heading>
      <Image src="https://app.devcon.org/_ipx/w_3840,q_75/%2F_next%2Fstatic%2Fmedia%2FFloor3.f2b8d17f.png?url=%2F_next%2Fstatic%2Fmedia%2FFloor3.f2b8d17f.png&w=3840&q=75" />
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
