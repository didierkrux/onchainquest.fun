import { useEffect, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useLoginToFrame } from '@privy-io/react-auth/farcaster'
import { Box, Spinner, Text } from '@chakra-ui/react'

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

interface FrameLoginProviderProps {
  children: React.ReactNode
}

export default function FrameLoginProvider({ children }: FrameLoginProviderProps) {
  const { ready, authenticated, user, createWallet } = usePrivy()
  const { initLoginToFrame, loginToFrame } = useLoginToFrame()
  const [isFrameContext, setIsFrameContext] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if we're in a Frame context
  useEffect(() => {
    const checkFrameContext = async () => {
      try {
        const sdk = await loadFrameSDK()
        if (sdk) {
          const context = await sdk.context
          setIsFrameContext(!!context)
          console.log('🔍 Frame context detected:', !!context)
        }
      } catch (err) {
        console.log('📱 Not in Frame context:', err)
        setIsFrameContext(false)
      }
    }
    checkFrameContext()
  }, [])

  // Auto-login to Frame when ready and not authenticated
  useEffect(() => {
    if (ready && !authenticated && isFrameContext) {
      const performAutoLogin = async () => {
        try {
          setIsLoggingIn(true)
          setError(null)
          
          const sdk = await loadFrameSDK()
          if (!sdk) {
            throw new Error('Frame SDK not available')
          }

          console.log('🔄 Starting automatic Frame login...')
          
          // Initialize login to frame
          const { nonce } = await initLoginToFrame()
          console.log('✅ Nonce generated for Frame login')
          
          // Sign in with Frame SDK
          const result = await sdk.actions.signIn({ nonce })
          console.log('✅ Frame sign-in completed')
          
          // Complete login with Privy
          await loginToFrame({
            message: result.message,
            signature: result.signature,
          })
          
          console.log('✅ Frame login completed successfully')
        } catch (err) {
          console.error('❌ Frame login failed:', err)
          setError(err instanceof Error ? err.message : 'Frame login failed')
        } finally {
          setIsLoggingIn(false)
        }
      }

      performAutoLogin()
    }
  }, [ready, authenticated, isFrameContext, initLoginToFrame, loginToFrame])

  // Create embedded wallet for authenticated users without wallets
  useEffect(() => {
    if (
      authenticated &&
      ready &&
      user &&
      user.linkedAccounts.filter(
        (account) =>
          account.type === 'wallet' && account.walletClientType === 'privy',
      ).length === 0
    ) {
      console.log('🔧 Creating embedded wallet for user...')
      createWallet()
    }
  }, [authenticated, ready, user, createWallet])

  // Show loading state during Frame login
  if (isFrameContext && isLoggingIn) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100vh"
        backgroundColor="#fbf5ee"
      >
        <Spinner size="lg" color="blue.500" mb={4} />
        <Text fontSize="lg" color="gray.600">
          Logging into Frame...
        </Text>
        {error && (
          <Text fontSize="sm" color="red.500" mt={2}>
            {error}
          </Text>
        )}
      </Box>
    )
  }

  return <>{children}</>
} 
