import { Box, Card, CardBody, Heading, Stack, StackDivider, Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Event, EventData } from 'entities/data'

const LEADERBOARD = [
  {
    username: 'ornella',
    points: 100,
  },
  {
    username: 'didier',
    points: 90,
  },
  {
    username: '0x1234...',
    points: 80,
  },
  {
    username: '0x5678...',
    points: 70,
  },
  {
    username: '...',
    points: 60,
  },
]

export default function Leaderboard() {
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
      <Heading as="h1">{t('Prizes')}</Heading>
      <Box>
        {event.prizes.map((prize, index) => (
          <Card mt={4} key={index}>
            <CardBody display="flex" justifyContent="space-between" alignItems="center" gap={4}>
              <Box>
                <Text as="h3">{`${prize.name}: ${prize.description}`}</Text>
              </Box>
            </CardBody>
          </Card>
        ))}
      </Box>
      <Heading as="h1" mt={4}>
        {t('Leaderboard')}
      </Heading>
      <Card mt={4}>
        <CardBody>
          <Stack divider={<StackDivider />} spacing="4">
            {LEADERBOARD.map((user, index) => (
              <Box
                key={user.username}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                m={4}
              >
                <Box display="flex" alignItems="center" gap={2}>
                  <Box>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </Box>
                  <Text>@{user.username}</Text>
                </Box>
                <Text>{user.points} ⭐️</Text>
              </Box>
            ))}
          </Stack>
        </CardBody>
      </Card>
    </Box>
  )
}
