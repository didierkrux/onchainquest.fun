import { Box, Button, Heading, Image, Text } from '@chakra-ui/react'
import { useAccount, useDisconnect } from 'wagmi'
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export default function Profile() {
  const { address } = useAccount()
  const [ensName, setEnsName] = useState('')
  const { disconnect } = useDisconnect()

  useEffect(() => {
    if (address) {
      fetch(`https://ensdata.net/${address}`)
        .then((res) => res.json())
        .then((data) => {
          setEnsName(data.ens)
        })
    }
  }, [address])

  const [qrCodeDataURL, setQrCodeDataURL] = useState('')

  useEffect(() => {
    if (!address) {
      setQrCodeDataURL('')
      return
    }

    QRCode.toDataURL(address, { type: 'image/png' })
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
      <Box>
        <w3m-button />
      </Box>
    )
  else {
    return (
      <Box>
        <Heading as="h1">Profile: {ensName}</Heading>
        <Box>
          <Image src={`https://ensdata.net/media/avatar/${address}`} />
          <Heading as="h2">Address:</Heading>
          <Text as="h3">{address}</Text>
          <Image src={qrCodeDataURL} alt="QR" />
        </Box>
        <Box>
          <Heading as="h2">Points:</Heading>
          <Text as="h3">100</Text>
        </Box>
        <Box mt={4}>
          <Button onClick={() => disconnect()}>Disconnect</Button>
        </Box>
      </Box>
    )
  }
}
