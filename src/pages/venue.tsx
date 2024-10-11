import { Box, Card, CardBody, Heading, Image, Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Event, EventData } from 'entities/data'

export default function Venue() {
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
      <Heading as="h1">{t('Venue map')}</Heading>
      {event?.venue?.length > 0 && event?.venue[0]?.image && <Image src={event.venue[0].image} />}
      <Heading as="h1" mt={4}>
        {t('Booths')}
      </Heading>
      {event.booths.map((booth, index) => (
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
