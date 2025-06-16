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
  FormControl,
  FormLabel,
  Switch,
  Link,
  Divider,
} from '@chakra-ui/react'
import { useAccount, useDisconnect, useSignMessage, useBalance } from 'wagmi'
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
} from '@phosphor-icons/react'
import { useRouter } from 'next/router'
import { DynamicWidget } from '@dynamic-labs/sdk-react-core'

import { Profile } from 'entities/profile'
import { profileName, profileAvatar, profileRole } from 'utils/index'
import { adminSignatureMessage, adminWallets, ENS_DOMAIN } from 'config'
import { Avatar } from 'components/Avatar'
import SelectTab from 'components/SelectTab'

export default function ProfilePage() {
  const { t, i18n } = useTranslation()
  const { address } = useAccount()
  const { data: balanceData } = useBalance({ address })
  const router = useRouter()
  const { eventId } = router.query
  const [profile, setProfile] = useLocalStorage<Profile | null>(`profile-${eventId}`, null)
  const { disconnect } = useDisconnect()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [avatar, setAvatar] = useState('')
  const [avatarEmoji, setAvatarEmoji] = useState('')
  const [role, setRole] = useState<'explorer' | 'mentor'>('explorer')
  const [isResetting, setIsResetting] = useState(false)
  const toast = useToast()
  const [adminSignature, setAdminSignature] = useLocalStorage('admin-signature', '')
  const { signMessageAsync } = useSignMessage()
  const [isSyncing, setIsSyncing] = useState(false)
  const { onCopy, hasCopied } = useClipboard(profile?.address || '')
  const [isMobile] = useMediaQuery('(max-width: 1024px)')
  const isSocialCronActive = profile?.isSocialCronActive || false
  const [usdValue, setUsdValue] = useState<number | null>(null)

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
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [address, eventId])

  useEffect(() => {
    if (balanceData) {
      const ethValue = Number(balanceData?.value.toString()) / 10 ** 18
      fetch(`https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd`)
        .then((res) => res.json())
        .then((data) => {
          const ethToUsd = data.ethereum.usd
          setUsdValue(ethValue * ethToUsd)
        })
        .catch((error) => {
          console.error('Error fetching USD value:', error)
        })
    }
  }, [balanceData])

  const [qrCodeDataURL, setQrCodeDataURL] = useState('')

  useEffect(() => {
    if (!address) {
      setQrCodeDataURL('')
      return
    }

    QRCode.toDataURL(address, {
      type: 'image/png',
      color: { dark: '#000000' },
    })
      .then((url: string) => {
        setQrCodeDataURL(url)
      })
      .catch((err: any) => {
        console.error('Error generating QR code:', err)
      })
  }, [address])

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
        // Refresh the profile after resetting
        setProfile(null)
        disconnect()
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
      const signature = await signMessageAsync({ message: adminSignatureMessage })
      if (address) {
        const isValid = await verifyMessage({
          address,
          message: adminSignatureMessage,
          signature,
        })
        if (isValid) {
          setAdminSignature(signature)
        }
      }
    } catch (error) {
      console.error('Error signing message:', error)
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

  if (!address) return <Box display="flex" flexDirection="column" alignItems="center"></Box>
  else {
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
                  <DynamicWidget />
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
                </CardBody>
              </Card>
            </Box>
            <Box w="100%" maxW="600px">
              <Heading as="h1">{t('Update Profile')}</Heading>
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
                              const newValue = e.target.value?.replaceAll(avatarEmoji, '')
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
                    <Button onClick={handleAdminSignature} colorScheme="red" leftIcon={<LockKey />}>
                      Verify signature
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
                    <Link href={`/event/${eventId === '1' ? '2' : '1'}`}>
                      <Button
                        whiteSpace="nowrap"
                        colorScheme="red"
                        leftIcon={<ArrowsLeftRight />}
                        onClick={() => {
                          // force changing language to english before switching event
                          i18n.changeLanguage('en')
                        }}
                      >
                        switch event
                      </Button>
                    </Link>
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
