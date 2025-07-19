import { useEffect, useState } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import { useFarcasterWallet } from 'hooks/useFarcasterWallet'

interface MiniAppSDKProps {
  children: React.ReactNode
}

export default function MiniAppSDK({ children }: MiniAppSDKProps) {
  const [isMiniApp, setIsMiniApp] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const { isConnected, address, isMiniApp: isFarcasterMiniApp, isLoading, error } = useFarcasterWallet()

  useEffect(() => {
    // Check if we're running in a Farcaster Mini App context
    const checkMiniAppContext = async () => {
      try {
        // Check if we're in a Mini App by looking for the SDK context
        const context = sdk.context
        if (context) {
          setIsMiniApp(true)
          console.log('🚀 Running in Farcaster Mini App context:', context)
          
          // Call ready() to hide the splash screen
          await sdk.actions.ready()
          setIsReady(true)
          console.log('✅ Mini App ready() called successfully')
        } else {
          console.log('📱 Not running in Mini App context')
          setIsMiniApp(false)
          setIsReady(true) // Still ready, just not in Mini App
        }
      } catch (error) {
        console.log('📱 Not running in Mini App context or SDK not available:', error)
        setIsMiniApp(false)
        setIsReady(true) // Still ready, just not in Mini App
      }
    }

    checkMiniAppContext()
  }, [])

  // Log wallet connection status
  useEffect(() => {
    if (isFarcasterMiniApp) {
      if (isConnected) {
        console.log('✅ Wallet connected in Mini App:', address)
      } else if (!isLoading) {
        console.log('⚠️ Wallet not connected in Mini App')
      }
    }
  }, [isFarcasterMiniApp, isConnected, address, isLoading])

  // Show loading state while checking context
  if (!isReady) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#fbf5ee'
      }}>
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div className={isMiniApp ? 'farcaster-miniapp' : 'web-app'}>
      {children}
    </div>
  )
}

// Export a hook for components to check if they're in Mini App context
export function useMiniAppContext() {
  const [isMiniApp, setIsMiniApp] = useState(false)

  useEffect(() => {
    try {
      const context = sdk.context
      setIsMiniApp(!!context)
    } catch (error) {
      setIsMiniApp(false)
    }
  }, [])

  return { isMiniApp, sdk }
} 
