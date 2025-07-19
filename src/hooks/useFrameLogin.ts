import { useEffect, useCallback, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useLoginToFrame } from '@privy-io/react-auth/farcaster'
import { createWalletError, type HookError } from 'utils/wallet'

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

export function useFrameLogin() {
  const { ready, authenticated, user } = usePrivy()
  const { initLoginToFrame, loginToFrame } = useLoginToFrame()
  const [isFrameContext, setIsFrameContext] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [error, setError] = useState<HookError | null>(null)
  const [hasAttemptedAutoLogin, setHasAttemptedAutoLogin] = useState(false)

  // Check if we're in a Frame context
  useEffect(() => {
    const checkFrameContext = async () => {
      try {
        const sdk = await loadFrameSDK()
        if (sdk) {
          const context = await sdk.context
          setIsFrameContext(!!context)
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Not in Frame context:', err)
        }
        setIsFrameContext(false)
      }
    }
    checkFrameContext()
  }, [])

  // Auto-login to Frame when ready and not authenticated (only on first page load)
  useEffect(() => {
    if (ready && !authenticated && isFrameContext && !hasAttemptedAutoLogin) {
      setHasAttemptedAutoLogin(true)

      const performAutoLogin = async () => {
        try {
          setIsLoggingIn(true)
          setError(null)
          
          const sdk = await loadFrameSDK()
          if (!sdk) {
            throw new Error('Frame SDK not available')
          }

          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 Starting automatic Frame login...')
          }
          
          // Initialize login to frame
          const { nonce } = await initLoginToFrame()
          
          // Sign in with Frame SDK
          const result = await sdk.actions.signIn({ nonce })
          
          // Complete login with Privy
          await loginToFrame({
            message: result.message,
            signature: result.signature,
          })
          
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Frame login completed successfully')
          }
        } catch (err) {
          console.error('❌ Frame login failed:', err)
          setError(createWalletError(
            err instanceof Error ? err.message : 'Frame login failed',
            'FRAME_LOGIN_ERROR',
            err
          ))
        } finally {
          setIsLoggingIn(false)
        }
      }

      performAutoLogin()
    }
  }, [ready, authenticated, isFrameContext, hasAttemptedAutoLogin, initLoginToFrame, loginToFrame])

  // Manual login function
  const loginToFrameManually = useCallback(async () => {
    if (!isFrameContext) {
      setError(createWalletError('Not in Frame context', 'FRAME_CONTEXT_ERROR'))
      return
    }

    try {
      setIsLoggingIn(true)
      setError(null)
      
      const sdk = await loadFrameSDK()
      if (!sdk) {
        throw new Error('Frame SDK not available')
      }

      const { nonce } = await initLoginToFrame()
      const result = await sdk.actions.signIn({ nonce })
      await loginToFrame({
        message: result.message,
        signature: result.signature,
      })
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Manual Frame login completed')
      }
    } catch (err) {
      console.error('❌ Manual Frame login failed:', err)
      setError(createWalletError(
        err instanceof Error ? err.message : 'Manual Frame login failed',
        'MANUAL_FRAME_LOGIN_ERROR',
        err
      ))
    } finally {
      setIsLoggingIn(false)
    }
  }, [isFrameContext, initLoginToFrame, loginToFrame])

  return {
    isFrameContext,
    isLoggingIn,
    error,
    loginToFrameManually,
    ready,
    authenticated,
    user
  }
} 
