import { useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { sdk } from '@farcaster/miniapp-sdk'
import { isPrivyProvider, createWalletError, type HookError } from 'utils/wallet'

export function useWalletSignMessage() {
  const privy = usePrivy()
  const { ready: walletsReady, wallets } = useWallets()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<HookError | null>(null)

  const signMessageAsync = async (message: string) => {
    setIsPending(true)
    setError(null)

    try {
      // Check if we're in a Farcaster Mini App context first
      const context = await sdk.context
      if (context) {
        console.log('🔗 Farcaster Mini App context detected, using Farcaster wallet for signing')

        const ethProvider = await sdk.wallet.getEthereumProvider()
        if (ethProvider) {
          // Get the current account from Farcaster
          const accounts = await ethProvider.request({ method: 'eth_accounts' }) as string[]
          if (accounts && accounts.length > 0) {
            const address = accounts[0]
            console.log('🔗 Signing with Farcaster wallet:', address)

            const signature = await ethProvider.request({
              method: 'personal_sign',
              params: [message, address]
            })

            return signature
          } else {
            throw new Error('No Farcaster wallet connected. Please connect your wallet first.')
          }
        } else {
          throw new Error('Farcaster Ethereum provider not available')
        }
      }

    // Fall back to Privy for non-Farcaster contexts
      if (!isPrivyProvider()) {
        throw new Error('WalletConnect signMessage not implemented in this version')
      }

      if (!privy.ready) {
        throw new Error('Privy not ready')
      }

      if (!privy.authenticated) {
        throw new Error('User not authenticated. Please connect your wallet first.')
      }

      // Wait for wallets to be ready
      if (!walletsReady) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      // Create embedded wallet if user doesn't have one
      if (privy.authenticated && !privy.user?.wallet) {
        await privy.createWallet()
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      if (!privy.user?.wallet) {
        throw new Error('No wallet connected. Please connect your wallet first.')
      }

      // Check for external wallets first
      if (wallets.length > 0) {
        console.log('🔗 Available wallets:', wallets.map(w => ({
          type: w.walletClientType,
          address: w.address
        })))

        const currentUserAddress = privy.user?.wallet?.address
        console.log('🔗 Current user address:', currentUserAddress)

        const matchingWallet = wallets.find(wallet =>
          wallet.address.toLowerCase() === currentUserAddress?.toLowerCase()
        )

        if (matchingWallet && matchingWallet.walletClientType !== 'privy') {
          // Use external wallet for signing
          console.log('🔗 Using external wallet for signing:', {
            walletType: matchingWallet.walletClientType,
            address: matchingWallet.address,
            walletName: matchingWallet.walletClientType
          })

          const provider = await matchingWallet.getEthereumProvider()
          const address = matchingWallet.address

          // Special handling for Coinbase Smart Wallet
          if (matchingWallet.walletClientType === 'coinbase_wallet') {
            console.log('🔗 Coinbase Smart Wallet detected, using special signing method')

            // Coinbase Smart Wallet might need different signing approach
            try {
              const signature = await provider.request({
                method: 'personal_sign',
                params: [message, address]
              })
              console.log('✅ Coinbase Smart Wallet signature successful')
              return signature
            } catch (coinbaseError) {
              console.error('❌ Coinbase Smart Wallet signing failed:', coinbaseError)

              // Fallback: try with eth_sign method
              try {
                console.log('🔄 Trying eth_sign fallback for Coinbase Smart Wallet')
                const signature = await provider.request({
                  method: 'eth_sign',
                  params: [address, message]
                })
                console.log('✅ Coinbase Smart Wallet eth_sign successful')
                return signature
              } catch (fallbackError) {
                console.error('❌ Coinbase Smart Wallet eth_sign also failed:', fallbackError)
                throw new Error(`Coinbase Smart Wallet signing failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`)
              }
            }
          }

          // Standard signing for other external wallets
          const signature = await provider.request({
            method: 'personal_sign',
            params: [message, address]
          })

          return signature
        }
      }

      // Fallback to embedded wallet signing
      const signature = await privy.signMessage({ message })
      return signature

    } catch (err) {
      const walletError = createWalletError(
        err instanceof Error ? err.message : 'Failed to sign message',
        'SIGN_MESSAGE_ERROR',
        err
      )
      setError(walletError)
      throw walletError
    } finally {
      setIsPending(false)
    }
  }

  return {
    signMessageAsync,
    isPending,
    error,
  }
} 
