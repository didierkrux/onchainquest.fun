import { Box, Text, Button, Flex, Spinner, Badge } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useFarcasterWallet } from 'hooks/useFarcasterWallet'
import { Wallet, CheckCircle, Warning } from '@phosphor-icons/react'

export default function MiniAppWalletStatus() {
  const { t } = useTranslation()
  const { isConnected, address, isMiniApp, isLoading, error, connectWallet } = useFarcasterWallet()

  // Only show in Mini App context
  if (!isMiniApp) {
    return null
  }

  if (isLoading) {
    return (
      <Box
        bg="blue.50"
        border="1px solid"
        borderColor="blue.200"
        borderRadius="lg"
        p={3}
        mb={4}
      >
        <Flex align="center" gap={2}>
          <Spinner size="sm" color="blue.500" />
          <Text fontSize="sm" color="blue.700">
            {t('Connecting to Farcaster wallet...')}
          </Text>
        </Flex>
      </Box>
    )
  }

  if (error) {
    return (
      <Box
        bg="red.50"
        border="1px solid"
        borderColor="red.200"
        borderRadius="lg"
        p={3}
        mb={4}
      >
        <Flex align="center" gap={2}>
          <Warning size={20} color="#E53E3E" />
          <Text fontSize="sm" color="red.700">
            {t('Wallet connection error:')} {error}
          </Text>
        </Flex>
        <Button
          size="sm"
          colorScheme="red"
          variant="outline"
          mt={2}
          onClick={connectWallet}
        >
          {t('Retry Connection')}
        </Button>
      </Box>
    )
  }

  if (isConnected && address) {
    return (
      <Box
        bg="green.50"
        border="1px solid"
        borderColor="green.200"
        borderRadius="lg"
        p={3}
        mb={4}
      >
        <Flex align="center" justify="space-between">
          <Flex align="center" gap={2}>
            <CheckCircle size={20} color="#38A169" />
            <Box>
              <Text fontSize="sm" fontWeight="bold" color="green.700">
                {t('Farcaster Wallet Connected')}
              </Text>
              <Text fontSize="xs" color="green.600" fontFamily="mono">
                {address.slice(0, 6)}...{address.slice(-4)}
              </Text>
            </Box>
          </Flex>
          <Badge colorScheme="green" variant="subtle">
            {t('Ready')}
          </Badge>
        </Flex>
      </Box>
    )
  }

  return (
    <Box
      bg="orange.50"
      border="1px solid"
      borderColor="orange.200"
      borderRadius="lg"
      p={3}
      mb={4}
    >
      <Flex align="center" justify="space-between">
        <Flex align="center" gap={2}>
          <Wallet size={20} color="#DD6B20" />
          <Text fontSize="sm" color="orange.700">
            {t('Connect your Farcaster wallet to start')}
          </Text>
        </Flex>
        <Button
          size="sm"
          colorScheme="orange"
          onClick={connectWallet}
        >
          {t('Connect Wallet')}
        </Button>
      </Flex>
    </Box>
  )
} 
