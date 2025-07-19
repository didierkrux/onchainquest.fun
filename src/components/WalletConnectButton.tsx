import { Button } from '@chakra-ui/react'

import { useAppKit } from '@reown/appkit/react'
import { PROJECT_WALLET_TYPE } from 'config'
import { useWalletAccount, useWalletModal } from 'hooks/useWallet'

interface WalletConnectButtonProps {
  children?: React.ReactNode
  variant?: string
  size?: string
}

export default function WalletConnectButton({ 
  children = 'Connect Wallet', 
  variant = 'solid',
  size = 'md'
}: WalletConnectButtonProps) {
  // Use the appropriate hooks based on wallet type
  const { isConnected: privyConnected } = useWalletAccount()
  const { open: openPrivyModal } = useWalletModal()
  
  // AppKit hook for WalletConnect
  const { open } = useAppKit()
  
  // For now, only use Privy hooks to avoid conditional hook calls
  // TODO: Implement proper dual provider support
  const isConnected = privyConnected

  const handleConnect = () => {
    console.log('🔍 WalletConnectButton handleConnect called:', { PROJECT_WALLET_TYPE, isConnected })
    if (PROJECT_WALLET_TYPE === 'privy') {
      console.log('🔍 Opening Privy modal from WalletConnectButton')
      // Force open Privy with wallet connection
      openPrivyModal()
    } else if (PROJECT_WALLET_TYPE === 'walletconnect') {
      console.log('🔍 Opening WalletConnect modal from WalletConnectButton')
      open({ view: 'Connect' })
    }
  }

  if (isConnected) {
    return null // Don't show connect button if already connected
  }

  return (
    <Button 
      onClick={handleConnect}
      variant={variant}
      size={size}
    >
      {children}
    </Button>
  )
} 
