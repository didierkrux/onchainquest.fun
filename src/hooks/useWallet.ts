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
  console.log('privy', privy)
  if (isPrivyProvider()) {
    return {
      data: privy.user?.wallet ? createPrivyProvider(privy) : undefined,
    }
  }

  // For WalletConnect, return a placeholder
  // You should use useWalletClient from wagmi directly in WalletConnect mode
  return {
    data: undefined,
  }
} 
