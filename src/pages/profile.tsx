import {
  Box,
  Button,
  Card,
  CardBody,
  Heading,
  Image,
  Input,
  Text,
  useToast,
} from '@chakra-ui/react'
import { useAccount, useDisconnect, useSignMessage } from 'wagmi'
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { useTranslation } from 'react-i18next'
import { useLocalStorage } from 'usehooks-ts'
import { verifyMessage } from 'viem'

import { Profile } from 'entities/profile'
import { displayName } from 'utils/index'
import { adminSignatureMessage, adminWallets } from 'config'

export default function Profile() {
  const { t } = useTranslation()
  const { address } = useAccount()
  const [profile, setProfile] = useLocalStorage<Profile | null>('profile', null)
  const { disconnect } = useDisconnect()
  const [username, setUsername] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const toast = useToast()
  const [adminSignature, setAdminSignature] = useLocalStorage('admin-signature', '')
  const { signMessageAsync } = useSignMessage()
  const [isSyncing, setIsSyncing] = useState(false)

  const saveProfile = () => {
    fetch(`/api/profile?address=${address}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, taskId: 1 }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('data', data)
        if (data?.message) {
          toast({
            title: 'Error',
            description: ` ${data?.message}`,
            status: 'error',
            duration: 5000,
            isClosable: true,
          })
        } else {
          setProfile(data)
        }
      })
      .catch((error) => {
        console.error('Error saving profile:', error)
        toast({
          title: 'Error',
          description: ` ${(error as Error).message}`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      })
  }

  const fetchProfile = () => {
    if (address) {
      fetch(`/api/profile?address=${address}`)
        .then((res) => res.json())
        .then((data) => {
          setProfile(data)
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
          title: 'Success',
          description: 'Profile reset successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        })
        // Refresh the profile after resetting
        disconnect()
      } else {
        const data = await response.json()
        throw new Error(`Failed to reset profile: ${data.message}`)
      }
    } catch (error) {
      console.error('Error resetting profile:', error)
      toast({
        title: 'Error',
        description: ` ${(error as Error).message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
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
            title: 'Success',
            description: 'Data synced successfully.',
            status: 'success',
            duration: 5000,
            isClosable: true,
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
        title: 'Error',
        description: ` ${(error as Error).message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsSyncing(false)
    }
  }

  if (!address)
    return (
      <Box display="flex" flexDirection="column" alignItems="center">
        <Text>{t('Click the "Connect" button to connect your wallet.')}</Text>
      </Box>
    )
  else {
    return (
      <Box display="flex" flexDirection="column" alignItems="center">
        {profile && !profile?.username && (
          <Box display="flex" gap={4} mb={4} alignItems="center">
            <Text>Username: </Text>
            <Input
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Button onClick={saveProfile}>Save</Button>
          </Box>
        )}
        {profile && profile?.address && (
          <Card maxW="600px">
            <CardBody>
              <Box
                display="flex"
                justifyContent="center"
                flexDirection="column"
                alignItems="center"
              >
                <Box fontSize={['2xl', '4xl']} fontWeight="bold" mb={4}>
                  {displayName(profile)}
                </Box>
              </Box>
              <Box m={4} display="flex" justifyContent="center">
                <Image
                  src={`https://ensdata.net/media/avatar/${address}`}
                  mb={2}
                  w="40%"
                  h="auto"
                  borderRadius="full"
                />
                <Image src={qrCodeDataURL} w="40%" h="auto" alt="QR" ml={8} />
              </Box>
              <Box display="flex" justifyContent="space-around" alignItems="center">
                <Text fontSize="3xl" color="gray.300">
                  {profile?.role}
                </Text>
                <Box display="flex" alignItems="center">
                  <Heading fontSize="3xl">
                    {t('Score')}: {profile?.score} ⭐️
                  </Heading>
                </Box>
              </Box>
            </CardBody>
          </Card>
        )}
        <Box mt={4} display="flex" gap={4} mb={4}>
          <Button onClick={() => disconnect()}>{t('Disconnect')}</Button>
          <Button
            onClick={handleResetProfile}
            isLoading={isResetting}
            loadingText="Resetting..."
            colorScheme="red"
          >
            Reset my profile & disconnect
          </Button>
        </Box>
        {address && adminWallets.includes(address.toLowerCase()) && (
          <Box
            display="flex"
            alignItems="center"
            gap={4}
            border="1px solid red"
            p={4}
            borderRadius="md"
            justifyContent="center"
            mb={4}
          >
            <Text>Admin functions:</Text>
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
                  Sync data from Notion
                </Button>
              </Box>
            ) : (
              <Button onClick={handleAdminSignature} colorScheme="red">
                Verify admin signature
              </Button>
            )}
          </Box>
        )}
      </Box>
    )
  }
}
