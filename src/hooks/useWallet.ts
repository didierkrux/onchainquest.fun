// Re-export focused wallet hooks
export {
  useWalletAccount,
  useWalletBalance,
  useWalletSignMessage,
  useWalletTransaction,
  useWalletDisconnect,
  useWalletModal,
} from './wallet'

// Legacy exports for backward compatibility
// These will be removed in a future version
import { usePrivy } from '@privy-io/react-auth'
import { isPrivyProvider, createPrivyProvider } from 'utils/wallet'

export function useWalletClient() {
  const privy = usePrivy()
  console.log('useWalletClient - privy state:', {
    ready: privy.ready,
    authenticated: privy.authenticated,
    hasWallet: !!privy.user?.wallet,
    isPrivyProvider: isPrivyProvider()
  })

  if (isPrivyProvider()) {
    const provider = privy.user?.wallet ? createPrivyProvider(privy) : undefined
    console.log('useWalletClient - returning Privy provider:', !!provider)
    return {
      data: provider,
    }
  }

  // For WalletConnect, return a placeholder
  // You should use useWalletClient from wagmi directly in WalletConnect mode
  console.log('useWalletClient - returning undefined for WalletConnect')
  return {
    data: undefined,
  }
} 
