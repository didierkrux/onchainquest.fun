import { Box, Heading, Text } from '@chakra-ui/react'

export default function Leaderboard() {
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
  ]

  return (
    <Box>
      <Heading as="h1">Leaderboard</Heading>
      <Box mt={4}>
        {LEADERBOARD.map((user, index) => (
          <Box
            key={user.username}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            m={4}
          >
            <Text>
              #{index + 1} @{user.username}
            </Text>
            <Text>Points: {user.points}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
