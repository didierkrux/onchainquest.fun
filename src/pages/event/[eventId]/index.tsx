import {
  Box,
  Heading,
  Text,
  Image,
  CardBody,
  Link,
  Card,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useToast,
  useMediaQuery,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useLocalStorage } from 'usehooks-ts'
import { Info } from '@phosphor-icons/react'
import { isAndroid, isIOS } from 'react-device-detect'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { useWalletAccount } from 'hooks/useWallet'

import LanguageSwitch from 'components/LanguageSwitch'
import { Event } from 'entities/data'
import { Card as CardComponent } from 'components/Card'
import { QRScanner } from 'components/QRScanner'
import { FarcasterMessages } from 'components/FarcasterMessages'

export default function EventPage({ event }: { event: Event }) {
  const { t } = useTranslation()
  const [pwa] = useLocalStorage<boolean | null>('pwa', null)
  const [, setShowInstallPWA] = useLocalStorage('showInstallPWA', false)
  const router = useRouter()
  const { eventId } = router.query
  const toast = useToast()
  const [isMobile] = useMediaQuery('(max-width: 1024px)')
  const [attendeeCodeInput, setAttendeeCodeInput] = useState('')
  const [isProcessingCode, setIsProcessingCode] = useState(false)
  const { address } = useWalletAccount()

  const goldSponsors = event.sponsors?.filter((sponsor) => sponsor.sponsorCategory === '1-gold')
  const silverSponsors = event.sponsors?.filter((sponsor) => sponsor.sponsorCategory === '2-silver')
  const bronzeSponsors = event.sponsors?.filter((sponsor) => sponsor.sponsorCategory === '3-bronze')

  const handleAttendeeCodeSubmit = async () => {
    const cleanedCode = attendeeCodeInput.replace(/\s/g, '')
    if (cleanedCode.length === 6) {
      setIsProcessingCode(true)
      try {
        // Validate the attendee bracelet code
        const validationResponse = await fetch(`/api/ticket/${cleanedCode}?eventId=${eventId}`)
        const validationData = await validationResponse.json()

        if (!validationData.valid) {
          // If ticket is already used, it means it's claimed - redirect to owner's profile
          if (
            validationData.message === 'Ticket has already been used' &&
            validationData.ticketOwner
          ) {
            router.push(
              `/event/${eventId}/profile/${validationData.ticketOwner.address}?code=${cleanedCode}`
            )
            setAttendeeCodeInput('') // Clear input after submission
            return
          }

          toast({
            title: t('Invalid Ticket'),
            description: validationData.message,
            status: 'error',
            duration: 5000,
            isClosable: true,
            position: isMobile ? 'top' : 'bottom-right',
          })
          return
        }

        // Check if ticket has an owner
        if (validationData.ticketOwner) {
          // Redirect to the ticket owner's profile
          router.push(
            `/event/${eventId}/profile/${validationData.ticketOwner.address}?code=${cleanedCode}`
          )
        } else {
          // Show message for unclaimed ticket
          toast({
            title: t('Unclaimed Ticket'),
            description: t('If you are the owner of this ticket, associate it via your profile'),
            status: 'info',
            duration: 8000,
            isClosable: true,
            position: isMobile ? 'top' : 'bottom-right',
          })
        }
        setAttendeeCodeInput('') // Clear input after submission
      } catch (error) {
        console.error('Error submitting attendee code:', error)
        toast({
          title: t('Error'),
          description: t('Failed to process attendee code'),
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: isMobile ? 'top' : 'bottom-right',
        })
      } finally {
        setIsProcessingCode(false)
      }
    } else {
      toast({
        title: t('Error'),
        description: t('Please enter a 6-character attendee code'),
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: isMobile ? 'top' : 'bottom-right',
      })
    }
  }

  const handleAttendeeBraceletScan = async (result: string) => {
    try {
      // Check if it's a booth QR code
      if (result.includes('/booth/')) {
        toast({
          title: t('Booth QR Code Detected'),
          description: t(
            'This is a booth QR code. Please go to the Onboarding tab and use the scan button there to check in at booths.'
          ),
          status: 'info',
          duration: 8000,
          isClosable: true,
          position: isMobile ? 'top' : 'bottom-right',
        })
        return
      }

      // Check if it's a profile QR code
      if (result.includes('/profile/')) {
        // Extract the profile path from the URL
        const url = new URL(result)
        const profilePath = url.pathname
        router.push(profilePath + '?code=true')
        return
      }

      // Expected format: ${window.location.origin}/api/ticket/${ticketCode}?eventId=${eventId}
      const url = new URL(result)
      const pathParts = url.pathname.split('/')
      const ticketCode = pathParts[pathParts.length - 1]
      const urlEventId = url.searchParams.get('eventId')

      if (!ticketCode || !urlEventId || !eventId || typeof eventId !== 'string') {
        toast({
          title: t('Error'),
          description: t('Invalid QR code format'),
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: isMobile ? 'top' : 'bottom-right',
        })
        return
      }

      // Validate the ticket
      const validationResponse = await fetch(`/api/ticket/${ticketCode}?eventId=${eventId}`)
      const validationData = await validationResponse.json()

      if (!validationData.valid) {
        // If ticket is already used, it means it's claimed - redirect to owner's profile
        if (
          validationData.message === 'Ticket has already been used' &&
          validationData.ticketOwner
        ) {
          router.push(
            `/event/${eventId}/profile/${validationData.ticketOwner.address}?code=${ticketCode}`
          )
          return
        }

        toast({
          title: t('Invalid Ticket'),
          description: validationData.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: isMobile ? 'top' : 'bottom-right',
        })
        return
      }

      // Check if ticket has an owner
      if (validationData.ticketOwner) {
        // Redirect to the ticket owner's profile
        router.push(
          `/event/${eventId}/profile/${validationData.ticketOwner.address}?code=${ticketCode}`
        )
      } else {
        // Show message for unclaimed ticket
        toast({
          title: t('Unclaimed Ticket'),
          description: t('If you are the owner of this ticket, associate it via your profile'),
          status: 'info',
          duration: 8000,
          isClosable: true,
          position: isMobile ? 'top' : 'bottom-right',
        })
      }
    } catch (error) {
      console.error('Error scanning attendee bracelet:', error)
      toast({
        title: t('Error'),
        description: t('Failed to process QR code'),
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: isMobile ? 'top' : 'bottom-right',
      })
    }
  }

  if (!event) return <></>

  console.log('event', event)

  return (
    <Box>
      <Box display="flex" justifyContent="center" gap={4} m={4}>
        {(isAndroid || isIOS) && pwa === false && (
          <Button leftIcon={<Info size={22} />} onClick={() => setShowInstallPWA(true)}>
            {t('Install')}
          </Button>
        )}
        {event?.config?.eventLanguage && event.config.eventLanguage.length > 1 && (
          <LanguageSwitch eventLanguage={event.config.eventLanguage} />
        )}
      </Box>
      {event.program?.length > 0 && <Heading as="h1">{t('Program')}</Heading>}
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
      {event?.venue?.length > 0 && (
        <Heading as="h1" mt={4}>
          {t('Venue')}
        </Heading>
      )}
      {event?.venue?.length > 0 && event?.venue[0]?.image && (
        <Image src={event.venue[0].image} alt={event.venue[0].name} />
      )}
      {event.booths?.length > 0 && (
        <Heading as="h1" mt={4}>
          {t('Booths')}
        </Heading>
      )}
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
      {event.sponsors?.length > 0 && (
        <Heading as="h1" mt={4}>
          {t('Sponsors')}
        </Heading>
      )}
      <Box display="flex" flexDirection="column" gap={4}>
        {goldSponsors?.length > 0 && (
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
        )}
        {silverSponsors?.length > 0 && (
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
        )}
        {bronzeSponsors?.length > 0 && (
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
        )}
        {eventId === '3' && address && (
          <Box mt="10">
            <Text fontWeight="bold" textAlign="center">
              {t('Connect with attendees by scanning their bracelet QR code')}
            </Text>
            <Box display="flex" flexDirection="column" alignItems="center" gap={4} mt={4}>
              <QRScanner
                buttonLabel={t('Scan Attendee Bracelet')}
                onScan={handleAttendeeBraceletScan}
              />
              <Text fontWeight="bold" color="gray.500">
                - OR -
              </Text>
              <Box display="flex" alignItems="center" gap={4}>
                <input
                  type="text"
                  value={attendeeCodeInput}
                  onChange={(e) =>
                    setAttendeeCodeInput(e.target.value.replace(/\s/g, '').toUpperCase())
                  }
                  placeholder={t('Enter code')}
                  maxLength={6}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    width: '120px',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    fontSize: '14px',
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleAttendeeCodeSubmit}
                  isDisabled={attendeeCodeInput.replace(/\s/g, '').length !== 6 || isProcessingCode}
                  isLoading={isProcessingCode}
                  loadingText={t('Processing...')}
                >
                  {t('Submit')}
                </Button>
              </Box>
            </Box>
          </Box>
        )}

        {eventId === '3' && (
          <Box mt="10">
            <FarcasterMessages eventId={eventId} />
          </Box>
        )}
      </Box>
    </Box>
  )
}
