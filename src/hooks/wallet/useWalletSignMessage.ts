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
        const currentUserAddress = privy.user?.wallet?.address
        const matchingWallet = wallets.find(wallet =>
          wallet.address.toLowerCase() === currentUserAddress?.toLowerCase()
        )

        if (matchingWallet && matchingWallet.walletClientType !== 'privy') {
          // Use external wallet for signing
          const provider = await matchingWallet.getEthereumProvider()
          const address = matchingWallet.address

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
