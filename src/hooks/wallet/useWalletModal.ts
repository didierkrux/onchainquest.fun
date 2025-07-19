import { usePrivy } from '@privy-io/react-auth'
import { isPrivyProvider } from 'utils/wallet'

export function useWalletModal() {
  const privy = usePrivy()
  
  const open = () => {
    if (!isPrivyProvider()) {
      console.log('WalletConnect modal not implemented in this version')
      return
    }

    if (!privy.ready) return
    
    // If user is authenticated but no wallet, try to force wallet connection
    if (privy.authenticated && !privy.user?.wallet) {
      privy.logout().then(() => {
        privy.login()
      })
    } else {
      privy.login()
    }
  }

  return {
    open,
    isOpen: false,
    ready: privy.ready,
  }
} 
