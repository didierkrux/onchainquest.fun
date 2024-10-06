import { Box, Card, CardBody, Heading, Stack, StackDivider, Text } from '@chakra-ui/react'

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
    {
      username: '...',
      points: 60,
    },
  ]

  const PRICES = [
    {
      description: 'A free 5+ letter ENS domain.',
    },
    {
      description: 'POAP Merchandise.',
    },
    {
      description: '...',
    },
  ]

  return (
    <Box>
      <Heading as="h1">Leaderboard</Heading>
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
      <Heading as="h1" mt={4}>
        Prices
      </Heading>
      {PRICES.map((price, index) => (
        <Card mt={4} key={index}>
          <CardBody display="flex" justifyContent="space-between" alignItems="center" gap={4}>
            <Box>
              <Text as="h3">{price.description}</Text>
            </Box>
          </CardBody>
        </Card>
      ))}
    </Box>
  )
}
