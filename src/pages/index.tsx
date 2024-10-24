import { Box, Heading, Text, Image, CardBody } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'

import LanguageSwitch from 'components/LanguageSwitch'
import { Event } from 'entities/data'
import { Card } from 'components/Card'

export default function Agenda({ event }: { event: Event }) {
  const { t } = useTranslation()

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={4} mb={4}>
        <Text>Select language:</Text>
        <LanguageSwitch />
      </Box>
      <Heading as="h1">{t('Program')}</Heading>
      {event.agenda.map((item, index) => (
        <Card mt={4} key={index} highlight={item.highlight} borderRadius="10px">
          <CardBody
            p={[3, 5]}
            display="flex"
            justifyContent="flex-start"
            alignItems="center"
            gap={4}
          >
            <Box display="flex" flexDirection="column" alignItems="start">
              <Box
                display="flex"
                fontSize="21px"
                fontWeight="bold"
                color="orange"
                flexDirection="column"
                alignItems="start"
              >
                <Text>{item.time?.split(' → ')[0]}</Text>
                <Text whiteSpace="nowrap">→ {item.time?.split(' → ')[1]}</Text>
              </Box>
              <Text fontSize="32px" alignSelf="center" mt="2">
                {item.emoji}
              </Text>
            </Box>
            <Box display="flex" flexDirection="column" alignItems="start" alignSelf="start">
              <Box
                display="flex"
                textTransform="uppercase"
                fontWeight="bold"
                gap={2}
                fontSize="12px"
              >
                <Text bg={item.locationColor} p={2} borderRadius="md">
                  {item.location}
                </Text>
                <Text bg="#FBF5EE" p={2} borderRadius="md">
                  {item.format}
                </Text>
              </Box>
              <Text fontSize="18px" color="purple.500" fontWeight="bold" mt={2}>
                {item.title}
              </Text>
              <Text fontSize="12px" color="orange" fontWeight="bold">
                {item.people}
              </Text>
            </Box>
          </CardBody>
        </Card>
      ))}
      <Heading as="h1" mt={4}>
        {t('Venue map')}
      </Heading>
      {event?.venue?.length > 0 && event?.venue[0]?.image && <Image src={event.venue[0].image} />}
      <Heading as="h1" mt={4}>
        {t('Booths')}
      </Heading>
      {event.booths.map((booth, index) => (
        <Card mt={4} key={index}>
          <CardBody display="flex" justifyContent="space-between" alignItems="center" gap={4}>
            <Box>
              <Text as="h2" fontWeight="bold">
                {booth.name}
              </Text>
              <Text as="h3" mt={4}>
                {booth.description}
              </Text>
            </Box>
          </CardBody>
        </Card>
      ))}
      <Heading as="h1" mt={4}>
        {t('Sponsors')}
      </Heading>
      {event.sponsors.map((sponsor, index) => (
        <Card mt={4} key={index}>
          <CardBody display="flex" justifyContent="space-between" alignItems="center" gap={4}>
            <Box>
              <a href={sponsor.link}>
                <Image h="60px" src={sponsor.image} alt={sponsor.name} />
              </a>
              <Text as="h3" mt={4}>
                {sponsor.description}
              </Text>
            </Box>
          </CardBody>
        </Card>
      ))}
    </Box>
  )
}
