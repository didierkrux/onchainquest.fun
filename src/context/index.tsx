import React, { ReactNode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { State, WagmiProvider } from 'wagmi'

import { cookieStorage, createStorage } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { base } from '@reown/appkit/networks'
import { createAppKit } from '@reown/appkit/react'
import { PrivyProvider } from '@privy-io/react-auth'

import { PROJECT_WALLET_TYPE } from 'config'

// Setup queryClient
const queryClient = new QueryClient()

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID

if (!projectId) throw new Error('Project ID is not defined')

export const networks = [base]

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
})

// Create modal
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  allowUnsupportedChain: true,
  themeMode: 'light',
  allWallets: 'SHOW',
  featuredWalletIds: [
    // Zerion
    'ecc4036f814562b41a5268adc86270fba1365471402006302e70169465b7ac18',
    // 1inch
    'c286eebc742a537cd1d6818363e9dc53b21759a1e8e5d9b263d0c03ec7703576',
    // Rainbow
    '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369',
    // MetaMask
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
    // Coinbase
    'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa',
  ],
  features: {
    email: false,
    socials: [],
    swaps: true,
  },
  networks: [base],
})

// Initialize the modal
modal
  .ready()
  .then(() => {
    console.log('AppKit modal initialized')
  })
  .catch((error) => {
    console.error('Failed to initialize AppKit modal:', error)
  })

// Web3ModalProvider that handles both providers
export default function Web3ModalProvider({
  children,
  initialState,
}: {
  children: ReactNode
  initialState?: State
}) {
  console.log('🔍 Web3ModalProvider Debug:', {
    PROJECT_WALLET_TYPE,
    hasPrivyAppId: !!process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    privyAppId: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
  })

  if (PROJECT_WALLET_TYPE === 'privy') {
    console.log('🔍 Using PrivyProvider')
    return (
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
        config={{
          loginMethods: ['email', 'wallet'],
          appearance: {
            theme: 'light',
            accentColor: '#C06FDB',
          },
          supportedChains: [base],
          // Create embedded wallets for users who don't have a wallet
          embeddedWallets: {
            ethereum: {
              createOnLogin: 'users-without-wallets',
            },
          },
        }}
      >
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </PrivyProvider>
    )
  }

  // Default to WalletConnect
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        {children}
        {/* Render the AppKit modal for WalletConnect */}
        <appkit-modal />
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export const wagmiConfig = wagmiAdapter.wagmiConfig
