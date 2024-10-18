import { Box, Heading, Text, Image, CardBody, Card, Button, useToast } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/router'
import LanguageSwitch from 'components/LanguageSwitch'
import { Event } from 'entities/data'
import { useEffect } from 'react'
import { useLocalStorage } from 'usehooks-ts'

export default function Agenda({ event }: { event: Event }) {
  const { t } = useTranslation()
  const router = useRouter()
  const [, setPwa] = useLocalStorage('pwa', false)

  useEffect(() => {
    if (router.query?.pwa) {
      setPwa(true)
    }
  }, [router.query?.pwa])

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={4} mb={4}>
        <Text>Select language:</Text>
        <LanguageSwitch />
      </Box>
      <Heading as="h1">{t('Agenda')}</Heading>
      {event.agenda.map((item, index) => (
        <Card mt={4} key={index}>
          <CardBody display="flex" justifyContent="space-between" alignItems="center" gap={4}>
            <Box>
              <Text as="h2" fontWeight="bold">
                {item.time}
              </Text>
              <Text as="h3">{item.title}</Text>
              <Text as="h3" mb={4}>
                📍 {item.location}
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
              <Text as="h3" mb={4} fontWeight="bold">
                {booth.name}
              </Text>
              <Text as="h3" mb={4}>
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
