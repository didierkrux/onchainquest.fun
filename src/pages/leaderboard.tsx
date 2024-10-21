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
  useMediaQuery,
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
  const [isMobile] = useMediaQuery('(max-width: 48em)')
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

  const renderLeaderboardList = (users: Profile[], isMobile: boolean, displayRole: boolean) => (
    <Stack divider={<StackDivider />} spacing="4">
      {users.map((user, index) => (
        <Box
          key={index}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          m={isMobile ? 0 : 4}
          flexWrap="nowrap"
        >
          <Box display="flex" alignItems="center" gap={2} flex="1" minWidth="0">
            <Box>
              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
            </Box>
            <Avatar src={profileAvatar(user)} w="30px" />
            <Text isTruncated>{profileName(user)}</Text>
            {displayRole && <Text>{profileRole(user)}</Text>}
          </Box>
          <Box flexShrink={0} ml={2}>
            <Text whiteSpace="nowrap">{user.score} ⭐️</Text>
          </Box>
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
          <Tabs defaultIndex={1} mt={4}>
            <TabList>
              <Tab>{t('All')}</Tab>
              <Tab>{t('Learners')} 🧑‍🎓</Tab>
              <Tab>{t('Mentors')} 🧑‍🏫</Tab>
            </TabList>
            <TabPanels>
              <TabPanel p={0}>
                <Card borderTopRadius={0}>
                  <CardBody>{renderLeaderboardList(leaderboard, isMobile, true)}</CardBody>
                </Card>
              </TabPanel>
              <TabPanel p={0}>
                <Card borderTopRadius={0}>
                  <CardBody>
                    {renderLeaderboardList(filterByRole('learner'), isMobile, false)}
                  </CardBody>
                </Card>
              </TabPanel>
              <TabPanel p={0}>
                <Card borderTopRadius={0}>
                  <CardBody>
                    {renderLeaderboardList(filterByRole('mentor'), isMobile, false)}
                  </CardBody>
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
