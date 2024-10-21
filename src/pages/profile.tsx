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
} from '@chakra-ui/react'
import { useAccount, useDisconnect, useSignMessage } from 'wagmi'
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { useTranslation } from 'react-i18next'
import { useLocalStorage } from 'usehooks-ts'
import { verifyMessage } from 'viem'
import twemoji from '@twemoji/api'
import { Check, CopySimple } from '@phosphor-icons/react'

import { Profile } from 'entities/profile'
import { profileName, profileAvatar, profileRole } from 'utils/index'
import { adminSignatureMessage, adminWallets } from 'config'
import { Avatar } from 'components/Avatar'
import SelectTab from 'components/SelectTab'

export default function Profile() {
  const { t } = useTranslation()
  const { address } = useAccount()
  const [profile, setProfile] = useLocalStorage<Profile | null>('profile', null)
  const { disconnect } = useDisconnect()
  const [username, setUsername] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [avatar, setAvatar] = useState('')
  const [avatarEmoji, setAvatarEmoji] = useState('')
  const [role, setRole] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const toast = useToast()
  const [adminSignature, setAdminSignature] = useLocalStorage('admin-signature', '')
  const { signMessageAsync } = useSignMessage()
  const [isSyncing, setIsSyncing] = useState(false)
  const { onCopy, hasCopied } = useClipboard(profile?.address || '')
  const [isMobile] = useMediaQuery('(max-width: 48em)')

  const saveProfile = () => {
    setIsSaving(true)
    fetch(`/api/profile?address=${address}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, avatar, role, taskId: 1 }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('data', data)
        if (data?.message) {
          toast({
            title: t('Error'),
            description: ` ${data?.message}`,
            status: 'error',
            duration: 10000,
            isClosable: true,
            position: isMobile ? 'top' : 'bottom-right',
          })
        } else {
          setProfile(data)
          toast({
            title: t('Success'),
            description: t('Profile saved successfully.'),
            status: 'success',
            duration: 10000,
            isClosable: true,
            position: isMobile ? 'top' : 'bottom-right',
          })
        }
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
    if (address) {
      fetch(`/api/profile?address=${address}`)
        .then((res) => res.json())
        .then((data) => {
          setProfile(data)
          setUsername(data?.username || '')
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
          setRole(data?.role || 'learner')
        })
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [address])

  const [qrCodeDataURL, setQrCodeDataURL] = useState('')

  useEffect(() => {
    if (!address) {
      setQrCodeDataURL('')
      return
    }

    QRCode.toDataURL(address, { type: 'image/png', color: { dark: '#ffffff', light: '#fffff00' } })
      .then((url: string) => {
        setQrCodeDataURL(url)
      })
      .catch((err: any) => {
        console.error('Error generating QR code:', err)
      })
  }, [address])

  const handleResetProfile = async () => {
    if (!address) return

    setIsResetting(true)
    try {
      const response = await fetch(`/api/admin/reset-my-profile?address=${address}`)
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
        disconnect()
        setProfile(null)
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

  const handleSyncData = async () => {
    if (!address || !adminSignature) return

    setIsSyncing(true)
    try {
      const isValid = await verifyMessage({
        address,
        message: adminSignatureMessage,
        signature: adminSignature as `0x${string}`,
      })

      if (isValid) {
        const response = await fetch(
          `/api/admin/sync-data?signature=${adminSignature}&address=${address}`
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

  const tabLabels = [`${t('Learner')} 🧑‍🎓`, `${t('Mentor')} 🧑‍🏫`]
  const selectedIndex = role === 'mentor' ? 1 : 0

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
                      fontSize={['2xl', '4xl']}
                      fontWeight="bold"
                      mb={4}
                      display="flex"
                      flexDirection="column"
                      justifyContent="center"
                      alignItems="center"
                      gap={2}
                    >
                      {profileName(profile)} {profileRole({ ...profile, role })}
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
                  <Box display="flex" justifyContent="space-around" alignItems="center">
                    <Box display="flex" alignItems="center">
                      <Heading fontSize="3xl">
                        {t('Score')}: {profile?.score} ⭐️
                      </Heading>
                    </Box>
                  </Box>
                </CardBody>
              </Card>
            </Box>
            <Box w="100%" maxW="600px">
              <Heading as="h1">{t('Update Profile')}</Heading>
              <Card mt={4} mb={4}>
                <CardBody>
                  <Box display="flex" flexDirection="column" gap={4} maxW="400px" mx="auto">
                    <Box display="flex" gap={4} mb={4} alignItems="center">
                      <Text>{t('Username: ')}</Text>
                      {profile?.basename ? (
                        <a
                          href={`https://www.base.org/name/${profile?.basename?.split('.')[0]}`}
                          target="_blank"
                        >
                          <Text>{profile?.basename}</Text>
                        </a>
                      ) : (
                        <Input
                          placeholder="Choose a username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                        />
                      )}
                    </Box>
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
                      {role !== '' ? (
                        <SelectTab
                          tabLabels={tabLabels}
                          selectedIndex={selectedIndex}
                          onTabChange={(index: number) =>
                            setRole(index === 0 ? 'learner' : 'mentor')
                          }
                        />
                      ) : null}
                    </Box>
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
              <CardBody>
                <Box display="flex" alignItems="center" gap={4} justifyContent="center">
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href="https://www.notion.so/banklessacademy/37a9e401c55747d29af74e5d4d9f5c5b?v=6ab88582bf3e4b0d9b6a11cc9a70df36"
                  >
                    Notion CMS
                  </a>
                  {adminSignature ? (
                    <Box display="flex" gap={4}>
                      <Button
                        onClick={handleSyncData}
                        isLoading={isSyncing}
                        loadingText="Syncing... (~30sec)"
                        colorScheme="red"
                      >
                        Sync Notion data
                      </Button>
                    </Box>
                  ) : (
                    <Button onClick={handleAdminSignature} colorScheme="red">
                      Verify signature
                    </Button>
                  )}
                </Box>
              </CardBody>
            </Card>
          </Box>
        )}
        {profile && profile?.address && (
          <Box mt={4} display="flex" gap={4}>
            <Button
              onClick={() => {
                disconnect()
                setProfile(null)
              }}
            >
              {t('Disconnect')}
            </Button>
            <Button
              onClick={handleResetProfile}
              isLoading={isResetting}
              loadingText="Resetting..."
              colorScheme="red"
            >
              {t('Reset my profile')}
            </Button>
          </Box>
        )}
      </Box>
    )
  }
}
