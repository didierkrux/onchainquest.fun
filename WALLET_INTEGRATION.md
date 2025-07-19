# Wallet Integration Guide

This project now supports both WalletConnect (via Reown AppKit) and Privy for wallet connections. The wallet provider is determined by the `PROJECT_WALLET_TYPE` configuration in `src/config/index.ts`.

## Configuration

Set the wallet type in `src/config/index.ts`:

```typescript
export const PROJECT_WALLET_TYPE: 'privy' | 'walletconnect' = 'privy'
```

## Environment Variables

### For WalletConnect (Reown AppKit)
```env
NEXT_PUBLIC_PROJECT_ID=your_walletconnect_project_id
```

### For Privy
```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
```

## Usage

### Using the Custom Wallet Hooks

The project provides custom hooks that work with both wallet providers:

```typescript
import { 
  useWalletAccount, 
  useWalletBalance, 
  useWalletSendTransaction, 
  useWalletSignMessage, 
  useWalletDisconnect,
  useWalletModal 
} from 'hooks/useWallet'

function MyComponent() {
  const { address, isConnected, chainId } = useWalletAccount()
  const { data: balance } = useWalletBalance(address)
  const { sendTransaction } = useWalletSendTransaction()
  const { signMessageAsync } = useWalletSignMessage()
  const { disconnect } = useWalletDisconnect()
  const { open } = useWalletModal()

  // Use these hooks just like you would with wagmi
  const handleTransaction = async () => {
    const hash = await sendTransaction({
      to: '0x...',
      value: parseEther('0.1')
    })
  }

  const handleSignMessage = async () => {
    const signature = await signMessageAsync('Hello World')
  }
}
```

### Direct Privy Integration (Recommended for Complex Use Cases)

For advanced features like admin signatures, you can use Privy directly:

```typescript
import { usePrivy, useSignMessage, useWallets } from '@privy-io/react-auth'

function AdminComponent() {
  const privy = usePrivy()
  const { wallets } = useWallets()
  const { signMessage } = useSignMessage({
    onSuccess: ({ signature }) => {
      // Handle successful signature
      handleSignatureSuccess(signature)
    },
    onError: (error) => {
      // Handle signature error
      console.error('Signature failed:', error)
    }
  })

  const handleAdminSignature = async () => {
    if (!privy.ready) return
    
    // Create embedded wallet if needed
    if (privy.authenticated && !privy.user?.wallet) {
      await privy.createWallet()
    }

    // Trigger signing
    signMessage({ message: 'Admin signature message' })
  }
}
```

### Using the WalletConnectButton Component

For simple wallet connection, use the provided component:

```typescript
import WalletConnectButton from 'components/WalletConnectButton'

function MyComponent() {
  return (
    <WalletConnectButton variant="solid" size="md">
      Connect Your Wallet
    </WalletConnectButton>
  )
}
```

## Migration from Existing Code

### Before (Wagmi only)
```typescript
import { useAccount, useBalance, useSendTransaction } from 'wagmi'

function MyComponent() {
  const { address, isConnected } = useAccount()
  const { data: balance } = useBalance({ address })
  const { sendTransaction } = useSendTransaction()
}
```

### After (Multi-provider)
```typescript
import { useWalletAccount, useWalletBalance, useWalletSendTransaction } from 'hooks/useWallet'

function MyComponent() {
  const { address, isConnected } = useWalletAccount()
  const { data: balance } = useWalletBalance(address)
  const { sendTransaction } = useWalletSendTransaction()
}
```

## Provider Setup

The wallet provider is automatically configured in `src/context/index.tsx` based on the `PROJECT_WALLET_TYPE` setting.

### WalletConnect Setup
- Uses Reown AppKit with Wagmi adapter
- Supports Base network
- Includes featured wallets (Zerion, 1inch, Rainbow, MetaMask, Coinbase)

### Privy Setup
- Uses Privy React Auth
- Supports email and wallet login methods
- Configured for Base network
- **Embedded wallets enabled** - automatically creates wallets for users without one
- Custom theme matching the app's design

## Features

### Supported Operations
- ✅ Wallet connection/disconnection
- ✅ Account information (address, connection status, chain ID)
- ✅ Balance checking (Wagmi only, Privy needs custom implementation)
- ✅ Transaction sending
- ✅ Message signing (with proper Privy integration)
- ✅ Modal opening for wallet selection
- ✅ **Embedded wallet creation** (Privy only)
- ✅ **Automatic wallet detection and creation**

### Privy-Specific Features
- **Embedded Wallets**: Automatically creates wallets for users who don't have one
- **Multiple Signing Methods**: Supports both direct wallet signing and hook-based signing
- **Client-Side Rendering**: Properly handles SSR/hydration issues
- **Fallback Strategies**: Multiple approaches to ensure signing works

### Limitations
- Balance checking for Privy needs custom implementation
- RPC requests in `useWalletClient` hook need custom implementation for Privy
- Some advanced features may require provider-specific code

## Troubleshooting

### Common Issues

1. **"No embedded or connected wallet found" error**: 
   - This usually means the user needs an embedded wallet created
   - The system automatically creates embedded wallets when needed
   - Ensure you're using the proper Privy hooks (`useSignMessage` with callbacks)

2. **Hook called conditionally error**: 
   - Always call hooks at the top level, never inside conditions
   - Use the unified wallet hooks for basic operations

3. **Type mismatches**: 
   - The custom hooks maintain compatibility with Wagmi types
   - For Privy-specific features, use Privy hooks directly

4. **SSR/Hydration issues**: 
   - Added proper client-side checks
   - Use `isHydrated` state to prevent server-side rendering issues

### Debugging

Check the `PROJECT_WALLET_TYPE` value and ensure the corresponding environment variables are set:

```typescript
console.log('Wallet type:', PROJECT_WALLET_TYPE)
console.log('Project ID:', process.env.NEXT_PUBLIC_PROJECT_ID)
console.log('Privy App ID:', process.env.NEXT_PUBLIC_PRIVY_APP_ID)
```

### Privy Debugging

For Privy-specific issues, check the wallet state:

```typescript
const privy = usePrivy()
const { wallets } = useWallets()

console.log('Privy state:', {
  ready: privy.ready,
  authenticated: privy.authenticated,
  hasUser: !!privy.user,
  hasWallet: !!privy.user?.wallet,
  walletsCount: wallets.length
})
```

## Best Practices

### For Simple Wallet Operations
Use the unified wallet hooks:
```typescript
const { address } = useWalletAccount()
const { signMessageAsync } = useWalletSignMessage()
```

### For Complex Privy Features
Use Privy hooks directly:
```typescript
const { signMessage } = useSignMessage({
  onSuccess: ({ signature }) => handleSuccess(signature),
  onError: (error) => handleError(error)
})
```

### For Admin Functions
Use the comprehensive approach with embedded wallet creation:
```typescript
const handleAdminSignature = async () => {
  // Check client-side
  if (typeof window === 'undefined') return
  
  // Ensure wallet exists
  if (privy.authenticated && !privy.user?.wallet) {
    await privy.createWallet()
  }
  
  // Sign message
  signMessage({ message: adminMessage })
}
```

## Recent Updates

### Latest Changes
- ✅ **Fixed Privy signature issues** - Proper use of `useSignMessage` hook
- ✅ **Added embedded wallet support** - Automatic wallet creation
- ✅ **Improved error handling** - Better user feedback and error recovery
- ✅ **Removed debug logs** - Cleaner, production-ready code
- ✅ **Fixed SSR issues** - Proper client-side rendering handling
- ✅ **Unified wallet hooks** - Consistent API across all components

### Migration Notes
- All components now use unified wallet hooks instead of direct wagmi hooks
- Debug logging has been removed for cleaner production code
- Embedded wallets are automatically created when needed
- Better error handling and user feedback throughout

## Future Enhancements

- [ ] Implement balance checking for Privy
- [ ] Add support for more networks
- [ ] Implement RPC request handling for Privy
- [ ] Add transaction history support
- [ ] Support for more wallet providers
- [ ] Enhanced embedded wallet management
- [ ] Better offline support 
