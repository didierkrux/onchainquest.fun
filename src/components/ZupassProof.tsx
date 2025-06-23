import {
  Box,
  Button,
  Text,
  useToast,
  useMediaQuery,
  Card,
  CardBody,
  VStack,
  HStack,
  Badge,
} from '@chakra-ui/react'
import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Warning } from '@phosphor-icons/react'

// Dynamic imports to avoid webpack issues
let ParcnetClientProvider: any = null
let Toolbar: any = null
let useParcnetClient: any = null
let ClientConnectionState: any = null

// Load Zupass modules dynamically
const loadZupassModules = async () => {
  try {
    const zupassModule = await import('@parcnet-js/app-connector-react')
    ParcnetClientProvider = zupassModule.ParcnetClientProvider
    Toolbar = zupassModule.Toolbar
    useParcnetClient = zupassModule.useParcnetClient
    ClientConnectionState = zupassModule.ClientConnectionState
    return true
  } catch (error) {
    console.error('Failed to load Zupass modules:', error)
    return false
  }
}

export default function ZupassProof() {
  const [zupassLoaded, setZupassLoaded] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadZupassModules().then((success) => {
      setZupassLoaded(success)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <Card>
        <CardBody>
          <VStack spacing={4}>
            <Text fontSize="lg" fontWeight="bold">
              Loading Zupass...
            </Text>
          </VStack>
        </CardBody>
      </Card>
    )
  }

  if (!zupassLoaded) {
    return (
      <Card>
        <CardBody>
          <VStack spacing={4}>
            <Text fontSize="lg" fontWeight="bold">
              Zupass Not Available
            </Text>
            <Text color="gray.600" textAlign="center">
              Zupass integration is not available. Please install the required dependencies.
            </Text>
          </VStack>
        </CardBody>
      </Card>
    )
  }

  return (
    <ParcnetClientProvider
      zapp={{
        name: 'Onchain Quest Event 3',
        permissions: {
          REQUEST_PROOF: { collections: ['Devcon SEA'] },
          READ_PUBLIC_IDENTIFIERS: {},
        },
      }}
    >
      <Toolbar />
      <ZupassProofContent />
    </ParcnetClientProvider>
  )
}

function ZupassProofContent() {
  const { t } = useTranslation()
  const { z, connectionState } = useParcnetClient()
  const [proof, setProof] = useState<any>(null)
  const [verified, setVerified] = useState<boolean | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)
  const toast = useToast()
  const [isMobile] = useMediaQuery('(max-width: 1024px)')

  const requestProof = useCallback(async () => {
    if (connectionState !== ClientConnectionState.CONNECTED) {
      toast({
        title: t('Error'),
        description: t('Please connect to Zupass first'),
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: isMobile ? 'top' : 'bottom-right',
      })
      return
    }

    setIsRequesting(true)
    try {
      // Dynamic import for ticket proof request
      const { getTicketProofRequest } = await import('utils/zupass')
      const req = getTicketProofRequest()
      console.log('Requesting proof with schema:', req.schema)

      const res = await z.gpc.prove({
        request: req.schema,
        collectionIds: ['Devcon SEA'],
      })

      if (res.success) {
        setProof(res)
        toast({
          title: t('Success'),
          description: t('Proof received successfully'),
          status: 'success',
          duration: 5000,
          isClosable: true,
          position: isMobile ? 'top' : 'bottom-right',
        })
      } else {
        console.error('Proof request failed:', res.error)
        toast({
          title: t('Error'),
          description: t('Failed to request proof'),
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: isMobile ? 'top' : 'bottom-right',
        })
      }
    } catch (error) {
      console.error('Error requesting proof:', error)
      toast({
        title: t('Error'),
        description: t('An error occurred while requesting proof'),
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: isMobile ? 'top' : 'bottom-right',
      })
    } finally {
      setIsRequesting(false)
    }
  }, [z, connectionState, toast, t, isMobile])

  const verifyProof = useCallback(async () => {
    if (!proof) return

    setIsVerifying(true)
    try {
      // Dynamic import for serialization
      const { serializeProofResult } = await import('utils/zupass-serialize')
      const serializedProofResult = serializeProofResult(proof)

      const res = await fetch('/api/verify-zupass', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serializedProofResult,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setVerified(data.verified)

        if (data.verified) {
          toast({
            title: t('Success'),
            description: t('Proof verified successfully!'),
            status: 'success',
            duration: 5000,
            isClosable: true,
            position: isMobile ? 'top' : 'bottom-right',
          })
        } else {
          toast({
            title: t('Warning'),
            description: t('Proof verification failed'),
            status: 'warning',
            duration: 5000,
            isClosable: true,
            position: isMobile ? 'top' : 'bottom-right',
          })
        }
      } else {
        console.error('Verification request failed:', res.statusText)
        toast({
          title: t('Error'),
          description: t('Failed to verify proof'),
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: isMobile ? 'top' : 'bottom-right',
        })
      }
    } catch (error) {
      console.error('Error verifying proof:', error)
      toast({
        title: t('Error'),
        description: t('An error occurred while verifying proof'),
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: isMobile ? 'top' : 'bottom-right',
      })
    } finally {
      setIsVerifying(false)
    }
  }, [proof, toast, t, isMobile])

  if (connectionState !== ClientConnectionState.CONNECTED) {
    return (
      <Card>
        <CardBody>
          <VStack spacing={4}>
            <Text fontSize="lg" fontWeight="bold">
              {t('Zupass Proof Verification')}
            </Text>
            <Text color="gray.600" textAlign="center">
              {t('Please connect to Zupass to verify your event ticket')}
            </Text>
          </VStack>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <CardBody>
        <VStack spacing={4} align="stretch">
          <Text fontSize="lg" fontWeight="bold">
            {t('Zupass Proof Verification')}
          </Text>

          <Button
            onClick={requestProof}
            isLoading={isRequesting}
            loadingText={t('Requesting...')}
            colorScheme="blue"
            size="lg"
          >
            {t('Request Proof')}
          </Button>

          {proof && (
            <Box>
              <Text fontWeight="semibold" mb={2}>
                {t('Proof Received')}
              </Text>

              <Card variant="outline" mb={4}>
                <CardBody>
                  <VStack align="start" spacing={2}>
                    <HStack>
                      <Text fontWeight="medium">{t('Name')}:</Text>
                      <Text>
                        {proof.revealedClaims.pods?.ticket?.entries?.attendeeName?.value?.toString() ||
                          t('Not revealed')}
                      </Text>
                    </HStack>

                    <HStack>
                      <Text fontWeight="medium">{t('Email')}:</Text>
                      <Text>
                        {proof.revealedClaims.pods?.ticket?.entries?.attendeeEmail?.value?.toString() ||
                          t('Not revealed')}
                      </Text>
                    </HStack>

                    <HStack>
                      <Text fontWeight="medium">{t('Event ID')}:</Text>
                      <Text>
                        {proof.revealedClaims.pods?.ticket?.entries?.eventId?.value?.toString() ||
                          t('Not revealed')}
                      </Text>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>

              {verified !== null && (
                <HStack mb={4}>
                  <Badge
                    colorScheme={verified ? 'green' : 'red'}
                    variant="subtle"
                    px={3}
                    py={1}
                    borderRadius="full"
                  >
                    <HStack spacing={1}>
                      {verified ? <Check size={16} /> : <Warning size={16} />}
                      <Text>{verified ? t('Verified') : t('Not Verified')}</Text>
                    </HStack>
                  </Badge>
                </HStack>
              )}

              <Button
                onClick={verifyProof}
                isLoading={isVerifying}
                loadingText={t('Verifying...')}
                colorScheme="green"
                size="lg"
                w="full"
              >
                {t('Verify Proof')}
              </Button>
            </Box>
          )}
        </VStack>
      </CardBody>
    </Card>
  )
}
