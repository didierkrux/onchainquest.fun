import { Box, Card, CardBody, Heading, Stack, StackDivider, Text, Image } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { useLocalStorage } from 'usehooks-ts'

import { Event } from 'entities/data'
import { Profile } from 'entities/profile'
import { profileAvatar, profileName, profileRole } from 'utils/index'

export default function Leaderboard({ event }: { event: Event }) {
  const { t } = useTranslation()
  const [leaderboard, setLeaderboard] = useLocalStorage<Profile[] | null>('leaderboard', null)

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((res) => res.json())
      .then((data) => setLeaderboard(data))
      .catch((error) => {
        console.error('Error fetching leaderboard:', error)
      })
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
      {!leaderboard ? (
        <Text>Loading...</Text>
      ) : leaderboard.length > 0 ? (
        <>
          <Heading as="h1" mt={4}>
            {t('Leaderboard')}
          </Heading>
          <Card mt={4}>
            <CardBody>
              <Stack divider={<StackDivider />} spacing="4">
                {leaderboard.map((user, index) => (
                  <Box
                    key={index}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    m={4}
                  >
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box>
                        {index === 0
                          ? '🥇'
                          : index === 1
                          ? '🥈'
                          : index === 2
                          ? '🥉'
                          : `#${index + 1}`}
                      </Box>
                      <Image src={profileAvatar(user)} h="30px" w="30px" borderRadius="full" />
                      <Text>{profileName(user)}</Text>
                      <Text fontSize="24px">{profileRole(user)}</Text>
                    </Box>
                    <Text>{user.score} ⭐️</Text>
                  </Box>
                ))}
              </Stack>
            </CardBody>
          </Card>
        </>
      ) : (
        <Text>No users yet</Text>
      )}
    </Box>
  )
}
