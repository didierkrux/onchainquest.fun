import {
  Box,
  Card,
  CardBody,
  Heading,
  Image,
  Text,
  useToast,
  useMediaQuery,
  Button,
  Link,
  useClipboard,
  Avatar,
  Stack,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/router'
import {
  ArrowLeft,
  UserPlus,
  UserMinus,
  ArrowUpRight,
  Check,
  CopySimple,
  Star,
  Handshake,
} from '@phosphor-icons/react'
import { useAccount, useWalletClient } from 'wagmi'
import { ethers } from 'ethers'
import { EAS, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk'
import { useLocalStorage } from 'usehooks-ts'
import {
  getEFPProfile,
  getEFPProfileUrl,
  followAddressOnEFP,
  unfollowAddressOnEFP,
  getFollowerState,
} from 'utils/efp'
import { Profile } from 'entities/profile'
import { profileAvatar, profileName, profileRole } from 'utils/index'

// EAS configuration for IRL meeting attestation
const easContractAddress = '0x4200000000000000000000000000000000000021'
const irlMeetingSchemaUID = '0xc59265615401143689cbfe73046a922c975c99d97e4c248070435b1104b2dea7'

export default function PublicProfilePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { eventId, address } = router.query
  const [isMobile] = useMediaQuery('(max-width: 1024px)')
  const toast = useToast()
  const [qrCodeDataURL, setQrCodeDataURL] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [efpProfile, setEfpProfile] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isProfileLoading, setIsProfileLoading] = useState(true)
  const { address: userAddress } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { onCopy, hasCopied } = useClipboard((address as string) || '')

  // IRL Meeting attestation states
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [isAttestingIRL, setIsAttestingIRL] = useState(false)
  const [irlAttestationTxLink, setIrlAttestationTxLink] = useState<string | null>(null)

  // Local storage for IRL meeting attestations
  const [irlAttestations, setIrlAttestations] = useLocalStorage<
    Array<{ address: string; txLink: string }>
  >('irl-meeting-attestations', [])
  const [hasAttestedIRL, setHasAttestedIRL] = useState(false)
  const [currentAttestationTxLink, setCurrentAttestationTxLink] = useState<string | null>(null)

  // Fetch profile data
  useEffect(() => {
    if (!address || typeof address !== 'string' || !eventId) {
      setIsProfileLoading(false)
      return
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/profile?address=${address}&eventId=${eventId}`)
        if (response.ok) {
          const profileData = await response.json()
          setProfile(profileData)
        } else {
          console.error('Failed to fetch profile:', response.status)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setIsProfileLoading(false)
      }
    }

    fetchProfile()
  }, [address, eventId])

  useEffect(() => {
    if (!address || typeof address !== 'string') {
      setQrCodeDataURL('')
      setIsLoading(false)
      return
    }

    // Generate QR code for the profile URL instead of just the address
    const profileUrl = `https://onchainquest.fun/event/${eventId}/profile/${address}`

    QRCode.toDataURL(profileUrl, {
      type: 'image/png',
      color: { dark: '#000000' },
    })
      .then((url: string) => {
        setQrCodeDataURL(url)
        setIsLoading(false)
      })
      .catch((err: any) => {
        console.error('Error generating QR code:', err)
        setIsLoading(false)
        toast({
          title: t('Error'),
          description: t('Failed to generate QR code'),
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: isMobile ? 'top' : 'bottom-right',
        })
      })
  }, [address, eventId, t, toast, isMobile])

  // Check if user is following this address
  useEffect(() => {
    if (!userAddress || !address || typeof address !== 'string') return

    const checkFollowStatus = async () => {
      try {
        // Use the follower state API to get accurate follow status
        const followerState = await getFollowerState(address, userAddress)
        console.log('Follower state response:', followerState)

        if (followerState) {
          // Check if the current user is following the target address
          setIsFollowing(followerState.state.follow)
        } else {
          // No follower state found, default to not following
          setIsFollowing(false)
        }
      } catch (error) {
        console.error('Error checking follow status:', error)
        // If API check fails, default to not following
        setIsFollowing(false)
      }
    }

    checkFollowStatus()
  }, [userAddress, address])

  // Fetch EFP profile data
  useEffect(() => {
    if (!address || typeof address !== 'string') return

    const fetchEFPProfile = async () => {
      try {
        const profile = await getEFPProfile(address)
        console.log('EFP Profile data:', profile) // Debug log
        setEfpProfile(profile)
      } catch (error) {
        console.error('Error fetching EFP profile:', error)
        setEfpProfile(null)
      }
    }

    fetchEFPProfile()
  }, [address])

  // Check if user has already attested to meeting this person IRL
  useEffect(() => {
    if (!userAddress || !address || typeof address !== 'string') {
      setHasAttestedIRL(false)
      setCurrentAttestationTxLink(null)
      return
    }

    const targetAddress = address.toLowerCase()
    const attestation = irlAttestations.find(
      (attestation) => attestation.address.toLowerCase() === targetAddress
    )

    setHasAttestedIRL(!!attestation)
    setCurrentAttestationTxLink(attestation?.txLink || null)
  }, [userAddress, address, irlAttestations])

  const handleFollow = async () => {
    if (!userAddress || !address || typeof address !== 'string' || !walletClient) {
      toast({
        title: t('Error'),
        description: t('Please connect your wallet to follow'),
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: isMobile ? 'top' : 'bottom-right',
      })
      return
    }

    setIsFollowLoading(true)
    try {
      const provider = new ethers.BrowserProvider(walletClient)
      const signer = await provider.getSigner()

      // Use the current API follow status to determine the action
      // isFollowing state comes from the API check, so we can trust it for the button action
      const shouldUnfollow = isFollowing

      // Try on-chain operation
      try {
        if (shouldUnfollow) {
          // Unfollow - user is currently following, so unfollow them
          toast({
            title: t('Signature Required'),
            description: t('You are about to sign a transaction to unfollow this address.'),
            status: 'info',
            duration: 7000,
            isClosable: true,
            position: isMobile ? 'top' : 'bottom-right',
          })
          const txHash = await unfollowAddressOnEFP(signer, address)

          // Refresh follower state after successful unfollow
          const updatedFollowerState = await getFollowerState(address, userAddress, 'fresh')
          if (updatedFollowerState) {
            setIsFollowing(updatedFollowerState.state.follow)
          } else {
            setIsFollowing(false)
          }

          toast({
            title: t('Success'),
            description: t('Successfully unfollowed'),
            status: 'success',
            duration: 5000,
            isClosable: true,
            position: isMobile ? 'top' : 'bottom-right',
          })
          console.log('Unfollow transaction hash:', txHash)
        } else {
          // Follow - user is not currently following, so follow them
          toast({
            title: t('Signature Required'),
            description: t('You are about to sign a transaction to follow this address.'),
            status: 'info',
            duration: 7000,
            isClosable: true,
            position: isMobile ? 'top' : 'bottom-right',
          })
          const txHash = await followAddressOnEFP(signer, address)

          // Refresh follower state after successful follow
          const updatedFollowerState = await getFollowerState(address, userAddress, 'fresh')
          if (updatedFollowerState) {
            setIsFollowing(updatedFollowerState.state.follow)
          } else {
            setIsFollowing(true) // If no state found but we just followed, assume following
          }

          toast({
            title: t('Success'),
            description: t('Successfully followed'),
            status: 'success',
            duration: 5000,
            isClosable: true,
            position: isMobile ? 'top' : 'bottom-right',
          })
          console.log('Follow transaction hash:', txHash)
        }
      } catch (onChainError: any) {
        console.log('On-chain operation failed, falling back to EFP app:', onChainError)

        // Fallback: redirect to EFP app
        const action = shouldUnfollow ? 'unfollow' : 'follow'
        const efpUrl = `https://efp.app/${address}`
        window.open(efpUrl, '_blank')

        toast({
          title: t('Redirecting to EFP'),
          description: t(
            'EFP contracts not available on this network. Opening EFP app to follow/unfollow.'
          ),
          status: 'info',
          duration: 5000,
          isClosable: true,
          position: isMobile ? 'top' : 'bottom-right',
        })
      }
    } catch (error: any) {
      console.error('Error following/unfollowing:', error)

      // Handle specific error cases
      if (error?.code === 4001) {
        toast({
          title: t('Transaction Cancelled'),
          description: t('You rejected the transaction in your wallet'),
          status: 'warning',
          duration: 5000,
          isClosable: true,
          position: isMobile ? 'top' : 'bottom-right',
        })
      } else {
        toast({
          title: t('Error'),
          description: error?.message || t('Failed to follow/unfollow'),
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: isMobile ? 'top' : 'bottom-right',
        })
      }
    } finally {
      setIsFollowLoading(false)
    }
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  const handleIRLMeetingAttestation = async () => {
    if (!userAddress || !address || typeof address !== 'string' || !walletClient) {
      toast({
        title: t('Error'),
        description: t('Please connect your wallet to create attestation'),
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: isMobile ? 'top' : 'bottom-right',
      })
      return
    }

    setIsAttestingIRL(true)
    try {
      const provider = new ethers.BrowserProvider(walletClient)
      const signer = await provider.getSigner()

      // Initialize EAS
      const eas = new EAS(easContractAddress)
      await eas.connect(signer)

      // Initialize SchemaEncoder with the schema string
      const schemaEncoder = new SchemaEncoder('bool metIRL')
      const encodedData = schemaEncoder.encodeData([{ name: 'metIRL', value: true, type: 'bool' }])

      toast({
        title: t('Signature Required'),
        description: t(
          'You are about to sign a transaction to attest that you met this person IRL.'
        ),
        status: 'info',
        duration: 7000,
        isClosable: true,
        position: isMobile ? 'top' : 'bottom-right',
      })

      // Create the attestation
      const tx = await eas.attest({
        schema: irlMeetingSchemaUID,
        data: {
          recipient: address,
          expirationTime: BigInt(0),
          revocable: true,
          data: encodedData,
        },
      })

      // Wait for transaction to be mined and get the attestation UID
      const attestationUID = await tx.wait()
      const txLink = `https://basescan.org/tx/${attestationUID}`
      setIrlAttestationTxLink(txLink)

      // Store the address in local storage
      const targetAddress = address.toLowerCase()
      if (
        !irlAttestations.some(
          (attestedAddress) => attestedAddress.address.toLowerCase() === targetAddress
        )
      ) {
        setIrlAttestations([...irlAttestations, { address, txLink }])
      }

      console.log('IRL Meeting attestation UID:', attestationUID)

      toast({
        title: t('Success'),
        description: t('IRL meeting attestation created successfully!'),
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: isMobile ? 'top' : 'bottom-right',
      })

      onClose()
    } catch (error: any) {
      console.error('Error creating IRL meeting attestation:', error)

      // Handle specific error cases
      if (error?.code === 4001) {
        toast({
          title: t('Transaction Cancelled'),
          description: t('You rejected the transaction in your wallet'),
          status: 'warning',
          duration: 5000,
          isClosable: true,
          position: isMobile ? 'top' : 'bottom-right',
        })
      } else {
        toast({
          title: t('Error'),
          description: error?.message || t('Failed to create IRL meeting attestation'),
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: isMobile ? 'top' : 'bottom-right',
        })
      }
    } finally {
      setIsAttestingIRL(false)
    }
  }

  if (!address || typeof address !== 'string') {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" p={4}>
        <Text>{t('Invalid address')}</Text>
      </Box>
    )
  }

  return (
    <Box display="flex" flexDirection="column" alignItems="center" p={4}>
      <Box w="100%" maxW="400px" mb={4}>
        <Button leftIcon={<ArrowLeft />} variant="ghost" onClick={handleBack} size="sm">
          {t('Back')}
        </Button>
      </Box>

      <Heading as="h1" mb={6}>
        {t('Public Profile')}
      </Heading>

      <Card maxW="400px" w="100%">
        <CardBody>
          <Box display="flex" flexDirection="column" alignItems="center" gap={4}>
            {/* Profile Information */}
            {isProfileLoading ? (
              <Box textAlign="center">
                <Text>{t('Loading profile...')}</Text>
              </Box>
            ) : profile ? (
              <Stack spacing={4} w="100%" textAlign="center">
                {/* Avatar and Name */}
                <Box>
                  <Avatar
                    src={profileAvatar(profile)}
                    size="xl"
                    mb={3}
                    name={profileName(profile)}
                  />
                  <Text fontSize="xl" fontWeight="bold">
                    {profileName(profile)}
                  </Text>
                  <Text
                    fontSize="md"
                    color="gray.600"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    gap={1}
                  >
                    {profileRole(profile)}
                  </Text>
                </Box>

                {/* Score */}
                {profile.score && profile.score > 0 && (
                  <Box display="flex" alignItems="center" justifyContent="center" gap={2}>
                    <Text fontSize="lg" fontWeight="semibold" color="purple.500">
                      {profile.score}
                    </Text>
                    <Star weight="fill" size={20} color="#A855F7" />
                  </Box>
                )}

                {/* Basename */}
                {profile.basename && (
                  <Box>
                    <Text fontSize="sm" color="blue.500" fontWeight="medium">
                      {profile.basename}
                    </Text>
                  </Box>
                )}

                <Divider />
              </Stack>
            ) : (
              <Box textAlign="center">
                <Text color="gray.500">{t('Profile not found')}</Text>
              </Box>
            )}

            {/* Address */}
            <Text fontSize="lg" fontWeight="bold" textAlign="center">
              <Box display="flex" alignItems="center" gap={2}>
                <Text fontSize={['2xs', 'xs']} color="gray.500">
                  {address}
                </Text>
                {hasCopied ? (
                  <Check width={20} />
                ) : (
                  <CopySimple width={20} onClick={onCopy} cursor="pointer" />
                )}
              </Box>
            </Text>

            {/* EFP Profile Info */}
            {efpProfile && typeof efpProfile === 'object' && (
              <Box textAlign="center" mb={2}>
                {efpProfile.ens && typeof efpProfile.ens === 'string' && (
                  <Text fontSize="md" color="blue.500" fontWeight="medium">
                    {efpProfile.ens}
                  </Text>
                )}
                {efpProfile.followers !== undefined && typeof efpProfile.followers === 'number' && (
                  <Text fontSize="sm" color="gray.500">
                    {efpProfile.followers} {t('followers')}
                  </Text>
                )}
                {efpProfile.following !== undefined && typeof efpProfile.following === 'number' && (
                  <Text fontSize="sm" color="gray.500">
                    {efpProfile.following} {t('following')}
                  </Text>
                )}
              </Box>
            )}

            {/* Follow/Unfollow Button */}
            {userAddress && userAddress.toLowerCase() !== address.toLowerCase() && (
              <Button
                leftIcon={isFollowing ? <UserMinus /> : <UserPlus />}
                onClick={handleFollow}
                isLoading={isFollowLoading}
                loadingText={isFollowing ? t('Unfollowing...') : t('Following...')}
                colorScheme={isFollowing ? 'gray' : 'blue'}
                variant={isFollowing ? 'outline' : 'solid'}
                size="md"
                w="100%"
              >
                {isFollowing ? t('Unfollow') : t('Follow')}
              </Button>
            )}

            {/* IRL Meeting Attestation Button */}
            {userAddress &&
              userAddress.toLowerCase() !== address.toLowerCase() &&
              (router.query.code || hasAttestedIRL) && (
                <Box w="100%">
                  <Button
                    leftIcon={<Handshake />}
                    onClick={hasAttestedIRL ? undefined : onOpen}
                    colorScheme={hasAttestedIRL ? 'green' : 'green'}
                    variant={hasAttestedIRL ? 'solid' : 'outline'}
                    size="md"
                    w="100%"
                    isDisabled={hasAttestedIRL}
                  >
                    {hasAttestedIRL ? t('✓ Met IRL') : t('Attest IRL Meeting')}
                  </Button>

                  {/* Display attestation image if user has attested */}
                  {hasAttestedIRL &&
                    currentAttestationTxLink &&
                    (() => {
                      const txHash = currentAttestationTxLink.split('/').pop()
                      if (txHash) {
                        return (
                          <Box
                            mt={3}
                            display="flex"
                            flexDirection="column"
                            gap={2}
                            alignItems="center"
                          >
                            <Text fontSize="sm" fontWeight="medium" color="green.600">
                              {t('IRL Meeting Attestation')}
                            </Text>
                            <Link
                              href={`https://base.easscan.org/attestation/view/${txHash}`}
                              isExternal
                            >
                              <Image
                                src={`https://base.easscan.org/attestation/preview/${txHash}.png`}
                                alt="IRL Meeting Attestation"
                                borderRadius="md"
                                w="100%"
                                h="auto"
                                objectFit="contain"
                              />
                            </Link>
                            <Link
                              href={`https://base.easscan.org/attestation/view/${txHash}`}
                              isExternal
                              color="blue.500"
                              fontSize="xs"
                              _hover={{ textDecoration: 'underline' }}
                            >
                              {t('View on EAS Scan')}
                            </Link>
                          </Box>
                        )
                      }
                      return null
                    })()}
                </Box>
              )}

            {/* View on EFP Button */}
            <Link href={getEFPProfileUrl(address)} isExternal>
              <Button leftIcon={<ArrowUpRight />} variant="outline" size="md" w="100%">
                {t('View on EFP')}
              </Button>
            </Link>

            {isLoading ? (
              <Box
                w="200px"
                h="200px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="md"
              >
                <Text>{t('Generating QR code...')}</Text>
              </Box>
            ) : qrCodeDataURL ? (
              <Image src={qrCodeDataURL} w="200px" h="200px" alt="QR Code" borderRadius="md" />
            ) : (
              <Box
                w="200px"
                h="200px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="md"
              >
                <Text color="red.500">{t('Failed to generate QR code')}</Text>
              </Box>
            )}

            <Text fontSize="sm" color="gray.500" textAlign="center">
              {t('Scan this QR code to connect with me')}
            </Text>
          </Box>
        </CardBody>
      </Card>

      {/* IRL Meeting Attestation Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('Attest IRL Meeting')}</ModalHeader>
          <ModalBody>
            <Text mb={4}>
              {t(
                'Are you sure you want to create an on-chain attestation that you met this person in real life?'
              )}
            </Text>
            <Text fontSize="sm" color="gray.600">
              {t('This will create a permanent, verifiable record on Base blockchain that you met')}{' '}
              {profile ? profileName(profile) : address} {t('in person.')}
            </Text>
            {currentAttestationTxLink && (
              <Box
                mt={4}
                p={3}
                bg="green.50"
                borderRadius="md"
                border="1px solid"
                borderColor="green.200"
              >
                <Text fontSize="sm" color="green.700" fontWeight="medium">
                  {t('Attestation created successfully!')}
                </Text>
                <Link href={currentAttestationTxLink} isExternal color="blue.500" fontSize="sm">
                  {t('View transaction on BaseScan')}
                </Link>
              </Box>
            )}
            {hasAttestedIRL && (
              <Box
                mt={4}
                p={3}
                bg="blue.50"
                borderRadius="md"
                border="1px solid"
                borderColor="blue.200"
              >
                <Text fontSize="sm" color="blue.700" fontWeight="medium">
                  {t('You have already attested to meeting this person IRL.')}
                </Text>
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              {t('Cancel')}
            </Button>
            <Button
              colorScheme="green"
              onClick={handleIRLMeetingAttestation}
              isLoading={isAttestingIRL}
              loadingText={t('Creating attestation...')}
            >
              {t('Create Attestation')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}
