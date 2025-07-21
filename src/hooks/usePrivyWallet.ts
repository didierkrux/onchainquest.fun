import { usePrivy } from '@privy-io/react-auth'
import { createPrivyProvider } from 'utils/wallet'

// Privy-specific wallet hooks
export function usePrivyAccount() {
  const privy = usePrivy()
  
  return {
    address: privy.user?.wallet?.address as `0x${string}` | undefined,
    isConnected: privy.authenticated,
    chainId: 8453, // Base network, since EFP functions require it
  }
}

export function usePrivyBalance(address?: `0x${string}`) {
  // For Privy, we'll return a simplified balance structure
  // You might want to implement actual balance fetching for Privy
  return {
    data: undefined,
    isLoading: false,
    error: null,
  }
}

export function usePrivySendTransaction() {
  const privy = usePrivy()
  
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

export function usePrivySignMessage() {
  const privy = usePrivy()
  
  return {
    signMessageAsync: async (message: string, options?: { address?: string }) => {
      if (!privy.user?.wallet) {
        throw new Error('No wallet connected')
      }
      
      // Use Privy's signMessage method with correct signature
      const signature = await privy.signMessage({ message })
      return signature
    },
    isPending: false,
    error: null,
  }
}

export function usePrivyDisconnect() {
  const privy = usePrivy()
  
  return {
    disconnect: () => privy.logout(),
  }
}

export function usePrivyWalletClient() {
  const privy = usePrivy()
  
  return {
    data: privy.user?.wallet ? createPrivyProvider(privy) : undefined,
  }
}

export function usePrivyModal() {
  const privy = usePrivy()
  
  return {
    open: () => privy.login(),
    isOpen: false,
    ready: privy.ready,
  }
} 
