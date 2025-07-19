import {
  Box,
  Button,
  Card,
  CardBody,
  Heading,
  Image,
  Input,
  Text,
  useClipboard,
  useToast,
  useMediaQuery,
  Link,
  Divider,
} from '@chakra-ui/react'
import {
  useWalletAccount,
  useWalletDisconnect,
  useWalletBalance,
  useWalletSignMessage,
} from 'hooks/wallet'
import { useFundWallet } from '@privy-io/react-auth'
import { usePrivy } from '@privy-io/react-auth'
import { useLinkAccount } from '@privy-io/react-auth'
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { useTranslation } from 'react-i18next'
import { useLocalStorage } from 'usehooks-ts'
import { verifyMessage } from 'viem'
import twemoji from '@twemoji/api'
import {
  ArrowsClockwise,
  ArrowsLeftRight,
  Check,
  CopySimple,
  LockKey,
  SignOut,
  Star,
  Trash,
  Ticket,
  QrCode,
  Key,
} from '@phosphor-icons/react'
import { useRouter } from 'next/router'

import { QRScanner } from 'components/QRScanner'

import { Profile } from 'entities/profile'
import { profileName, profileAvatar, profileRole } from 'utils/index'
import { adminSignatureMessage, adminWallets, ENS_DOMAIN, eventId as EVENT_ID } from 'config'
import { Avatar } from 'components/Avatar'
import SelectTab from 'components/SelectTab'
import ZupassProof from 'components/ZupassProof'
import WalletConnectButton from 'components/WalletConnectButton'

export default function ProfilePage() {
  const { t, i18n } = useTranslation()
  const { address, isConnected } = useWalletAccount()
  const { data: balanceData } = useWalletBalance(address)
  const router = useRouter()
  const { eventId } = router.query
  const [profile, setProfile] = useLocalStorage<Profile | null>(`profile-${eventId}`, null)
  const { disconnect } = useWalletDisconnect()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [avatar, setAvatar] = useState('')
  const [avatarEmoji, setAvatarEmoji] = useState('')
  const [role, setRole] = useState<'explorer' | 'mentor'>('explorer')
  const [isResetting, setIsResetting] = useState(false)
  const toast = useToast()
  const [adminSignature, setAdminSignature] = useLocalStorage('admin-signature', '')
  const { signMessageAsync } = useWalletSignMessage()

  const [isSyncing, setIsSyncing] = useState(false)
  const { onCopy, hasCopied } = useClipboard(profile?.address || '')
  const [isMobile] = useMediaQuery('(max-width: 1024px)')
  const isSocialCronActive = profile?.isSocialCronActive || false
  const [usdValue, setUsdValue] = useState<number | null>(null)
  const [isGeneratingTickets, setIsGeneratingTickets] = useState(false)
  const [ticketCount, setTicketCount] = useState('10')
  const [scannedTicket, setScannedTicket] = useState<string | null>(null)
  const [ticketCodeInput, setTicketCodeInput] = useState('')
  const [isProcessingTicket, setIsProcessingTicket] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const { fundWallet } = useFundWallet()
  const { exportWallet } = usePrivy()
  const { linkPasskey } = useLinkAccount()
  const [isFunding, setIsFunding] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isLinkingPasskey, setIsLinkingPasskey] = useState(false)

  const saveProfile = () => {
    if (!eventId) return
    setIsSaving(true)
    fetch(`/api/profile?address=${address}&eventId=${eventId}&taskId=1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, avatar, role }),
    })
      .then((res) => res.json().then((data) => ({ status: res.status, data })))
      .then(({ status, data }) => {
        console.log('data', data)
        let feedbackType: 'success' | 'warning' | 'error' = 'error'
        if (status === 200) {
          setProfile(data)
          feedbackType = 'success'
        } else if (status === 400) {
          feedbackType = 'warning'
        }
        toast({
          title:
            feedbackType === 'success'
              ? t('Success')
              : feedbackType === 'warning'
                ? t('Warning')
                : t('Error'),
          description:
            feedbackType === 'success' ? t('Profile saved successfully.') : ` ${data?.message}`,
          status: feedbackType,
          duration: 10000,
          isClosable: true,
          position: isMobile ? 'top' : 'bottom-right',
        })
      })
      .finally(() => {
        setIsSaving(false)
      })
      .catch((error) => {
        console.error('Error saving profile:', error)
        setIsSaving(false)
        toast({
          title: t('Error'),
          description: ` ${(error as Error).message}`,
          status: 'error',
          duration: 10000,
          isClosable: true,
          position: isMobile ? 'top' : 'bottom-right',
        })
      })
  }

  const fetchProfile = () => {
    if (address && eventId) {
      fetch(`/api/profile?address=${address}&eventId=${eventId}`)
        .then((res) => res.json())
        .then((data) => {
          setProfile(data)
          setUsername(data?.username || '')
          setEmail(data?.email || '')
          setAvatar(data?.avatar || '')
          if (data?.avatar?.includes('twemoji')) {
            // Extract emoji code from URL
            const emojiCode = data?.avatar.split('/').pop()?.split('.').shift()
            if (emojiCode) {
              // Convert hex code to actual emoji
              const emoji = String.fromCodePoint(
                ...emojiCode.split('-').map((code: any) => parseInt(code, 16))
              )
              setAvatarEmoji(emoji)
            }
          }
          setRole(data?.role || 'explorer')
        })
        .catch((error) => {
          console.error('Error fetching profile:', error)
        })
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [address, eventId])

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const handleSignatureSuccess = async (signature: string) => {
    try {
      if (!address) return

      console.log('🔍 Signature verification debug:', {
        address,
        message: adminSignatureMessage,
        signature,
        signatureLength: signature.length,
        signatureStartsWith0x: signature.startsWith('0x'),
      })

      const isValid = await verifyMessage({
        address,
        message: adminSignatureMessage,
        signature: signature as `0x${string}`,
      })

      console.log('🔍 Signature verification result:', isValid)

      if (isValid) {
        setAdminSignature(signature)
        toast({
          title: t('Success'),
          description: t('Signature verified successfully'),
          status: 'success',
          duration: 5000,
          isClosable: true,
          position: isMobile ? 'top' : 'bottom-right',
        })
      } else {
        toast({
          title: t('Error'),
          description: 'Signature verification failed',
          status: 'error',
          duration: 10000,
          isClosable: true,
          position: isMobile ? 'top' : 'bottom-right',
        })
      }
    } catch (error) {
      console.error('Error verifying signature:', error)
      toast({
        title: t('Error'),
        description: `Failed to verify signature: ${(error as Error).message}`,
        status: 'error',
        duration: 10000,
        isClosable: true,
        position: isMobile ? 'top' : 'bottom-right',
      })
    }
  }

  // Handle hash navigation to scroll to specific sections
  useEffect(() => {
    if (profile && router.asPath.includes('#')) {
      const hash = router.asPath.split('#')[1]
      if (hash === 'profile') {
        // Small delay to ensure the element is rendered
        setTimeout(() => {
          const element = document.getElementById('profile')
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 100)
      }
    }
  }, [profile, router.asPath])

  useEffect(() => {
    if (balanceData) {
      const ethValue = Number(balanceData?.value.toString()) / 10 ** 18
      const fetchUsdValue = async () => {
        try {
          const res = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd`
          )
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`)
          }
          const data = await res.json()
          if (data && data.ethereum && data.ethereum.usd) {
            const ethToUsd = data.ethereum.usd
            setUsdValue(ethValue * ethToUsd)
          } else {
            console.warn('Invalid data format from CoinGecko API')
            setUsdValue(null)
          }
        } catch (error) {
          if (error instanceof Error && error.message.includes('429')) {
            console.error(
              'CoinGecko API rate limit exceeded (429 Too Many Requests). Please try again later.'
            )
          } else {
            console.error('Error fetching USD value:', error)
          }
          setUsdValue(null)
        }
      }
      fetchUsdValue()
    }
  }, [balanceData])

  const [qrCodeDataURL, setQrCodeDataURL] = useState('')

  useEffect(() => {
    if (!address) {
      setQrCodeDataURL('')
      return
    }

    // Determine what to encode in the QR code
    let qrCodeContent: string = address

    // If user has an associated ticket, use the ticket URL instead
    if (profile?.associatedTickets && profile.associatedTickets.length > 0) {
      const ticketCode = profile.associatedTickets[0].code // Use the first ticket
      qrCodeContent = `https://onchainquest.fun/api/ticket/${ticketCode}?eventId=${eventId}`
    }

    QRCode.toDataURL(qrCodeContent, {
      type: 'image/png',
      color: { dark: '#000000' },
    })
      .then((url: string) => {
        setQrCodeDataURL(url)
      })
      .catch((err: any) => {
        console.error('Error generating QR code:', err)
      })
  }, [address, profile?.associatedTickets, eventId])

  const handleResetProfile = async () => {
    if (!address || !eventId) return

    setIsResetting(true)
    try {
      const response = await fetch(
        `/api/admin/reset-my-profile?address=${address}&eventId=${eventId}`
      )
      if (response.ok) {
        toast({
          title: t('Success'),
          description: t('Profile reset successfully.'),
          status: 'success',
          duration: 10000,
          isClosable: true,
          position: isMobile ? 'top' : 'bottom-right',
        })
        // Refresh the profile after resetting to get latest data
        fetchProfile()
      } else {
        const data = await response.json()
        throw new Error(`Failed to reset profile: ${data.message}`)
      }
    } catch (error) {
      console.error('Error resetting profile:', error)
      toast({
        title: t('Error'),
        description: ` ${(error as Error).message}`,
        status: 'error',
        duration: 10000,
        isClosable: true,
        position: isMobile ? 'top' : 'bottom-right',
      })
    } finally {
      setIsResetting(false)
    }
  }

  const handleAdminSignature = async () => {
    try {
      if (!address) return

      // Get signature using signMessageAsync
      const signatureResult = await signMessageAsync(adminSignatureMessage)
      // Handle both string and object signatures
      const signature =
        typeof signatureResult === 'string' ? signatureResult : signatureResult.signature

      await handleSignatureSuccess(signature)
    } catch (error) {
      console.error('Error signing message:', error)
      toast({
        title: t('Error'),
        description: `Failed to sign message: ${(error as Error).message}`,
        status: 'error',
        duration: 10000,
        isClosable: true,
        position: isMobile ? 'top' : 'bottom-right',
      })
    }
  }

  const toggleSocialCron = async (isSocialCronActive: boolean) => {
    if (!address || !adminSignature || !eventId) return
    console.log('toggleSocialCron', isSocialCronActive)

    try {
      fetch(`/api/admin/toggle-social-cron`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address, isSocialCronActive, adminSignature, eventId }),
      })
        .then((res) => res.json())
        .then(() => {
          setProfile((prevProfile) => {
            if (prevProfile) {
              return {
                ...prevProfile,
                isSocialCronActive,
              }
            }
            return prevProfile
          })
        })
    } catch (error) {
      console.error('Error toggling social cron:', error)
    }
  }

  const handleSyncData = async () => {
    if (!address || !adminSignature || !eventId) return

    setIsSyncing(true)
    try {
      const isValid = await verifyMessage({
        address,
        message: adminSignatureMessage,
        signature: adminSignature as `0x${string}`,
      })

      if (isValid) {
        const response = await fetch(
          `/api/admin/sync-data?signature=${adminSignature}&address=${address}&eventId=${eventId}`
        )
        if (response.ok) {
          toast({
            title: t('Success'),
            description: t('Data synced successfully.'),
            status: 'success',
            duration: 10000,
            isClosable: true,
            position: isMobile ? 'top' : 'bottom-right',
          })
        } else {
          const data = await response.json()
          throw new Error(`Failed to sync data: ${data.message}`)
        }
      } else {
        // reset admin signature
        setAdminSignature('')
        throw new Error('Invalid signature')
      }
    } catch (error) {
      console.error('Error syncing data:', error)
      toast({
        title: t('Error'),
        description: ` ${(error as Error).message}`,
        status: 'error',
        duration: 10000,
        isClosable: true,
        position: isMobile ? 'top' : 'bottom-right',
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleAvatarChange = (emoji: string) => {
    const emojiUrl = twemoji.parse(emoji, {
      folder: 'svg',
      ext: '.svg',
    })
    // Extract the URL from the parsed HTML
    const parsedUrl = emojiUrl.match(/src="([^"]+)"/)?.[1] || ''
    if (parsedUrl || emoji === '') {
      setAvatarEmoji(emoji)
      setAvatar(parsedUrl)
    }
  }

  const tabLabels = [`${t('Explorer')} 🧑‍🎓`, `${t('Mentor')} 🧑‍🏫`]
  const selectedRoleIndex = role === 'mentor' ? 1 : 0

  const handleGenerateTickets = async () => {
    if (!address || !adminSignature || !eventId) return

    setIsGeneratingTickets(true)
    try {
      const isValid = await verifyMessage({
        address,
        message: adminSignatureMessage,
        signature: adminSignature as `0x${string}`,
      })

      if (isValid) {
        const response = await fetch('/api/admin/generate-tickets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            address,
            signature: adminSignature,
            eventId,
            count: parseInt(ticketCount),
          }),
        })

        if (response.ok) {
          const data = await response.json()
          toast({
            title: t('Success'),
            description: `${data.message}. Generated: ${data.tickets.join(', ')}`,
            status: 'success',
            duration: 15000,
            isClosable: true,
            position: isMobile ? 'top' : 'bottom-right',
          })
        } else {
          const data = await response.json()
          throw new Error(`Failed to generate tickets: ${data.message}`)
        }
      } else {
        setAdminSignature('')
        throw new Error('Invalid signature')
      }
    } catch (error) {
      console.error('Error generating tickets:', error)
      toast({
        title: t('Error'),
        description: ` ${(error as Error).message}`,
        status: 'error',
        duration: 10000,
        isClosable: true,
        position: isMobile ? 'top' : 'bottom-right',
      })
    } finally {
      setIsGeneratingTickets(false)
    }
  }

  const handleTicketScan = async (result: string) => {
    if (!address || !eventId) return

    try {
      // Extract ticket code from the scanned URL
      // Expected format: /api/ticket/K9M2X7?eventId=3
      const urlParts = result.split('/')
      const ticketCode = urlParts[urlParts.length - 1]?.split('?')[0]

      if (!ticketCode) {
        toast({
          title: t('Error'),
          description: t('Invalid ticket QR code format'),
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: isMobile ? 'top' : 'bottom-right',
        })
        return
      }

      await processTicketCode(ticketCode)
    } catch (error) {
      console.error('Error scanning ticket:', error)
      toast({
        title: t('Error'),
        description: t('Failed to process ticket scan'),
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: isMobile ? 'top' : 'bottom-right',
      })
    }
  }

  const handleTicketCodeSubmit = async () => {
    const cleanedCode = ticketCodeInput.replace(/\s/g, '')
    if (cleanedCode.length === 6) {
      await processTicketCode(cleanedCode)
      setTicketCodeInput('') // Clear input after submission
    } else {
      toast({
        title: t('Error'),
        description: t('Please enter a 6-character ticket code'),
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: isMobile ? 'top' : 'bottom-right',
      })
    }
  }

  const processTicketCode = async (ticketCode: string) => {
    if (!address || !eventId) return

    setIsProcessingTicket(true)
    try {
      // Validate the ticket
      const validationResponse = await fetch(`/api/ticket/${ticketCode}?eventId=${eventId}`)
      const validationData = await validationResponse.json()

      if (!validationData.valid) {
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

      // Associate ticket with user
      const associateResponse = await fetch('/api/associate-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          eventId,
          ticketCode,
        }),
      })

      const associateData = await associateResponse.json()

      if (associateResponse.ok) {
        setScannedTicket(ticketCode)
        toast({
          title: t('Success'),
          description: t('Ticket {{ticketCode}} successfully associated with your profile', {
            ticketCode,
          }),
          status: 'success',
          duration: 5000,
          isClosable: true,
          position: isMobile ? 'top' : 'bottom-right',
        })
        // Refresh profile to show updated ticket info
        fetchProfile()
      } else {
        toast({
          title: t('Error'),
          description: associateData.message || t('Failed to associate ticket'),
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: isMobile ? 'top' : 'bottom-right',
        })
      }
    } catch (error) {
      console.error('Error processing ticket code:', error)
      toast({
        title: t('Error'),
        description: t('Failed to process ticket code'),
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: isMobile ? 'top' : 'bottom-right',
      })
    } finally {
      setIsProcessingTicket(false)
    }
  }

  const handleFundWallet = async () => {
    if (!address) return

    setIsFunding(true)
    try {
      await fundWallet(address)
      toast({
        title: t('Success'),
        description: t('Wallet funding initiated successfully'),
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: isMobile ? 'top' : 'bottom-right',
      })
    } catch (error) {
      console.error('Error funding wallet:', error)
      toast({
        title: t('Error'),
        description: (error as Error).message || t('Failed to fund wallet'),
        status: 'error',
        duration: 10000,
        isClosable: true,
        position: isMobile ? 'top' : 'bottom-right',
      })
    } finally {
      setIsFunding(false)
    }
  }

  const handleExportWallet = async () => {
    if (!address) return

    setIsExporting(true)
    try {
      const exportedWallet = await exportWallet()
      toast({
        title: t('Success'),
        description: t('Wallet exported successfully'),
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: isMobile ? 'top' : 'bottom-right',
      })
      console.log('Exported wallet:', exportedWallet)
    } catch (error) {
      console.error('Error exporting wallet:', error)
      toast({
        title: t('Error'),
        description: (error as Error).message || t('Failed to export wallet'),
        status: 'error',
        duration: 10000,
        isClosable: true,
        position: isMobile ? 'top' : 'bottom-right',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleLinkPasskey = async () => {
    if (!address) return

    setIsLinkingPasskey(true)
    try {
      await linkPasskey()
      toast({
        title: t('Success'),
        description: t('Passkey linked successfully'),
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: isMobile ? 'top' : 'bottom-right',
      })
    } catch (error) {
      console.error('Error linking passkey:', error)
      toast({
        title: t('Error'),
        description: (error as Error).message || t('Failed to link passkey'),
        status: 'error',
        duration: 10000,
        isClosable: true,
        position: isMobile ? 'top' : 'bottom-right',
      })
    } finally {
      setIsLinkingPasskey(false)
    }
  }

  // Show loading state while Privy is initializing
  if (!address && isConnected === undefined) {
    console.log('🔍 Privy still initializing, showing loading state')
    return (
      <Box display="flex" flexDirection="column" alignItems="center" p={8}>
        <Text fontSize="xl" fontWeight="bold" mb={4}>
          Loading...
        </Text>
        <Text fontSize="sm" color="gray.500">
          Initializing wallet connection
        </Text>
      </Box>
    )
  }

  if (!address) {
    console.log('🔍 Rendering empty state - no address')
    return (
      <Box display="flex" flexDirection="column" alignItems="center" p={8}>
        <Text fontSize="xl" fontWeight="bold" mb={4}>
          No wallet connected
        </Text>
        <Text fontSize="sm" color="gray.500" mb={4}>
          Please connect your wallet to view your profile
        </Text>
        <Box display="flex" flexDirection="column" gap={4} alignItems="center">
          <Text fontSize="sm" color="gray.600" textAlign="center">
            You are logged in but need to connect a wallet or create an embedded wallet
          </Text>
          <Box display="flex" gap={3} flexWrap="wrap" justifyContent="center">
            <WalletConnectButton variant="solid" size="lg">
              Connect Wallet to View Profile
            </WalletConnectButton>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                console.log('🔍 Manual disconnect clicked')
                disconnect()
              }}
              colorScheme="red"
            >
              Disconnect & Start Over
            </Button>
          </Box>
          <Text fontSize="xs" color="gray.400" textAlign="center">
            Choose &quot;Connect Wallet&quot; to connect an existing wallet or create an embedded
            wallet, or &quot;Disconnect&quot; to start fresh
          </Text>
          <Text fontSize="xs" color="blue.500" textAlign="center">
            💡 Tip: If you don&apos;t have a wallet, the &quot;Connect Wallet&quot; button will
            create one for you automatically!
          </Text>
        </Box>
      </Box>
    )
  } else {
    return (
      <Box display="flex" flexDirection="column" alignItems="center">
        {profile && profile?.address && (
          <Box>
            <Box>
              <Heading as="h1">{t('Profile Card')}</Heading>
              <Card maxW="600px" w="100%" mt={4} mb={4}>
                <CardBody>
                  <Box
                    display="flex"
                    justifyContent="center"
                    flexDirection="column"
                    alignItems="center"
                  >
                    <Box
                      fontSize={['xl', '3xl']}
                      fontWeight="bold"
                      mb={4}
                      display="flex"
                      flexDirection="column"
                      justifyContent="center"
                      alignItems="center"
                      gap={2}
                    >
                      <Box
                        display={'flex'}
                        w="100%"
                        justifyContent="space-between"
                        alignItems="center"
                        flex="1"
                      >
                        <Text display="flex" alignItems="center" noOfLines={1}>
                          {profileName(profile)} {profileRole({ ...profile, role })}
                        </Text>
                        <Box display="flex" justifyContent="flex-end" flexShrink={0} pl={4}>
                          {profile?.score && profile?.score > 0 && (
                            <Text display="flex" alignItems="end" fontSize="2xl" fontWeight="bold">
                              <Box display="flex" alignItems="center" color="purple.300" ml={1}>
                                <Box display="inline" mr={1}>
                                  {profile?.score}
                                </Box>
                                <Star weight="fill" size={24} />
                              </Box>
                            </Text>
                          )}
                        </Box>
                      </Box>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Text fontSize={['2xs', 'sm']} color="gray.500">
                          {profile?.address}
                        </Text>
                        {hasCopied ? (
                          <Check width={20} />
                        ) : (
                          <CopySimple width={20} onClick={onCopy} cursor="pointer" />
                        )}
                      </Box>
                    </Box>
                  </Box>
                  <Box m={4} display="flex" justifyContent="center">
                    <Avatar src={profileAvatar(profile)} width="40%" />
                    <Image src={qrCodeDataURL} w="40%" h="auto" alt="QR" ml={8} />
                  </Box>
                  {balanceData && Number(balanceData?.value.toString()) / 10 ** 18 !== 0 && (
                    <Box display="flex" alignItems="center" gap={2} justifyContent="center">
                      <Text fontSize={['2xs', 'sm']} color="gray.500" fontWeight="bold">
                        {t('Balance')}:{' '}
                        {(Number(balanceData?.value.toString()) / 10 ** 18).toFixed(8)}{' '}
                        {t('ETH on Base')} {usdValue && `(~$${usdValue.toFixed(2)} USD)`}
                      </Text>
                    </Box>
                  )}

                  {/* Fund Wallet Section */}
                  {address && (
                    <Box display="flex" flexDirection="column" gap={2} alignItems="center" mt={4}>
                      <Text fontSize="sm" color="gray.600" textAlign="center">
                        {t('Need funds for transactions?')}
                      </Text>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        onClick={handleFundWallet}
                        isLoading={isFunding}
                        loadingText={t('Funding...')}
                        leftIcon={<ArrowsClockwise />}
                      >
                        {t('Fund My Wallet')}
                      </Button>
                    </Box>
                  )}

                  {/* Export Wallet Section */}
                  {address && (
                    <Box display="flex" flexDirection="column" gap={2} alignItems="center" mt={4}>
                      <Text fontSize="sm" color="gray.600" textAlign="center">
                        {t('Export your wallet for backup?')}
                      </Text>
                      <Button
                        size="sm"
                        colorScheme="orange"
                        onClick={handleExportWallet}
                        isLoading={isExporting}
                        loadingText={t('Exporting...')}
                        leftIcon={<ArrowsLeftRight />}
                      >
                        {t('Export Wallet')}
                      </Button>
                    </Box>
                  )}

                  {/* Link Passkey Section */}
                  {address && (
                    <Box display="flex" flexDirection="column" gap={2} alignItems="center" mt={4}>
                      <Text fontSize="sm" color="gray.600" textAlign="center">
                        {t('Link a passkey for secure access?')}
                      </Text>
                      <Button
                        size="sm"
                        colorScheme="green"
                        onClick={handleLinkPasskey}
                        isLoading={isLinkingPasskey}
                        loadingText={t('Linking...')}
                        leftIcon={<Key />}
                      >
                        {t('Link Passkey')}
                      </Button>
                    </Box>
                  )}
                </CardBody>
              </Card>
            </Box>

            {/* Ticket Association Section */}
            <Box w="100%" maxW="600px" mb={4}>
              <Heading as="h2" size="md">
                {t('Event Ticket')}
              </Heading>
              <Card mt={4}>
                <CardBody>
                  <Box display="flex" flexDirection="column" gap={4} alignItems="center">
                    {profile?.associatedTickets && profile.associatedTickets.length > 0 ? (
                      // User already has an associated ticket
                      <Box display="flex" flexDirection="column" gap={3} w="100%">
                        <Text textAlign="center" color="gray.600" mb={2}>
                          {t('Your associated ticket for this event')}
                        </Text>
                        {profile.associatedTickets.map((ticket, index) => (
                          <Box
                            key={index}
                            p={4}
                            bg={ticket.is_used ? 'green.50' : 'blue.50'}
                            borderRadius="md"
                            border="1px solid"
                            borderColor={ticket.is_used ? 'green.200' : 'blue.200'}
                            display="flex"
                            flexDirection="column"
                            gap={3}
                          >
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Box>
                                <Text fontWeight="bold" fontSize="xl" fontFamily="mono">
                                  {ticket.code}
                                </Text>
                                <Text fontSize="sm" color="gray.600">
                                  {ticket.is_used ? t('Used') : t('Available')}
                                </Text>
                              </Box>
                              {ticket.is_used && ticket.used_at && (
                                <Text fontSize="xs" color="gray.500">
                                  {new Date(ticket.used_at).toLocaleDateString()}
                                </Text>
                              )}
                            </Box>

                            {/* Display attestation if available */}
                            {ticket.attestation_tx_link &&
                              (() => {
                                const txHash = ticket.attestation_tx_link.split('/').pop()
                                if (txHash) {
                                  return (
                                    <Box display="flex" flexDirection="column" gap={2}>
                                      <Text fontSize="sm" fontWeight="medium" color="purple.600">
                                        {t('Event attendance onchain attestation')} -{' '}
                                        <Link
                                          href={`https://base.easscan.org/attestation/view/${txHash}`}
                                          isExternal
                                          color="blue.500"
                                          fontSize="sm"
                                          _hover={{ textDecoration: 'underline' }}
                                        >
                                          {t('View proof on EAS Scan')}
                                        </Link>
                                      </Text>
                                      <Box display="flex" alignItems="center" gap={3}>
                                        <Link
                                          href={`https://base.easscan.org/attestation/view/${txHash}`}
                                          isExternal
                                        >
                                          <Image
                                            src={`https://base.easscan.org/attestation/preview/${txHash}.png`}
                                            alt="EAS Attestation"
                                            borderRadius="md"
                                            w="100%"
                                            h="auto"
                                            objectFit="contain"
                                          />
                                        </Link>
                                      </Box>
                                    </Box>
                                  )
                                }
                                return null
                              })()}
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      // User doesn't have an associated ticket yet
                      <>
                        <Text textAlign="center" color="gray.600">
                          {t(
                            'Scan the ticket QR code from your bracelet to associate it with your profile'
                          )}
                        </Text>

                        {scannedTicket && (
                          <Box
                            p={3}
                            bg="green.50"
                            borderRadius="md"
                            border="1px solid"
                            borderColor="green.200"
                            textAlign="center"
                          >
                            <Text color="green.700" fontWeight="bold">
                              {t('Ticket Associated')}: {scannedTicket}
                            </Text>
                          </Box>
                        )}

                        <Box display="flex" flexDirection="column" alignItems="center" gap={4}>
                          <QRScanner
                            buttonLabel={t('Scan Event Ticket')}
                            onScan={handleTicketScan}
                          />
                          <Text fontWeight="bold" color="gray.500">
                            - OR -
                          </Text>
                          <Box display="flex" alignItems="center" gap={4}>
                            <input
                              type="text"
                              value={ticketCodeInput}
                              onChange={(e) =>
                                setTicketCodeInput(e.target.value.replace(/\s/g, '').toUpperCase())
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
                              onClick={handleTicketCodeSubmit}
                              isDisabled={
                                ticketCodeInput.replace(/\s/g, '').length !== 6 ||
                                isProcessingTicket
                              }
                              isLoading={isProcessingTicket}
                              loadingText={t('Processing...')}
                            >
                              {t('Submit')}
                            </Button>
                          </Box>
                        </Box>
                      </>
                    )}
                  </Box>
                </CardBody>
              </Card>
            </Box>

            {/* Zupass Section */}
            {eventId === '3' && (
              <Box w="100%" maxW="600px" mb={4}>
                <Heading as="h2" size="md">
                  {t('Zupass Verification')}
                </Heading>
                <Card mt={4}>
                  <CardBody>
                    <Box display="flex" flexDirection="column" gap={4} alignItems="center">
                      <ZupassProof />
                    </Box>
                  </CardBody>
                </Card>
              </Box>
            )}

            <Box id="profile" w="100%" maxW="600px">
              <Heading as="h1">{t('Profile')}</Heading>
              <Card mt={4} mb={4}>
                <CardBody>
                  <Box display="flex" flexDirection="column" gap={4} maxW="400px" mx="auto">
                    {profile?.subname || profile?.basename ? (
                      <Box display="flex" gap={4} mb={4} alignItems="center">
                        <Text>{t('ENS: ')}</Text>
                        <Text>
                          {profile?.subname ? (
                            <a
                              href={`https://app.ens.domains/${profile?.subname}.${ENS_DOMAIN}`}
                              target="_blank"
                            >
                              <Text>{`${profile?.subname}.${ENS_DOMAIN}`}</Text>
                            </a>
                          ) : (
                            <a
                              href={`https://www.base.org/name/${profile?.basename?.split('.')[0]}`}
                              target="_blank"
                            >
                              <Text>{profile?.basename}</Text>
                            </a>
                          )}
                        </Text>
                      </Box>
                    ) : (
                      <Box display="flex" gap={4} mb={4} alignItems="center">
                        <Text>{t('Username: ')}</Text>
                        <Input
                          placeholder="Choose a username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                        />
                      </Box>
                    )}
                    {profile?.subname && !username && (
                      <Box display="flex" gap={4} mb={4} alignItems="center">
                        <Text>{t('Username: ')}</Text>
                        <Input
                          placeholder="Choose a username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                        />
                      </Box>
                    )}
                    <Box display="flex" gap={4} mb={4} alignItems="center">
                      <Text>{t('Avatar: ')}</Text>
                      {profile?.basename_avatar ? (
                        <a
                          href={`https://www.base.org/name/${profile?.basename?.split('.')[0]}`}
                          target="_blank"
                        >
                          <Avatar src={profile?.basename_avatar} />
                        </a>
                      ) : (
                        <>
                          <Input
                            placeholder="Enter an emoji"
                            value={avatarEmoji}
                            w="150px"
                            textAlign="center"
                            onChange={(e) => {
                              const newValue = e.target.value?.replace(
                                new RegExp(avatarEmoji, 'g'),
                                ''
                              )
                              if (newValue !== '') {
                                handleAvatarChange(newValue)
                              }
                            }}
                          />
                          {avatar && <Avatar src={avatar} />}
                        </>
                      )}
                    </Box>
                    <Box display="flex" gap={4} mb={4} alignItems="center" minH="42px">
                      <Text>{t('Role: ')}</Text>
                      <SelectTab
                        tabLabels={tabLabels}
                        selectedIndex={selectedRoleIndex}
                        onTabChange={(index: number) =>
                          setRole(index === 0 ? 'explorer' : 'mentor')
                        }
                      />
                    </Box>
                    {!profile?.emailOK && (
                      <Box mb={4}>
                        <Divider my={2} />
                        <Text mb="2" fontSize="sm">
                          {t(
                            'Stay in the loop! Enter your email to receive the latest event updates and resources from the organizers.'
                          )}
                        </Text>
                        <Box gap={4} display="flex" alignItems="center">
                          <Text>{t('Email: ')}</Text>
                          <Input
                            placeholder={t('Enter your email')}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </Box>
                      </Box>
                    )}
                    <Box display="flex" justifyContent="center">
                      <Button
                        onClick={saveProfile}
                        isLoading={isSaving}
                        loadingText="Saving..."
                        w="100%"
                      >
                        {profile?.tasks?.[1]?.isCompleted ? t('Update') : t('Setup')}
                      </Button>
                    </Box>
                  </Box>
                </CardBody>
              </Card>
            </Box>
          </Box>
        )}
        {address && adminWallets.includes(address.toLowerCase()) && (
          <Box w="100%" maxW="600px">
            <Heading as="h1">Admin</Heading>
            <Card mt={4} mb={4} bg="red.100" color="black">
              <CardBody
                display="flex"
                flexDirection="column"
                gap={4}
                alignItems="center"
                justifyContent="center"
              >
                <Box display="flex" alignItems="center" gap={4} justifyContent="center">
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href="https://www.notion.so/banklessacademy/37a9e401c55747d29af74e5d4d9f5c5b?v=6ab88582bf3e4b0d9b6a11cc9a70df36"
                  >
                    <Text>Notion CMS</Text>
                  </a>
                  {adminSignature ? (
                    <Box display="flex" gap={4}>
                      <Button
                        onClick={handleSyncData}
                        isLoading={isSyncing}
                        loadingText="Syncing... (~10sec)"
                        colorScheme="red"
                        leftIcon={<ArrowsClockwise />}
                      >
                        Sync Notion data
                      </Button>
                    </Box>
                  ) : (
                    <Button
                      onClick={handleAdminSignature}
                      colorScheme="red"
                      leftIcon={<LockKey />}
                      isDisabled={!isHydrated}
                    >
                      {isHydrated ? 'Verify signature' : 'Loading...'}
                    </Button>
                  )}
                </Box>
                {/* {adminSignature && (
                  <Box display="flex" alignItems="center" gap={4}>
                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="social-cron" mb="0">
                        Social cron
                      </FormLabel>
                      <Switch
                        id="social-cron"
                        isChecked={isSocialCronActive}
                        onChange={() => toggleSocialCron(!isSocialCronActive)}
                      />
                    </FormControl>
                    <Box>
                      <Link href="/api/cron/socials?force=true" isExternal>
                        <Text whiteSpace="nowrap">Manual sync</Text>
                      </Link>
                    </Box>
                  </Box>
                )} */}
                {adminSignature && (
                  <Box display="flex" alignItems="center" gap={4}>
                    {Array.from({ length: EVENT_ID }, (_, i) => i + 1).map(
                      (eventIdLoop) =>
                        eventIdLoop !== Number(eventId) && (
                          <Link href={`/event/${eventIdLoop}`} key={eventIdLoop}>
                            <Button colorScheme="red" leftIcon={<ArrowsLeftRight />}>
                              event {eventIdLoop}
                            </Button>
                          </Link>
                        )
                    )}
                  </Box>
                )}
                {adminSignature && (
                  <Box display="flex" alignItems="center" gap={4}>
                    <Link href={`/event/${eventId}/tickets`}>
                      <Button colorScheme="blue" leftIcon={<Ticket />}>
                        View Tickets
                      </Button>
                    </Link>
                    <Link href={`/event/${eventId}/booth`}>
                      <Button colorScheme="green" leftIcon={<QrCode />}>
                        View Booths
                      </Button>
                    </Link>
                  </Box>
                )}
                {adminSignature && (
                  <Box display="flex" alignItems="center" gap={4}>
                    <Input
                      placeholder="Number of tickets"
                      value={ticketCount}
                      onChange={(e) => setTicketCount(e.target.value)}
                      w="150px"
                      type="number"
                      min="1"
                      max="100"
                    />
                    <Button
                      onClick={handleGenerateTickets}
                      isLoading={isGeneratingTickets}
                      loadingText="Generating..."
                      colorScheme="red"
                      leftIcon={<Ticket />}
                    >
                      Generate tickets
                    </Button>
                  </Box>
                )}
                <Button
                  onClick={handleResetProfile}
                  isLoading={isResetting}
                  loadingText="Resetting..."
                  colorScheme="red"
                  leftIcon={<Trash />}
                >
                  {t('Reset my profile')}
                </Button>
                {adminSignature && (
                  <Button
                    onClick={() => setAdminSignature('')}
                    colorScheme="orange"
                    leftIcon={<SignOut />}
                  >
                    Reset Signature
                  </Button>
                )}
              </CardBody>
            </Card>
          </Box>
        )}
        {profile && profile?.address && (
          <Box mt={4} display="flex" gap={4}>
            <Button
              onClick={() => {
                setProfile(null)
                disconnect()
              }}
              leftIcon={<SignOut />}
            >
              {t('Disconnect')}
            </Button>
          </Box>
        )}
      </Box>
    )
  }
}
