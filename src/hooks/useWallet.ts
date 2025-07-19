import { usePrivy, useSignMessage, useWallets } from '@privy-io/react-auth'
import { PROJECT_WALLET_TYPE } from 'config'

// Simple wallet hooks that work with Privy
// For WalletConnect, you'll need to use the original wagmi hooks directly

export function useWalletAccount() {
  const privy = usePrivy()
  
  // Wait for Privy to be ready
  if (!privy.ready) {
    return {
      address: undefined,
      isConnected: false,
      chainId: undefined,
    }
  }

  if (PROJECT_WALLET_TYPE === 'privy') {
    const result = {
      address: privy.user?.wallet?.address as `0x${string}` | undefined,
      isConnected: privy.authenticated,
      chainId: 1, // Default to mainnet, Privy handles chain switching internally
    }
    return result
  }

  // For WalletConnect, return default values
  // You should use useAccount from wagmi directly in WalletConnect mode
  return {
    address: undefined,
    isConnected: false,
    chainId: undefined,
  }
}

export function useWalletBalance(address?: `0x${string}`) {
  if (PROJECT_WALLET_TYPE === 'privy') {
    // For Privy, we'll return a simplified balance structure
    // You might want to implement actual balance fetching for Privy
    return {
      data: undefined,
      isLoading: false,
      error: null,
    }
  }

  // For WalletConnect, return default values
  // You should use useBalance from wagmi directly in WalletConnect mode
  return {
    data: undefined,
    isLoading: false,
    error: null,
  }
}

export function useWalletSendTransaction() {
  const privy = usePrivy()
  
  if (PROJECT_WALLET_TYPE === 'privy') {
    return {
      sendTransaction: async ({ to, value }: { to: `0x${string}`; value: bigint }) => {
        if (!privy.user?.wallet) {
          throw new Error('No wallet connected')
        }
        
        // Use Privy's sendTransaction method
        const hash = await privy.sendTransaction({
          to,
          value: value.toString(),
        })
        return { hash }
      },
      isPending: false,
      error: null,
    }
  }

  // For WalletConnect, return a placeholder
  // You should use useSendTransaction from wagmi directly in WalletConnect mode
  return {
    sendTransaction: async ({ to, value }: { to: `0x${string}`; value: bigint }) => {
      throw new Error('WalletConnect sendTransaction not implemented in this version')
    },
    isPending: false,
    error: null,
  }
}

export function useWalletSignMessage() {
  const privy = usePrivy()
  const walletsHook = useWallets()
  const { ready: walletsReady, wallets } = walletsHook

  // Debug all useWallets information
  console.log('🔍 useWallets complete debug:', {
    walletsHook,
    ready: walletsReady,
    wallets: wallets,
    walletsLength: wallets.length,
    walletsDetails: wallets.map(wallet => ({
      address: wallet.address,
      walletClientType: wallet.walletClientType,
      connectedAt: wallet.connectedAt,
      chainId: wallet.chainId,
      // Try to get more properties if they exist
      hasGetEthereumProvider: typeof wallet.getEthereumProvider === 'function',
    }))
  })
  
  if (PROJECT_WALLET_TYPE === 'privy') {
    return {
      signMessageAsync: async (message: string) => {
        if (!privy.ready) {
          throw new Error('Privy not ready')
        }
        
        if (!privy.authenticated) {
          throw new Error('User not authenticated. Please connect your wallet first.')
        }
        
        // Wait for wallets to be ready
        if (!walletsReady) {
          console.log('🔍 Wallets not ready, waiting...')
          await new Promise(resolve => setTimeout(resolve, 2000))
          console.log('🔍 After waiting - wallets ready:', walletsReady, 'wallets.length:', wallets.length)
        }

        // If user is authenticated but no wallet, try to create embedded wallet
        if (privy.authenticated && !privy.user?.wallet) {
          try {
            await privy.createWallet()
            await new Promise(resolve => setTimeout(resolve, 1000))
          } catch (error) {
            throw new Error('Failed to create embedded wallet. Please try connecting again.')
          }
        }
        
        if (!privy.user?.wallet) {
          throw new Error('No wallet connected. Please connect your wallet first.')
        }

        if (!privy.user.wallet.address) {
          throw new Error('Wallet address not available. Please try again.')
        }

        try {
                  console.log('🔍 Wallet detection debug:', {
                    walletsLength: wallets.length,
                    wallets: wallets,
                    walletsReady,
                    privyUserAddress: privy.user?.wallet?.address,
                    privyAuthenticated: privy.authenticated
                  })

                  // Check if we have connected external wallets
          if (wallets.length > 0) {
            // Find the wallet that matches the current user's address
            const currentUserAddress = privy.user?.wallet?.address
            const matchingWallet = wallets.find(wallet =>
              wallet.address.toLowerCase() === currentUserAddress?.toLowerCase()
            )

            console.log('🔍 Wallet matching debug:', {
              currentUserAddress,
              matchingWallet: matchingWallet ? {
                walletClientType: matchingWallet.walletClientType,
                address: matchingWallet.address,
                meta: matchingWallet.meta
              } : null,
              allWallets: wallets.map(w => ({ type: w.walletClientType, address: w.address }))
            })

            if (matchingWallet) {
              // Check if this is an external wallet (not Privy embedded)
              if (matchingWallet.walletClientType !== 'privy') {
                console.log('🔍 External wallet found for current user:', {
                  walletClientType: matchingWallet.walletClientType,
                  address: matchingWallet.address,
                  meta: matchingWallet.meta
                })

                // Follow the exact Privy documentation pattern
                const provider = await matchingWallet.getEthereumProvider()
                const address = matchingWallet.address

                console.log('🔍 External wallet signing debug:', {
                  walletClientType: matchingWallet.walletClientType,
                  walletAddress: address,
                  message,
                  messageLength: message.length
                })

                // Use the exact pattern from Privy docs
                const signature = await provider.request({
                  method: 'personal_sign',
                  params: [message, address]
                })

                console.log('🔍 External wallet signature result:', signature)
                return signature
              } else {
                console.log('🔍 Current user has embedded wallet, using embedded signing')
              }
                    } else {
                      console.log('🔍 No matching wallet found for current user address')
                    }
                  }

                  // If no external wallets detected but user has a wallet, try to check if it's external
                  if (privy.user?.wallet?.address && wallets.length === 0) {
                    console.log('🔍 No wallets in array but user has wallet - checking if external')

                    // Check if the current wallet address matches any known external wallet patterns
                    // This is a fallback for when Privy doesn't immediately detect external wallets
                    const currentAddress = privy.user.wallet.address.toLowerCase()

                    // If the user has a wallet but it's not in the wallets array, 
                    // it might be an external wallet that Privy hasn't detected yet
                    // In this case, we'll use the embedded wallet signing as fallback
                    console.log('🔍 Using embedded wallet as fallback for external wallet')
          }

          // Fallback to embedded wallet signing
                  console.log('🔍 Embedded wallet signing debug:', {
                    privyUserAddress: privy.user?.wallet?.address,
                    message,
                    messageLength: message.length
                  })

          const signature = await privy.signMessage({ message })
                  console.log('🔍 Embedded wallet signature result:', signature)
          return signature
                } catch (error) {
          throw new Error(`Failed to sign message: ${error.message}`)
        }
      },
      isPending: false,
      error: null,
    }
  }

  // For WalletConnect, return a placeholder
  // You should use useSignMessage from wagmi directly in WalletConnect mode
  return {
    signMessageAsync: async (message: string) => {
      throw new Error('WalletConnect signMessage not implemented in this version')
    },
    isPending: false,
    error: null,
  }
}

export function useWalletDisconnect() {
  const privy = usePrivy()
  
  if (PROJECT_WALLET_TYPE === 'privy') {
    return {
      disconnect: () => {
        if (!privy.ready) return
        privy.logout()
      },
    }
  }

  // For WalletConnect, return a placeholder
  // You should use useDisconnect from wagmi directly in WalletConnect mode
  return {
    disconnect: () => {
      console.log('WalletConnect disconnect not implemented in this version')
    },
  }
}

export function useWalletClient() {
  const privy = usePrivy()
  
  if (PROJECT_WALLET_TYPE === 'privy') {
    return {
      data: privy.user?.wallet ? {
        account: {
          address: privy.user.wallet.address as `0x${string}`,
          type: 'json-rpc',
        },
        chain: {
          id: 1, // Default to mainnet
        },
        transport: {
          type: 'json-rpc',
        },
        request: async (args: { method: string; params?: any[] }) => {
          // For Privy, we'll use the main privy object for RPC requests
          // This is a simplified approach - you might need to implement this differently
          throw new Error('RPC requests not implemented for Privy in this hook')
        },
      } : undefined,
    }
  }

  // For WalletConnect, return a placeholder
  // You should use useWalletClient from wagmi directly in WalletConnect mode
  return {
    data: undefined,
  }
}

export function useWalletModal() {
  const privy = usePrivy()
  
  if (PROJECT_WALLET_TYPE === 'privy') {
    return {
      open: () => {
        if (!privy.ready) return
        
        // If user is authenticated but no wallet, try to force wallet connection
        if (privy.authenticated && !privy.user?.wallet) {
          privy.logout().then(() => {
            privy.login()
          })
        } else {
          privy.login()
        }
      },
      isOpen: false,
      ready: privy.ready,
    }
  }

  // For WalletConnect, return a placeholder
  // You should use useAppKit from @reown/appkit/react directly in WalletConnect mode
  return {
    open: () => {
      console.log('WalletConnect modal not implemented in this version')
    },
    isOpen: false,
    ready: true,
  }
} 
