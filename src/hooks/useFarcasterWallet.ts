import { useEffect, useState } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import { useWalletAccount } from './useWallet'

interface FarcasterWalletState {
  isConnected: boolean
  address: string | undefined
  isMiniApp: boolean
  isLoading: boolean
  error: string | null
}

export function useFarcasterWallet() {
  const [state, setState] = useState<FarcasterWalletState>({
    isConnected: false,
    address: undefined,
    isMiniApp: false,
    isLoading: true,
    error: null
  })

  // Get wallet state from existing hook
  const { isConnected, address } = useWalletAccount()

  useEffect(() => {
    const initializeFarcasterWallet = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }))

        // Check if we're in a Mini App context
        const context = sdk.context
        const isMiniApp = !!context

        if (isMiniApp) {
          console.log('🔗 Initializing Farcaster Mini App wallet...')
          
          // In Mini App context, try to get the Ethereum provider
          try {
            const ethProvider = await sdk.wallet.getEthereumProvider()
            if (ethProvider) {
              console.log('✅ Farcaster Ethereum provider available')
              
              // Check if we can get the connected accounts
              const accounts = await ethProvider.request({ method: 'eth_accounts' }) as string[]
              if (accounts && accounts.length > 0) {
                console.log('✅ Wallet already connected:', accounts[0])
                setState({
                  isConnected: true,
                  address: accounts[0],
                  isMiniApp: true,
                  isLoading: false,
                  error: null
                })
                return
              } else {
                // Try to request accounts
                console.log('🔗 Requesting wallet connection...')
                const requestedAccounts = await ethProvider.request({ 
                  method: 'eth_requestAccounts' 
                }) as string[]
                if (requestedAccounts && requestedAccounts.length > 0) {
                  console.log('✅ Wallet connected:', requestedAccounts[0])
                  setState({
                    isConnected: true,
                    address: requestedAccounts[0],
                    isMiniApp: true,
                    isLoading: false,
                    error: null
                  })
                  return
                }
              }
            }
          } catch (walletError) {
            console.log('⚠️ Farcaster wallet not available, falling back to regular wallet:', walletError)
          }
        }

        // Fall back to regular wallet state
        setState({
          isConnected,
          address,
          isMiniApp,
          isLoading: false,
          error: null
        })

      } catch (error) {
        console.error('❌ Error initializing Farcaster wallet:', error)
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to initialize wallet'
        }))
      }
    }

    initializeFarcasterWallet()
  }, [isConnected, address])

  // Update state when regular wallet state changes
  useEffect(() => {
    if (!state.isMiniApp) {
      setState(prev => ({
        ...prev,
        isConnected,
        address
      }))
    }
  }, [isConnected, address, state.isMiniApp])

  const connectWallet = async () => {
    if (state.isMiniApp) {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }))
        
        const ethProvider = await sdk.wallet.getEthereumProvider()
        if (ethProvider) {
          const accounts = await ethProvider.request({ 
            method: 'eth_requestAccounts' 
          }) as string[]
          if (accounts && accounts.length > 0) {
            setState(prev => ({
              ...prev,
              isConnected: true,
              address: accounts[0],
              isLoading: false
            }))
          }
        }
      } catch (error) {
        console.error('❌ Error connecting Farcaster wallet:', error)
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to connect wallet'
        }))
      }
    }
  }

  const disconnectWallet = async () => {
    if (state.isMiniApp) {
      // In Mini App context, we can't disconnect the wallet
      // The user would need to disconnect from the Farcaster client
      console.log('ℹ️ Wallet disconnection handled by Farcaster client')
    }
    
    setState(prev => ({
      ...prev,
      isConnected: false,
      address: undefined
    }))
  }

  return {
    ...state,
    connectWallet,
    disconnectWallet
  }
} 
