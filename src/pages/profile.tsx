import { Box, Button, Card, CardBody, Heading, Image, Input, Text } from '@chakra-ui/react'
import { useAccount, useDisconnect } from 'wagmi'
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { useTranslation } from 'react-i18next'

import { Profile } from 'entities/profile'
import { displayName } from 'utils/index'

export default function Profile() {
  const { t } = useTranslation()
  const { address } = useAccount()
  const [profile, setProfile] = useState<Profile | null>(null)
  const { disconnect } = useDisconnect()

  const [username, setUsername] = useState('')

  const saveProfile = () => {
    fetch(`/api/profile?address=${address}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username }),
    })
      .then((res) => res.json())
      .then((data) => {
        setProfile(data)
      })
      .catch((error) => {
        console.error('Error saving profile:', error)
      })
  }

  useEffect(() => {
    if (address) {
      fetch(`/api/profile?address=${address}`)
        .then((res) => res.json())
        .then((data) => {
          setProfile(data)
        })
    }
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

  // redirect to /
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
          <Box display="flex" gap={4}>
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
        <Box mt={4}>
          <Button onClick={() => disconnect()}>{t('Disconnect')}</Button>
        </Box>
      </Box>
    )
  }
}
