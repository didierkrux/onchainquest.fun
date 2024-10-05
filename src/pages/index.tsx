import { Box, Heading, Text, Image } from '@chakra-ui/react'

export default function Agenda() {
  const AGENDA = [
    {
      time: '12:00 - 13:00',
      title: 'Lunch',
    },
    {
      time: '13:00 - 13:40',
      title: 'Opening Remarks: Welcome to the New Internet',
    },
    {
      time: '13:45 - 14:15',
      title: 'Keynote: Become a web3 explorer TODAY!',
    },
    {
      time: '14:15 - 15:15',
      title: 'Workshop & Breakout Groups',
    },
    {
      time: '15:00 - 18:00',
      title: 'Onchain Fun 🎉',
    },
    {
      time: '18:00 - 20:00',
      title: 'Music & drinks',
    },
  ]

  return (
    <Box>
      <Heading as="h1">Agenda</Heading>
      {AGENDA.map((item) => (
        <Box m={4} key={item.time}>
          <Text as="h2" fontWeight="bold">
            {item.time}
          </Text>
          <Text as="h3">{item.title}</Text>
          <Text as="h3" mb={4}>
            📍 TBD
          </Text>
        </Box>
      ))}
      <Heading as="h1">Sponsors</Heading>
      <Box m={4}>
        <a href="https://harpie.io">
          <Image h="60px" src="https://harpie.io/images/icons/harpie/Harpie-Aeonik-Logo.svg" />
        </a>
        <Text as="h3">
          The most advanced wallet security tool to protect your crypto from hacks and scams. Harpie
          monitors for risks, blocks detected threats, and recovers your stolen assets—all in real
          time.
        </Text>
      </Box>
    </Box>
  )
}
