import { useAccount, useBalance, useSendTransaction, useSignMessage, useDisconnect, useWalletClient } from 'wagmi'

// Wagmi/WalletConnect-specific wallet hooks
export function useWagmiAccount() {
  return useAccount()
}

export function useWagmiBalance(address?: `0x${string}`) {
  return useBalance({ address })
}

export function useWagmiSendTransaction() {
  return useSendTransaction()
}

export function useWagmiSignMessage() {
  return useSignMessage()
}

export function useWagmiDisconnect() {
  return useDisconnect()
}

export function useWagmiWalletClient() {
  return useWalletClient()
}

export function useWagmiModal() {
  // For WalletConnect, we'll need to import useAppKit
  // This will be handled in components that need it
  return {
    open: () => {
      console.log('WalletConnect modal not implemented in this version')
    },
    isOpen: false,
    ready: true,
  }
} 
