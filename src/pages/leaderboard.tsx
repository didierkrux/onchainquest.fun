import {
  Box,
  Card,
  CardBody,
  Heading,
  Stack,
  StackDivider,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { useLocalStorage } from 'usehooks-ts'

import { Event } from 'entities/data'
import { Profile } from 'entities/profile'
import { profileAvatar, profileName, profileRole } from 'utils/index'
import { Avatar } from 'components/Avatar'

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

  const filterByRole = (role: string) => {
    return leaderboard?.filter((user) => (user.role || 'learner') === role) || []
  }

  const renderLeaderboardList = (users: Profile[]) => (
    <Stack divider={<StackDivider />} spacing="4">
      {users.map((user, index) => (
        <Box key={index} display="flex" justifyContent="space-between" alignItems="center" m={4}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box>
              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
            </Box>
            <Avatar src={profileAvatar(user)} w="30px" />
            <Text>{profileName(user)}</Text>
            <Text fontSize="24px">{profileRole(user)}</Text>
          </Box>
          <Text>{user.score} ⭐️</Text>
        </Box>
      ))}
    </Stack>
  )

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
        <Box>
          <Heading as="h1" mt={4}>
            {t('Leaderboard')}
          </Heading>
          <Tabs variant="soft-rounded" colorScheme="gray" defaultIndex={1} mt={4}>
            <TabList>
              <Tab>{t('All')}</Tab>
              <Tab>{t('Learners')}</Tab>
              <Tab>{t('Mentors')}</Tab>
            </TabList>
            <TabPanels>
              <TabPanel p={0}>
                <Card mt={4}>
                  <CardBody>{renderLeaderboardList(leaderboard)}</CardBody>
                </Card>
              </TabPanel>
              <TabPanel p={0}>
                <Card mt={4}>
                  <CardBody>{renderLeaderboardList(filterByRole('learner'))}</CardBody>
                </Card>
              </TabPanel>
              <TabPanel p={0}>
                <Card mt={4}>
                  <CardBody>{renderLeaderboardList(filterByRole('mentor'))}</CardBody>
                </Card>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      ) : (
        <Text>No users yet</Text>
      )}
    </Box>
  )
}
