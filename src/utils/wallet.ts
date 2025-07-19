import { PROJECT_WALLET_TYPE } from 'config'

export interface HookError {
  message: string
  code?: string
  details?: any
  timestamp: number
}

export function getWalletProvider() {
  return PROJECT_WALLET_TYPE === 'privy' ? 'privy' : 'walletconnect'
}

export function createWalletError(message: string, code?: string, details?: any): HookError {
  return { 
    message, 
    code, 
    details,
    timestamp: Date.now() 
  }
}

export function isPrivyProvider() {
  return PROJECT_WALLET_TYPE === 'privy'
}

export function isWalletConnectProvider() {
  return PROJECT_WALLET_TYPE === 'walletconnect'
}


