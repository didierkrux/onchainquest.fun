import { Box, Heading, Text, Image, CardBody, Card, Button, useToast } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useAccount, useSignMessage } from 'wagmi'
import { useLocalStorage } from 'usehooks-ts'
import { verifyMessage } from 'viem'
import { useState } from 'react'

import LanguageSwitch from 'components/LanguageSwitch'
import { Event } from 'entities/data'
import { adminSignatureMessage, adminWallets } from 'config'

export default function Agenda({ event }: { event: Event }) {
  const { t } = useTranslation()
  const { address } = useAccount()
  const [adminSignature, setAdminSignature] = useLocalStorage('admin-signature', '')
  const { signMessageAsync } = useSignMessage()
  const [isSyncing, setIsSyncing] = useState(false)
  const toast = useToast()

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
            description: 'Data synced successfully. Refresh the page manually to see the changes.',
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

  return (
    <Box>
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
            <Button
              onClick={handleSyncData}
              isLoading={isSyncing}
              loadingText="Syncing... (~30sec)"
              colorScheme="red"
            >
              Sync data from Notion
            </Button>
          ) : (
            <Button onClick={handleAdminSignature} colorScheme="red">
              Verify admin signature
            </Button>
          )}
        </Box>
      )}
      <Box display="flex" alignItems="center" gap={4} mb={4}>
        <Text>Select language:</Text>
        <LanguageSwitch />
      </Box>
      <Heading as="h1">{t('Agenda')}</Heading>
      {event.agenda.map((item, index) => (
        <Card mt={4} key={index}>
          <CardBody display="flex" justifyContent="space-between" alignItems="center" gap={4}>
            <Box>
              <Text as="h2" fontWeight="bold">
                {item.time}
              </Text>
              <Text as="h3">{item.title}</Text>
              <Text as="h3" mb={4}>
                📍 {item.location}
              </Text>
            </Box>
          </CardBody>
        </Card>
      ))}
      <Heading as="h1" mt={4}>
        {t('Sponsors')}
      </Heading>
      {event.sponsors.map((sponsor, index) => (
        <Card mt={4} key={index}>
          <CardBody display="flex" justifyContent="space-between" alignItems="center" gap={4}>
            <Box>
              <a href={sponsor.link}>
                <Image h="60px" src={sponsor.image} alt={sponsor.name} />
              </a>
              <Text as="h3">{sponsor.description}</Text>
            </Box>
          </CardBody>
        </Card>
      ))}
    </Box>
  )
}
