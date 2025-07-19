import { useAccount, useBalance, useSendTransaction, useSignMessage, useDisconnect, useWalletClient } from 'wagmi'
import { useAppKit } from '@reown/appkit/react'

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
  const { open } = useAppKit()

  return {
    open: () => open({ view: 'Connect' }),
    isOpen: false, // AppKit doesn't expose isOpen state
    ready: true,
  }
} 
