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
import { useEffect, useState, useMemo } from 'react'
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
  completeFollowWithMint,
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
  const { onCopy, hasCopied } = useClipboard(address && typeof address === 'string' ? address : '')

  // IRL Meeting attestation states
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [isAttestingIRL, setIsAttestingIRL] = useState(false)
  const [irlAttestationTxLink, setIrlAttestationTxLink] = useState<string | null>(null)
  const [showAttestationImage, setShowAttestationImage] = useState(false)

  // Local storage for IRL meeting attestations
  const [irlAttestations, setIrlAttestations] = useLocalStorage<
    Array<string | { address: string; txLink: string }>
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
    const profileUrl = `https://onchainquest.fun/event/${eventId}/profile/${address}?code=true`

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
  }, [address, eventId])

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

  // Memoize the attestation lookup to prevent unnecessary re-renders
  const currentAttestation = useMemo(() => {
    if (!userAddress || !address || typeof address !== 'string') {
      return null
    }
    const targetAddress = address.toLowerCase()

    // Debug logging
    console.log('Checking attestations for address:', targetAddress)
    console.log('All attestations:', irlAttestations)

    // Handle both string format and object format
    const attestation = irlAttestations.find((item) => {
      if (typeof item === 'string') {
        // Handle string format: ["0x479FeE75Dab026070c29c3b55bf16B54E1fCd7f1"]
        return item.toLowerCase() === targetAddress
      } else if (item && typeof item === 'object' && item.address) {
        // Handle object format: [{ address: "...", txLink: "..." }]
        return item.address.toLowerCase() === targetAddress
      }
      return false
    })

    console.log('Found attestation:', attestation)
    return attestation
  }, [userAddress, address, irlAttestations])

  // Update attestation state when memoized value changes
  useEffect(() => {
    if (!userAddress || !address || typeof address !== 'string') {
      setHasAttestedIRL(false)
      setCurrentAttestationTxLink(null)
      setShowAttestationImage(false)
      return
    }

    const hasAttested = !!currentAttestation
    const txLink =
      typeof currentAttestation === 'object' && currentAttestation?.txLink
        ? currentAttestation.txLink
        : null

    console.log('Setting attestation state:', { hasAttested, txLink })

    setHasAttestedIRL(hasAttested)
    setCurrentAttestationTxLink(txLink)

    // Add 2-second delay for showing attestation image
    if (hasAttested) {
      const timer = setTimeout(() => {
        setShowAttestationImage(true)
      }, 2000)

      return () => clearTimeout(timer)
    } else {
      setShowAttestationImage(false)
    }
  }, [currentAttestation, userAddress, address])

  // Helper function to refresh follow state with retries
  const refreshFollowState = async (retryCount = 0, maxRetries = 3): Promise<void> => {
    if (!userAddress || !address || typeof address !== 'string') return

    try {
      console.log(`Refreshing follow state (attempt ${retryCount + 1}/${maxRetries + 1})`)

      const updatedFollowerState = await getFollowerState(address, userAddress, 'fresh')

      if (updatedFollowerState) {
        const newFollowState = updatedFollowerState.state.follow
        console.log('Updated follow state from API:', newFollowState)
        setIsFollowing(newFollowState)
        return
      } else {
        // No follower state found - this could mean the API hasn't indexed yet
        console.log('No follower state found in API response')

        if (retryCount < maxRetries) {
          // Wait with exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, retryCount) * 1000
          console.log(`Retrying in ${delay}ms...`)

          setTimeout(() => {
            refreshFollowState(retryCount + 1, maxRetries)
          }, delay)
        } else {
          // After max retries, make a reasonable assumption based on the action
          console.log('Max retries reached, making reasonable assumption')
          // Don't change the state here - let the calling code handle it
        }
      }
    } catch (error) {
      console.error(`Error refreshing follow state (attempt ${retryCount + 1}):`, error)

      if (retryCount < maxRetries) {
        // Wait with exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, retryCount) * 1000
        console.log(`Retrying in ${delay}ms after error...`)

        setTimeout(() => {
          refreshFollowState(retryCount + 1, maxRetries)
        }, delay)
      } else {
        console.error('Max retries reached for follow state refresh')
        // Don't change the state here - let the calling code handle it
      }
    }
  }

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

          toast({
            title: t('Successfully Unfollowed'),
            description: (
              <Box>
                <Text mb={2}>{t('You have unfollowed this address.')}</Text>
                <Link
                  href={`https://basescan.org/tx/${txHash}`}
                  isExternal
                  color="white"
                  fontSize="xs"
                  fontFamily="mono"
                  _hover={{ textDecoration: 'underline' }}
                  display="block"
                >
                  {t('Transaction:')} {txHash.slice(0, 10)}...{txHash.slice(-8)}
                </Link>
              </Box>
            ),
            status: 'success',
            duration: 10000,
            isClosable: true,
            position: isMobile ? 'top' : 'bottom-right',
          })
          console.log('Unfollow transaction hash:', txHash)

          // Start refresh process for unfollow
          // For unfollow, we can be more confident that the state should be false
          setIsFollowing(false) // Optimistic update
          // refreshFollowState() // Start background refresh
        } else {
          // Follow - user is not currently following, so follow them
          toast({
            title: t('Signature Required'),
            description: t(
              "You are about to sign a transaction to follow this address. This may also create your primary list if you don't have one yet."
            ),
            status: 'info',
            duration: 7000,
            isClosable: true,
            position: isMobile ? 'top' : 'bottom-right',
          })

          const result = await followAddressOnEFP(signer, address)

          // Show different success messages based on operation type
          if (result.operationType === 'double') {
            // Two transactions: created primary list + followed
            toast({
              title: t('Primary List Created & Following'),
              description: (
                <Box>
                  <Text mb={2}>
                    {t('Successfully created your primary list and followed this address!')}
                  </Text>
                  <Link
                    href={`https://basescan.org/tx/${result.followTxHash}`}
                    isExternal
                    color="white"
                    fontSize="xs"
                    fontFamily="mono"
                    _hover={{ textDecoration: 'underline' }}
                    display="block"
                    mb={1}
                  >
                    {t('Follow:')} {result.followTxHash?.slice(0, 10)}...
                    {result.followTxHash?.slice(-8)}
                  </Link>
                </Box>
              ),
              status: 'success',
              duration: 8000,
              isClosable: true,
              position: isMobile ? 'top' : 'bottom-right',
            })
            console.log('Follow operation (double) - first step:', {
              followTxHash: result.followTxHash,
            })

            // Show intermediate toast about minting
            toast({
              title: t('Minting Primary List NFT'),
              description: t(
                'You are about to sign a transaction to mint your primary EFP list NFT.'
              ),
              status: 'info',
              duration: 7000,
              isClosable: true,
              position: isMobile ? 'top' : 'bottom-right',
            })

            // Complete the second transaction
            const mintTxHash = await completeFollowWithMint(signer)

            // Show final success toast with both transaction links
            toast({
              title: t('Primary List Created & Following'),
              description: (
                <Box>
                  <Text mb={2}>
                    {t('Successfully created your primary list and followed this address!')}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    {t('Two transactions completed:')}
                  </Text>
                  <Link
                    href={`https://basescan.org/tx/${result.followTxHash}`}
                    isExternal
                    color="white"
                    fontSize="xs"
                    fontFamily="mono"
                    _hover={{ textDecoration: 'underline' }}
                    display="block"
                    mb={1}
                  >
                    {t('Follow:')} {result.followTxHash?.slice(0, 10)}...
                    {result.followTxHash?.slice(-8)}
                  </Link>
                  <Link
                    href={`https://basescan.org/tx/${mintTxHash}`}
                    isExternal
                    color="white"
                    fontSize="xs"
                    fontFamily="mono"
                    _hover={{ textDecoration: 'underline' }}
                    display="block"
                  >
                    {t('Mint:')} {mintTxHash.slice(0, 10)}...{mintTxHash.slice(-8)}
                  </Link>
                </Box>
              ),
              status: 'success',
              duration: 12000,
              isClosable: true,
              position: isMobile ? 'top' : 'bottom-right',
            })
            console.log('Follow operation (double) - completed:', {
              followTxHash: result.followTxHash,
              mintTxHash: mintTxHash,
            })
          } else {
            // Single transaction: normal follow
            toast({
              title: t('Successfully Following'),
              description: (
                <Box>
                  <Text mb={2}>{t('You are now following this address!')}</Text>
                  <Link
                    href={`https://basescan.org/tx/${result.txHash}`}
                    isExternal
                    color="white"
                    fontSize="xs"
                    fontFamily="mono"
                    _hover={{ textDecoration: 'underline' }}
                    display="block"
                  >
                    {t('Transaction:')} {result.txHash.slice(0, 10)}...{result.txHash.slice(-8)}
                  </Link>
                </Box>
              ),
              status: 'success',
              duration: 10000,
              isClosable: true,
              position: isMobile ? 'top' : 'bottom-right',
            })
            console.log('Follow operation (single):', result.txHash)
          }

          // Start refresh process for follow
          // For follow, we can be more confident that the state should be true
          setIsFollowing(true) // Optimistic update
          // refreshFollowState() // Start background refresh
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
        !irlAttestations.some((item) => {
          if (typeof item === 'string') {
            return item.toLowerCase() === targetAddress
          } else if (item && typeof item === 'object' && item.address) {
            return item.address.toLowerCase() === targetAddress
          }
          return false
        })
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

  if (!router.isReady || !address || typeof address !== 'string' || !eventId) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" p={4}>
        <Text>{t('Loading...')}</Text>
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
                {isFollowing ? t('Unfollow on EFP') : t('Follow on EFP')}
              </Button>
            )}

            {/* View on EFP Button */}
            <Link href={getEFPProfileUrl(address)} isExternal>
              <Button leftIcon={<ArrowUpRight />} variant="outline" size="md" w="100%">
                {t('View EFP Profile')}
              </Button>
            </Link>

            <Divider />

            {/* IRL Meeting Attestation Button - Only show when code parameter is present */}
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
                    showAttestationImage &&
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
