import { PrivyProvider } from '@privy-io/react-auth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { base } from '@reown/appkit/networks'
import { ReactNode } from 'react'

const queryClient = new QueryClient()

interface PrivyWalletProviderProps {
  children: ReactNode
}

export default function PrivyWalletProvider({ children }: PrivyWalletProviderProps) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
      config={{
        loginMethods: ['email', 'wallet', 'farcaster'],
        defaultChain: base,
        appearance: {
          theme: 'light',
          accentColor: '#C06FDB',
        },
        supportedChains: [base],
      }}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </PrivyProvider>
  )
} 
