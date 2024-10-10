import { Box, Card, CardBody, Heading, Stack, StackDivider, Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import data_en from 'translation/en/data.json'
import data_th from 'translation/th/data.json'

export default function Leaderboard() {
  const { t, i18n } = useTranslation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const data = mounted ? (i18n.language === 'en' ? data_en : data_th) : { prizes: [] }

  if (!mounted) {
    return null
  }
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

  const PRIZES = data.prizes || []

  if (!mounted) {
    return null
  }

  return (
    <Box>
      <Heading as="h1">{t('Prizes')}</Heading>
      <Box>
        {PRIZES.map((prize, index) => (
          <Card mt={4} key={index}>
            <CardBody display="flex" justifyContent="space-between" alignItems="center" gap={4}>
              <Box>
                <Text as="h3">{prize.description}</Text>
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
