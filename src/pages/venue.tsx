import { Box, Card, CardBody, Heading, Image, Text } from '@chakra-ui/react'

export default function Venue() {
  const BOOTH_INFO = [
    {
      name: 'BOOTH #1',
      description: '...',
    },
    {
      name: 'BOOTH #2',
      description: '...',
    },
    {
      name: 'BOOTH #3',
      description: '...',
    },
    {
      name: 'BOOTH #4',
      description: '...',
    },
    {
      name: 'BOOTH #5',
      description: '...',
    },
    {
      name: 'BOOTH #6',
      description: '...',
    },
    {
      name: 'BOOTH #7',
      description: '...',
    },
  ]
  return (
    <Box>
      <Heading as="h1">Venue map</Heading>
      <Image src="https://app.devcon.org/_ipx/w_3840,q_75/%2F_next%2Fstatic%2Fmedia%2FFloor3.f2b8d17f.png?url=%2F_next%2Fstatic%2Fmedia%2FFloor3.f2b8d17f.png&w=3840&q=75" />
      <Heading as="h1" mt={4}>
        Booths
      </Heading>
      {BOOTH_INFO.map((booth, index) => (
        <Card mt={4} key={index}>
          <CardBody display="flex" justifyContent="space-between" alignItems="center" gap={4}>
            <Box>
              <Text as="h3" mb={4}>
                {booth.name}: {booth.description}
              </Text>
            </Box>
          </CardBody>
        </Card>
      ))}
    </Box>
  )
}
