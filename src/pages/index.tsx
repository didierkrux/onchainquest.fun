import { Box, Heading, Text, Image, CardBody, Card } from '@chakra-ui/react'

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

  const SPONSORS = [
    {
      name: 'Harpie',
      description:
        'The most advanced wallet security tool to protect your crypto from hacks and scams. Harpie monitors for risks, blocks detected threats, and recovers your stolen assets—all in real time.',
      image: 'https://harpie.io/images/icons/harpie/Harpie-Aeonik-Logo.svg',
      link: 'https://harpie.io',
    },
    {
      name: 'Bankless Academy',
      description:
        'Free courses to kickstart your Web3 journey. Learn the essentials of Bitcoin, Ethereum, Blockchain, Layer 2s, setting up your first wallet, and more.',
      image: 'https://app.banklessacademy.com/images/BanklessAcademy.svg',
      link: 'https://app.banklessacademy.com',
    },
  ]

  return (
    <Box>
      <Heading as="h1">Agenda</Heading>
      {AGENDA.map((item, index) => (
        <Card mt={4} key={index}>
          <CardBody display="flex" justifyContent="space-between" alignItems="center" gap={4}>
            <Box>
              <Text as="h2" fontWeight="bold">
                {item.time}
              </Text>
              <Text as="h3">{item.title}</Text>
              <Text as="h3" mb={4}>
                📍 TBD
              </Text>
            </Box>
          </CardBody>
        </Card>
      ))}
      <Heading as="h1" mt={4}>
        Sponsors
      </Heading>
      {SPONSORS.map((sponsor, index) => (
        <Card mt={4} key={index}>
          <CardBody display="flex" justifyContent="space-between" alignItems="center" gap={4}>
            <Box>
              <a href={sponsor.link}>
                <Image h="60px" src={sponsor.image} />
              </a>
              {/* <Text as="h3">{sponsor.name}</Text> */}
              <Text as="h3">{sponsor.description}</Text>
            </Box>
          </CardBody>
        </Card>
      ))}
    </Box>
  )
}
