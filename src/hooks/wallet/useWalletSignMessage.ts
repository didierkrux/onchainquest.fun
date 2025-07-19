import { useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { isPrivyProvider, createWalletError, type HookError } from 'utils/wallet'

export function useWalletSignMessage() {
  const privy = usePrivy()
  const { ready: walletsReady, wallets } = useWallets()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<HookError | null>(null)

  const signMessageAsync = async (message: string) => {
    if (!isPrivyProvider()) {
      throw new Error('WalletConnect signMessage not implemented in this version')
    }

    if (!privy.ready) {
      throw new Error('Privy not ready')
    }

    if (!privy.authenticated) {
      throw new Error('User not authenticated. Please connect your wallet first.')
    }

    setIsPending(true)
    setError(null)

    try {
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
