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
import { useRouter } from 'next/router'
import { Link } from '@chakra-ui/react'

import { Event } from 'entities/data'
import { Profile } from 'entities/profile'
import { profileAvatar, profileName, profileRole } from 'utils/index'
import { Avatar } from 'components/Avatar'
import { Star } from '@phosphor-icons/react'
import { Card as CardComponent } from 'components/Card'

export default function Leaderboard({ event }: { event: Event }) {
  const { t } = useTranslation()
  const [isMobile] = useMediaQuery('(max-width: 1024px)')
  const router = useRouter()
  const { eventId } = router.query
  const [leaderboard, setLeaderboard] = useLocalStorage<Profile[] | null>(
    `leaderboard-${eventId}`,
    null
  )

  useEffect(() => {
    if (!eventId) return

    fetch(`/api/leaderboard?eventId=${eventId}`)
      .then((res) => res.json())
      .then((data) => setLeaderboard(data))
      .catch((error) => {
        console.error('Error fetching leaderboard:', error)
      })
  }, [eventId])

  const filterByRole = (role: string) => {
    return leaderboard?.filter((user) => (user.role || 'explorer') === role) || []
  }

  const renderLeaderboardList = (users: Profile[], isMobile: boolean, displayRole: boolean) => (
    <Stack divider={<StackDivider />} spacing="4">
      {users.map((user, index) => (
        <Link
          key={index}
          href={`/event/${eventId}/profile/${user.address}`}
          _hover={{ textDecoration: 'none' }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            m={isMobile ? 0 : 4}
            flexWrap="nowrap"
            cursor="pointer"
            _hover={{ bg: 'gray.50' }}
            p={2}
            borderRadius="md"
            transition="background-color 0.2s"
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
              <Text whiteSpace="nowrap" display="flex" alignItems="center" color="purple.300">
                <Box mr={1} fontSize="14px">
                  {user.score}
                </Box>
                <Star weight="fill" size={24} />
              </Text>
            </Box>
          </Box>
        </Link>
      ))}
    </Stack>
  )

  return (
    <Box>
      {/* <Heading as="h1">{t('Prizes')}</Heading>
      <Box>
        {event.prizes.map((prize, index) => (
          <CardComponent mt={4} key={index}>
            <CardBody
              p={[3, 5]}
              display="flex"
              justifyContent="flex-start"
              alignItems="center"
              gap={4}
            >
              <Box display="flex" flexDirection="column" alignItems="start">
                <Box fontSize="32px" fontWeight="bold" color="orange.500" m={2}>
                  {index + 1}
                </Box>
              </Box>
              <Box display="flex" flexDirection="column" alignItems="start" alignSelf="start">
                <Box>
                  <Text as="h2" fontWeight="bold">
                    {prize.name}
                  </Text>
                  <Text as="h3" mt={4}>
                    {prize.description}
                  </Text>
                </Box>
              </Box>
            </CardBody>
          </CardComponent>
        ))}
      </Box> */}
      {!leaderboard ? (
        <Text>Loading...</Text>
      ) : leaderboard.length > 0 ? (
        <Box>
          <Heading as="h1">{t('Leaderboard')}</Heading>
          <Tabs defaultIndex={1} mt={4}>
            <TabList>
              <Tab>{t('All')}</Tab>
              <Tab>{t('Explorers')} 🧑‍🎓</Tab>
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
                    {renderLeaderboardList(filterByRole('explorer'), isMobile, false)}
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
