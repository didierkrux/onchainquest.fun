import { Box, Heading, Text, Image, CardBody, Card } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'

import LanguageSwitch from 'components/LanguageSwitch'
import { Event } from 'entities/data'

export default function Agenda({ event }: { event: Event }) {
  const { t } = useTranslation()

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={4}>
        <Text>Select language:</Text>
        <LanguageSwitch />
      </Box>
      <Heading as="h1">{t('Agenda')}</Heading>
      {event.agenda.map((item, index) => (
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
      {event.sponsors.map((sponsor, index) => (
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
