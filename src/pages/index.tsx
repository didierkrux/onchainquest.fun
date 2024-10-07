import { Box, Heading, Text, Image, CardBody, Card } from '@chakra-ui/react'
import LanguageSwitch from 'components/LanguageSwitch'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import data_en from 'translation/en/data.json'
import data_th from 'translation/th/data.json'

export default function Agenda() {
  const { t, i18n } = useTranslation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const data = mounted ? (i18n.language === 'en' ? data_en : data_th) : { agenda: [], sponsors: [] }

  const AGENDA = data.agenda || []
  const SPONSORS = data.sponsors || []

  if (!mounted) {
    return null // Return null or a loading indicator while not mounted
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={4}>
        <Text>Select language:</Text>
        <LanguageSwitch />
      </Box>
      <Heading as="h1">{t('Agenda')}</Heading>
      {AGENDA.map((item, index) => (
        <Card mt={4} key={index}>
          <CardBody display="flex" justifyContent="space-between" alignItems="center" gap={4}>
            <Box>
              <Text as="h2" fontWeight="bold">
                {item.time}
              </Text>
              <Text as="h3">{item.title}</Text>
              <Text as="h3" mb={4}>
                📍 {item.location}
              </Text>
            </Box>
          </CardBody>
        </Card>
      ))}
      <Heading as="h1" mt={4}>
        {t('Sponsors')}
      </Heading>
      {SPONSORS.map((sponsor, index) => (
        <Card mt={4} key={index}>
          <CardBody display="flex" justifyContent="space-between" alignItems="center" gap={4}>
            <Box>
              <a href={sponsor.link}>
                <Image h="60px" src={sponsor.image} alt={sponsor.name} />
              </a>
              <Text as="h3">{sponsor.description}</Text>
            </Box>
          </CardBody>
        </Card>
      ))}
    </Box>
  )
}
