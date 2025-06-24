import {
  Box,
  Card,
  CardBody,
  Heading,
  Text,
  Image,
  Link,
  SimpleGrid,
  useMediaQuery,
  useToast,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { ArrowLeft } from '@phosphor-icons/react'
import { useAccount } from 'wagmi'

import { BOOTH_DATA, adminWallets } from 'config'
import { Card as CardComponent } from 'components/Card'

export default function BoothPage() {
  const { t } = useTranslation()
  const { address } = useAccount()
  const router = useRouter()
  const { eventId } = router.query
  const [isMobile] = useMediaQuery('(max-width: 768px)')
  const toast = useToast()
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({})

  const DOMAIN_URL = 'https://onchainquest.fun'
  const isAdmin = address && adminWallets.includes(address.toLowerCase())

  useEffect(() => {
    if (!eventId) return

    // Generate QR codes for all booths
    const generateQRCodes = async () => {
      const qrCodePromises = Object.entries(BOOTH_DATA).map(async ([boothId, booth]) => {
        const boothUrl = `${DOMAIN_URL}/event/${eventId}/booth/${boothId}/${booth.code}`

        try {
          const qrCodeDataURL = await QRCode.toDataURL(boothUrl, {
            type: 'image/png',
            color: { dark: '#000000' },
            width: 200,
            margin: 2,
          })
          return [boothId, qrCodeDataURL]
        } catch (error) {
          console.error(`Error generating QR code for booth ${boothId}:`, error)
          toast({
            title: t('Error'),
            description: t('Failed to generate QR code for booth {{boothId}}', { boothId }),
            status: 'error',
            duration: 5000,
            isClosable: true,
            position: isMobile ? 'top' : 'bottom-right',
          })
          return [boothId, '']
        }
      })

      const results = await Promise.all(qrCodePromises)
      const qrCodeMap = Object.fromEntries(results)
      setQrCodes(qrCodeMap)
    }

    generateQRCodes()
  }, [eventId, t, toast, isMobile])

  const handleBackClick = () => {
    router.push(`/event/${eventId}`)
  }

  if (!isAdmin) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" p={8}>
        <Heading>Access Denied</Heading>
        <Text mt={4}>Only admins can view booth QR codes.</Text>
      </Box>
    )
  }

  if (!eventId) {
    return null
  }

  return (
    <Box p={4} maxW="1200px" mx="auto">
      <Box mb={6}>
        <Link
          onClick={handleBackClick}
          display="inline-flex"
          alignItems="center"
          gap={2}
          color="blue.500"
          _hover={{ textDecoration: 'underline' }}
        >
          <ArrowLeft size={20} />
          {t('Back to Event')}
        </Link>
      </Box>

      <Heading size="lg" mb={6} textAlign="center">
        {t('Booth QR Codes')}
      </Heading>

      <Text mb={8} textAlign="center" color="gray.600">
        {t('Scan these QR codes to check in at each booth during the event')}
      </Text>

      <SimpleGrid columns={isMobile ? 1 : 2} spacing={6}>
        {Object.entries(BOOTH_DATA).map(([boothId, booth]) => {
          const boothUrl = `${DOMAIN_URL}/event/${eventId}/booth/${boothId}/${booth.code}`

          return (
            <CardComponent key={boothId}>
              <CardBody>
                <Box textAlign="center">
                  <Heading size="md" mb={2}>
                    {t('Booth {{boothId}}', { boothId })}
                  </Heading>

                  <Text fontWeight="bold" mb={2} color="purple.600">
                    {booth.name}
                  </Text>

                  <Text mb={4} color="gray.600" fontSize="sm">
                    {booth.description}
                  </Text>

                  <Box mb={4}>
                    <Link
                      href={boothUrl}
                      isExternal
                      color="blue.500"
                      fontSize="sm"
                      _hover={{ textDecoration: 'underline' }}
                    >
                      {qrCodes[boothId] ? (
                        <Image
                          src={qrCodes[boothId]}
                          alt={`QR Code for ${booth.name}`}
                          mx="auto"
                          borderRadius="md"
                          border="1px solid"
                          borderColor="gray.200"
                        />
                      ) : (
                        <Box
                          w="200px"
                          h="200px"
                          mx="auto"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          border="1px solid"
                          borderColor="gray.200"
                          borderRadius="md"
                          bg="gray.50"
                        >
                          <Text color="gray.500" fontSize="sm">
                            {t('Generating QR code...')}
                          </Text>
                        </Box>
                      )}
                    </Link>
                  </Box>

                  <Text fontSize="xs" color="gray.500" mb={2}>
                    {t('Booth Code')}:{' '}
                    <Text as="span" fontFamily="mono" fontWeight="bold">
                      {booth.code}
                    </Text>
                  </Text>
                </Box>
              </CardBody>
            </CardComponent>
          )
        })}
      </SimpleGrid>
    </Box>
  )
}
