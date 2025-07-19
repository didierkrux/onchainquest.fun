import { usePrivy } from '@privy-io/react-auth'
import { isPrivyProvider } from 'utils/wallet'

export function useWalletDisconnect() {
  const privy = usePrivy()
  
  const disconnect = () => {
    if (!isPrivyProvider()) {
      console.log('WalletConnect disconnect not implemented in this version')
      return
    }

    if (!privy.ready) return
    privy.logout()
  }

  return {
    disconnect,
  }
} 
