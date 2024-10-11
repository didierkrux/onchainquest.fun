import { Box, Heading, Text, Image, CardBody, Card } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import LanguageSwitch from 'components/LanguageSwitch'
import { Event, EventData } from 'entities/data'

export default function Agenda() {
  const { t, i18n } = useTranslation()
  const [event, setEvent] = useState<Event | null>(null)
  const [eventData, setEventData] = useState<EventData | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      // TODO: check why api is called twice
      console.log('fetching event data')
      try {
        const response = await fetch('/api/data')
        const data = await response.json()
        setEventData(data)
      } catch (error) {
        console.error('Error fetching event data:', error)
      }
    }

    if (!eventData) {
      fetchData()
    }
  }, [i18n.language, eventData])

  useEffect(() => {
    if (i18n.language && eventData) {
      console.log('setting event data')
      setEvent(i18n.language === 'en' ? eventData.data_en : eventData.data_tr)
    }
  }, [i18n.language, eventData])

  if (!event) {
    return <Box>Loading...</Box>
  }

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
