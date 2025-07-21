import { usePrivy } from '@privy-io/react-auth'
import { isPrivyProvider } from 'utils/wallet'

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

  if (isPrivyProvider()) {
    return {
      address: privy.user?.wallet?.address as `0x${string}` | undefined,
      isConnected: privy.authenticated,
      chainId: 8453, // Base network, since EFP functions require it
    }
  }

  // For WalletConnect, return default values
  // You should use useAccount from wagmi directly in WalletConnect mode
  return {
    address: undefined,
    isConnected: false,
    chainId: undefined,
  }
} 
