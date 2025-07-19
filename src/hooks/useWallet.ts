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
import { isPrivyProvider } from 'utils/wallet'

export function useWalletClient() {
  const privy = usePrivy()
  
  if (isPrivyProvider()) {
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
