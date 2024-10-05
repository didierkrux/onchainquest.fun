import { Box, Heading } from '@chakra-ui/react'

export default function Leaderboard() {
  return (
    <Box>
      <Heading as="h1">Leaderboard</Heading>
      <Box>
        <h2>#1 @vitalik.eth</h2>
        <h2>#2 @0x1234...</h2>
        <h2>#3 @0x1234...</h2>
      </Box>
    </Box>
  )
}
