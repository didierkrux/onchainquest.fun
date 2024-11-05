import { Box, Heading, Text, Image, CardBody, Link, Card, Button } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useLocalStorage } from 'usehooks-ts'
import { Info } from '@phosphor-icons/react'
import { isAndroid, isIOS } from 'react-device-detect'

import LanguageSwitch from 'components/LanguageSwitch'
import { Event } from 'entities/data'
import { Card as CardComponent } from 'components/Card'

export default function Event({ event }: { event: Event }) {
  const { t } = useTranslation()
  const [pwa] = useLocalStorage<boolean | null>('pwa', null)
  const [, setShowInstallPWA] = useLocalStorage('showInstallPWA', false)

  const goldSponsors = event.sponsors?.filter((sponsor) => sponsor.sponsorCategory === '1-gold')
  const silverSponsors = event.sponsors?.filter((sponsor) => sponsor.sponsorCategory === '2-silver')
  const bronzeSponsors = event.sponsors?.filter((sponsor) => sponsor.sponsorCategory === '3-bronze')

  return (
    <Box>
      <Box display="flex" justifyContent="center" gap={4}>
        {(isAndroid || isIOS) && pwa === false && (
          <Button leftIcon={<Info size={22} />} onClick={() => setShowInstallPWA(true)}>
            Install
          </Button>
        )}
        <LanguageSwitch />
      </Box>
      <Heading as="h1">{t('Program')}</Heading>
      {event.program?.map((item, index) => (
        <CardComponent mt={4} key={index} type={item.highlight ? 'orange' : 'transparent'}>
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
                fontSize="16px"
                fontWeight="bold"
                color="#FF7614"
                flexDirection="column"
                alignItems="start"
              >
                <Text>{item.time?.split(' → ')[0]}</Text>
                <Text whiteSpace="nowrap">→ {item.time?.split(' → ')[1]}</Text>
              </Box>
              <Text fontSize="28px" alignSelf="center" mt="2">
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
                <Text bg={item.locationColor} p="3px 8px" borderRadius="4px">
                  {item.location}
                </Text>
                <Text color="purple.500" p="3px 8px">
                  {item.format}
                </Text>
              </Box>
              <Text fontSize="19px" color="purple.500" fontWeight="bold" mt={2}>
                {item.title}
              </Text>
              <Text fontSize="12px" color="#FF7614" fontWeight="bold">
                {item.people}
              </Text>
            </Box>
          </CardBody>
        </CardComponent>
      ))}
      <Heading as="h1" mt={4}>
        {t('Venue')}
      </Heading>
      {event?.venue?.length > 0 && event?.venue[0]?.image && <Image src={event.venue[0].image} />}
      <Heading as="h1" mt={4}>
        {t('Booths')}
      </Heading>
      {event.booths?.map((booth, index) => (
        <CardComponent mt={4} key={index}>
          <CardBody p={[3, 5]} gap={4}>
            <Box display="flex" alignItems="center">
              <Box
                display="flex"
                fontSize="42px"
                fontWeight="bold"
                color="orange.500"
                w="54px"
                textAlign="center"
                justifyContent="center"
                alignItems="center"
              >
                {index + 1}
              </Box>
              <Box flex="1">
                <Text as="h2" fontWeight="bold" fontSize="22px" color="purple.600">
                  {booth.name}
                </Text>
              </Box>
            </Box>
            <Box display="flex" flexDirection="column" alignItems="start" alignSelf="start">
              <Box ml="54px">
                <Text as="h3" mt={3} fontFamily="Inter" color="purple.600">
                  {booth.description}
                </Text>
              </Box>
            </Box>
          </CardBody>
        </CardComponent>
      ))}
      <Heading as="h1" mt={4}>
        {t('Sponsors')}
      </Heading>
      <Box display="flex" flexDirection="column" gap={4}>
        <Box mt="10">
          <Text fontWeight="bold" textTransform="uppercase" textAlign="center">
            {t('Powered by')}
          </Text>
          <Box display="flex" flexWrap="wrap" justifyContent="center">
            {goldSponsors?.map((sponsor, index) => (
              <Box key={index} mt="8" width="60%" h="auto">
                <Link isExternal href={sponsor.link} display="contents">
                  <Image src={sponsor.image} alt={sponsor.name} />
                </Link>
              </Box>
            ))}
          </Box>
        </Box>
        <Box mt="10">
          <Text fontWeight="bold" textTransform="uppercase" textAlign="center">
            {t('Supported by')}
          </Text>
          <Box display="flex" flexWrap="wrap">
            {silverSponsors?.map((sponsor, index) => (
              <Box
                key={index}
                mt="8"
                width="50%"
                display="flex"
                justifyContent="center"
                alignItems="center"
              >
                <Link isExternal href={sponsor.link} display="contents">
                  <Image src={sponsor.image} alt={sponsor.name} width="60%" h="auto" />
                </Link>
              </Box>
            ))}
          </Box>
        </Box>
        <Box mt="10">
          <Text fontWeight="bold" textTransform="uppercase" textAlign="center">
            {t('Community partners')}
          </Text>
          <Box display="flex" flexWrap="wrap">
            {bronzeSponsors?.map((sponsor, index) => (
              <Box
                key={index}
                mt="8"
                width="50%"
                display="flex"
                justifyContent="center"
                alignItems="center"
              >
                <Link isExternal href={sponsor.link} display="contents">
                  <Image src={sponsor.image} alt={sponsor.name} width="60%" h="auto" />
                </Link>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
