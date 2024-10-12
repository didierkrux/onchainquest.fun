import { Box, Card, CardBody, Heading, Stack, StackDivider, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'

import { Event } from 'entities/data'
import { Profile } from 'entities/profile'

export default function Leaderboard({ event }: { event: Event }) {
  const { t } = useTranslation()

  const [leaderboard, setLeaderboard] = useState<Profile[]>([])

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((res) => res.json())
      .then((data) => setLeaderboard(data))
  }, [])

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
            {leaderboard.map((user, index) => (
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
                <Text>{user.score} ⭐️</Text>
              </Box>
            ))}
          </Stack>
        </CardBody>
      </Card>
    </Box>
  )
}
