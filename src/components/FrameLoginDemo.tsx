import { useEffect, useState } from 'react'
import { Box, Button, Text, VStack, HStack, Spinner, Alert, AlertIcon } from '@chakra-ui/react'
import { usePrivy } from '@privy-io/react-auth'
import { useLoginToFrame } from '@privy-io/react-auth/farcaster'
import { useFrameLogin } from 'hooks/useFrameLogin'

// Dynamic import for frame-sdk to avoid SSR issues
let frameSdk = null
const loadFrameSDK = async () => {
  if (!frameSdk) {
    try {
      const frameModule = await import('@farcaster/frame-sdk')
      frameSdk = frameModule.default
    } catch (error) {
      console.error('Failed to load Frame SDK:', error)
      return null
    }
  }
  return frameSdk
}

export default function FrameLoginDemo() {
  const { ready, authenticated, user, createWallet, linkWallet } = usePrivy()
  const { initLoginToFrame, loginToFrame } = useLoginToFrame()
  const { isFrameContext, isLoggingIn, error, loginToFrameManually } = useFrameLogin()
  
  // UI state
  const [context, setContext] = useState<any>()
  const [isFrameContextOpen, setIsFrameContextOpen] = useState(false)
  const [isPrivyUserObjectOpen, setIsPrivyUserObjectOpen] = useState(false)
  const [isSDKLoaded, setIsSDKLoaded] = useState(false)

  // Initialize the frame SDK
  useEffect(() => {
    const load = async () => {
      const sdk = await loadFrameSDK()
      if (sdk) {
        setContext(await sdk.context)
        sdk.actions.ready({})
        setIsSDKLoaded(true)
      }
    }
    if (!isSDKLoaded) {
      load()
    }
  }, [isSDKLoaded])

  const closeFrame = () => {
    if (frameSdk) {
      frameSdk.actions.close()
    }
  }

  const toggleFrameContext = () => {
    setIsFrameContextOpen((prev) => !prev)
  }

  const togglePrivyUserObject = () => {
    setIsPrivyUserObjectOpen((prev) => !prev)
  }

  if (!ready || !isSDKLoaded) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Spinner size="lg" color="blue.500" />
      </Box>
    )
  }

  return (
    <Box
      w="360px"
      mx="auto"
      py={4}
      px={2}
      display="flex"
      flexDirection="column"
      justifyContent="center"
      minH="100vh"
    >
      <VStack spacing={4} align="stretch">
        <Text fontSize="2xl" fontWeight="bold" textAlign="start">
          Frame Login Demo
          <br />
          with Privy
        </Text>

        {/* Frame Context Section */}
        <Box>
          <Button
            onClick={toggleFrameContext}
            variant="ghost"
            size="sm"
            leftIcon={<Text fontSize="xs">{isFrameContextOpen ? '▼' : '▶'}</Text>}
          >
            <Text fontSize="lg" fontWeight="bold">
              Frame Context
            </Text>
          </Button>

          {isFrameContextOpen && (
            <Box p={4} mt={2} bg="gray.100" borderRadius="lg">
              <Text
                fontSize="xs"
                fontFamily="mono"
                whiteSpace="pre-wrap"
                wordBreak="break-word"
                maxW="260px"
                overflowX="auto"
              >
                {JSON.stringify(context, null, 2)}
              </Text>
            </Box>
          )}
        </Box>

        {/* Privy User Object Section */}
        <Box>
          <Button
            onClick={togglePrivyUserObject}
            variant="ghost"
            size="sm"
            leftIcon={<Text fontSize="xs">{isPrivyUserObjectOpen ? '▼' : '▶'}</Text>}
          >
            <Text fontSize="lg" fontWeight="bold">
              Privy User
            </Text>
          </Button>

          {isPrivyUserObjectOpen && (
            <Box p={4} mt={2} bg="gray.100" borderRadius="lg">
              <Text
                fontSize="xs"
                fontFamily="mono"
                whiteSpace="pre-wrap"
                wordBreak="break-word"
                maxW="260px"
                overflowX="auto"
              >
                {JSON.stringify(user, null, 2)}
              </Text>
            </Box>
          )}
        </Box>

        {/* Status Information */}
        <VStack spacing={2} align="stretch">
          <Text fontSize="lg" fontWeight="bold">
            Status
          </Text>
          <HStack justify="space-between">
            <Text>Frame Context:</Text>
            <Text color={isFrameContext ? 'green.500' : 'red.500'}>
              {isFrameContext ? '✅ Detected' : '❌ Not Detected'}
            </Text>
          </HStack>
          <HStack justify="space-between">
            <Text>Authenticated:</Text>
            <Text color={authenticated ? 'green.500' : 'red.500'}>
              {authenticated ? '✅ Yes' : '❌ No'}
            </Text>
          </HStack>
          <HStack justify="space-between">
            <Text>Ready:</Text>
            <Text color={ready ? 'green.500' : 'red.500'}>{ready ? '✅ Yes' : '❌ No'}</Text>
          </HStack>
        </VStack>

        {/* Error Display */}
        {error && (
          <Alert status="error">
            <AlertIcon />
            <Text fontSize="sm">{error.message}</Text>
          </Alert>
        )}

        {/* Action Buttons */}
        <VStack spacing={2}>
          {isFrameContext && !authenticated && (
            <Button
              onClick={loginToFrameManually}
              isLoading={isLoggingIn}
              disabled={isLoggingIn}
              colorScheme="blue"
              width="full"
            >
              {isLoggingIn ? 'Logging in...' : 'Login to Frame'}
            </Button>
          )}

          {authenticated && (
            <Button onClick={linkWallet} variant="outline" width="full">
              Connect External Wallet
            </Button>
          )}

          {isFrameContext && (
            <Button onClick={closeFrame} variant="outline" width="full">
              Close Frame
            </Button>
          )}
        </VStack>

        {/* User Info */}
        {authenticated && user && (
          <Box p={4} bg="blue.50" borderRadius="lg">
            <Text fontSize="sm" fontWeight="bold" mb={2}>
              User Info:
            </Text>
            <Text fontSize="xs">ID: {user.id}</Text>
            <Text fontSize="xs">Email: {user.email?.address || 'No email'}</Text>
            <Text fontSize="xs">
              Wallets: {user.linkedAccounts.filter((acc) => acc.type === 'wallet').length}
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  )
} 
