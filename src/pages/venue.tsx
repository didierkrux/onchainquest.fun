import { Box, Heading, Image, Text } from '@chakra-ui/react'

export default function Venue() {
  return (
    <Box>
      <Heading as="h1">Venue</Heading>
      <Image src="https://app.devcon.org/_ipx/w_3840,q_75/%2F_next%2Fstatic%2Fmedia%2FFloor3.f2b8d17f.png?url=%2F_next%2Fstatic%2Fmedia%2FFloor3.f2b8d17f.png&w=3840&q=75" />
      <Text as="h3" mb={4}>
        BOOTH #1: ...
      </Text>
      <Text as="h3" mb={4}>
        BOOTH #2: ...
      </Text>
      <Text as="h3" mb={4}>
        BOOTH #3: ...
      </Text>
      <Text as="h3" mb={4}>
        BOOTH #4: ...
      </Text>
      <Text as="h3" mb={4}>
        BOOTH #5: ...
      </Text>
      <Text as="h3" mb={4}>
        BOOTH #6: ...
      </Text>
      <Text as="h3" mb={4}>
        BOOTH #7: ...
      </Text>
    </Box>
  )
}
