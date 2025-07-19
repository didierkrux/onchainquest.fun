import { Box, Text, Button, VStack, HStack } from '@chakra-ui/react'
import { useWalletAccount, useWalletDisconnect } from 'hooks/useWallet'
import { PROJECT_WALLET_TYPE } from 'config'

export default function WalletStatus() {
  const { address, isConnected, chainId } = useWalletAccount()
  const { disconnect } = useWalletDisconnect()

  if (!isConnected) {
    return (
      <Box p={4} border="1px" borderColor="gray.200" borderRadius="md">
        <Text>Wallet not connected</Text>
        <Text fontSize="sm" color="gray.500">
          Provider: {PROJECT_WALLET_TYPE}
        </Text>
      </Box>
    )
  }

  return (
    <Box p={4} border="1px" borderColor="green.200" borderRadius="md" bg="green.50">
      <VStack align="start" spacing={2}>
        <Text fontWeight="bold">Wallet Connected</Text>
        <Text fontSize="sm">Provider: {PROJECT_WALLET_TYPE}</Text>
        <Text fontSize="sm">Address: {address}</Text>
        <Text fontSize="sm">Chain ID: {chainId}</Text>
        <HStack>
          <Button size="sm" onClick={() => disconnect()}>
            Disconnect
          </Button>
        </HStack>
      </VStack>
    </Box>
  )
} 
