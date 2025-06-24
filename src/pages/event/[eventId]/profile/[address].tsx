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
} from '@phosphor-icons/react'
import { useAccount, useWalletClient } from 'wagmi'
import { ethers } from 'ethers'
import {
  getEFPProfile,
  isFollowing as checkIsFollowing,
  followAddressOnEFP,
  unfollowAddressOnEFP,
  isFollowingOnChain,
  getEFPProfileUrl,
} from 'utils/efp'

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
  const { address: userAddress } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { onCopy, hasCopied } = useClipboard((address as string) || '')

  useEffect(() => {
    if (!address || typeof address !== 'string') {
      setQrCodeDataURL('')
      setIsLoading(false)
      return
    }

    QRCode.toDataURL(address, {
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
  }, [address, t, toast, isMobile])

  // Check if user is following this address
  useEffect(() => {
    if (!userAddress || !address || typeof address !== 'string') return

    const checkFollowStatus = async () => {
      try {
        // Only use API check to avoid wallet prompts on page load
        const following = await checkIsFollowing(userAddress, address)
        setIsFollowing(following)
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

      // Check current on-chain status when user clicks the button
      let currentOnChainStatus = false
      try {
        currentOnChainStatus = await isFollowingOnChain(signer, address)
        console.log('Current on-chain follow status:', currentOnChainStatus)
      } catch (error) {
        console.log('Could not check on-chain status, using API status:', error)
        currentOnChainStatus = isFollowing // Use the API status as fallback
      }

      // Try on-chain operation
      try {
        if (currentOnChainStatus) {
          // Unfollow
          const txHash = await unfollowAddressOnEFP(signer, address)
          setIsFollowing(false)
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
          // Follow
          const txHash = await followAddressOnEFP(signer, address)
          setIsFollowing(true)
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
        const action = currentOnChainStatus ? 'unfollow' : 'follow'
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
              {t('Scan this QR code to get the wallet address')}
            </Text>
          </Box>
        </CardBody>
      </Card>
    </Box>
  )
}
