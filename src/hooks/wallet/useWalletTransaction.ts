import { useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { isPrivyProvider, createWalletError, type HookError } from 'utils/wallet'

export function useWalletTransaction() {
  const privy = usePrivy()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<HookError | null>(null)

  const sendTransaction = async ({ to, value }: { to: `0x${string}`; value: bigint }) => {
    if (!isPrivyProvider()) {
      throw new Error('WalletConnect sendTransaction not implemented in this version')
    }

    if (!privy.user?.wallet) {
      throw new Error('No wallet connected')
    }

    setIsPending(true)
    setError(null)

    try {
      const hash = await privy.sendTransaction({
        to,
        value: value.toString(),
      })
      
      return { hash }
    } catch (err) {
      const walletError = createWalletError(
        err instanceof Error ? err.message : 'Failed to send transaction',
        'SEND_TRANSACTION_ERROR',
        err
      )
      setError(walletError)
      throw walletError
    } finally {
      setIsPending(false)
    }
  }

  return {
    sendTransaction,
    isPending,
    error,
  }
} 
