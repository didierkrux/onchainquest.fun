import { Box, Button, Card, CardBody, Heading, Image, Text } from '@chakra-ui/react'
import { useAccount, useDisconnect } from 'wagmi'
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export default function Profile() {
  const { address } = useAccount()
  // const [ensName, setEnsName] = useState('')
  const { disconnect } = useDisconnect()

  // useEffect(() => {
  //   if (address) {
  //     fetch(`https://ensdata.net/${address}`)
  //       .then((res) => res.json())
  //       .then((data) => {
  //         setEnsName(data.ens)
  //       })
  //   }
  // }, [address])

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
        <Text>Click the "Connect" button to connect your wallet</Text>
      </Box>
    )
  else {
    return (
      <Box display="flex" flexDirection="column" alignItems="center">
        <Card maxW="600px">
          <CardBody>
            <Box display="flex" justifyContent="center" flexDirection="column" alignItems="center">
              <Box fontSize={['2xl', '4xl']} fontWeight="bold" mb={4}>
                didier
                <Text as="span" color="gray.500">
                  .onchainquest.fun
                </Text>
                {/* {ensName && ` | ${ensName}`} */}
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
              {/* <Heading as="h2" size="md" mb={1}>
                Address:
              </Heading>
              <Text>{address}</Text> */}
              <Image src={qrCodeDataURL} w="40%" h="auto" alt="QR" ml={8} />
            </Box>
            <Box display="flex" justifyContent="space-around" alignItems="center">
              <Text fontSize="3xl" color="gray.300">
                [mentor]
              </Text>
              <Box display="flex" alignItems="center">
                <Heading fontSize="3xl">Score:</Heading>
                <Text fontSize="3xl">100 ⭐️</Text>
              </Box>
            </Box>
          </CardBody>
        </Card>
        <Box mt={4}>
          <Button onClick={() => disconnect()}>Disconnect</Button>
        </Box>
      </Box>
    )
  }
}
