import { Box, Button, Heading, Image } from '@chakra-ui/react'
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
          console.log(data)
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
          <Box>Address: {address}</Box>
        </Box>
        <Box>
          <h2>Points:</h2>
          <h3>100</h3>
        </Box>
        <Image src={qrCodeDataURL} alt="QR" />
        <Box>
          <Button onClick={() => disconnect()}>Disconnect</Button>
        </Box>
      </Box>
    )
  }
}
