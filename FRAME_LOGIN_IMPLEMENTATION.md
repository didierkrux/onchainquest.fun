# Frame Login Implementation

This document describes the implementation of automatic Frame login with Privy for the Onchain Quest platform.

## Overview

The implementation provides automatic login to Farcaster Frames using Privy's authentication system. When a user opens the app in a Frame context, they are automatically logged in without any manual intervention.

## Features

### ✅ Implemented Features

1. **Automatic Frame Detection**
   - Detects when the app is running in a Farcaster Frame context
   - Uses the `@farcaster/frame-sdk` to check for Frame context
   - Gracefully falls back to regular web app behavior when not in Frame

2. **Automatic Frame Login**
   - Automatically initiates login when in Frame context and user is not authenticated
   - Uses Privy's `useLoginToFrame` hook for seamless authentication
   - Handles the complete login flow: nonce generation → Frame signing → Privy authentication

3. **Embedded Wallet Creation**
   - Automatically creates embedded wallets for authenticated users who don't have one
   - Ensures users have a wallet available for transactions

4. **Loading States and Error Handling**
   - Shows loading spinner during Frame login process
   - Displays error messages if login fails
   - Provides fallback behavior for error cases

5. **Demo Component**
   - Interactive demo showing Frame context detection
   - Displays Privy user object and Frame context
   - Manual login button for testing
   - Status indicators for all authentication states

## Technical Implementation

### Core Components

1. **FrameLoginProvider.tsx**
   - Wraps the entire app
   - Detects Frame context
   - Handles automatic login flow
   - Shows loading states during authentication
   - Creates embedded wallets for users

2. **useFrameLogin.ts**
   - Custom hook for Frame login functionality
   - Provides Frame context detection
   - Handles manual login function
   - Returns authentication state and error handling

3. **FrameLoginDemo.tsx**
   - Demo component showcasing Frame login features
   - Interactive UI for testing Frame functionality
   - Displays Frame context and user information
   - Manual controls for login/logout

### Integration Points

1. **App Integration (`_app.tsx`)**
   - FrameLoginProvider wraps the entire app
   - Positioned before MiniAppSDK for proper context detection
   - Maintains existing Mini App functionality

2. **Privy Configuration (`context/index.tsx`)**
   - Farcaster login method enabled in Privy config
   - Supports email, wallet, and Farcaster login methods
   - Embedded wallet creation for users without wallets

3. **Existing Farcaster Integration**
   - Works alongside existing Mini App SDK
   - Compatible with current Farcaster wallet hooks
   - Maintains backward compatibility

## Usage

### Automatic Login

The Frame login happens automatically when:
1. User opens the app in a Farcaster Frame
2. Privy is ready and user is not authenticated
3. Frame context is detected

### Manual Testing

Visit `/frame-demo` to test the Frame login functionality:
- Shows Frame context detection
- Displays authentication status
- Provides manual login button
- Shows user information when authenticated

### Development

To test Frame login locally:

1. **Install Dependencies**
   ```bash
   yarn add @farcaster/frame-sdk
   ```

2. **Environment Setup**
   ```env
   NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
   ```

3. **Run Development Server**
   ```bash
   yarn dev
   ```

4. **Test Frame Context**
   - Open the app in a Farcaster client that supports Frames
   - Or use the demo page at `/frame-demo`

## API Reference

### FrameLoginProvider Props

```typescript
interface FrameLoginProviderProps {
  children: React.ReactNode
}
```

### useFrameLogin Hook

```typescript
const {
  isFrameContext,      // boolean - whether app is in Frame context
  isLoggingIn,         // boolean - whether login is in progress
  error,               // string | null - error message if login failed
  loginToFrameManually, // function - manual login function
  ready,               // boolean - whether Privy is ready
  authenticated,       // boolean - whether user is authenticated
  user                 // object - Privy user object
} = useFrameLogin()
```

## Error Handling

The implementation includes comprehensive error handling:

1. **Frame SDK Loading Errors**
   - Graceful fallback when SDK is not available
   - Console logging for debugging

2. **Login Process Errors**
   - User-friendly error messages
   - Automatic retry mechanisms
   - Fallback to regular authentication

3. **Context Detection Errors**
   - Handles cases where Frame context is not available
   - Maintains app functionality outside Frame context

## Future Enhancements

1. **Enhanced Error Recovery**
   - Automatic retry on failed logins
   - Better error categorization

2. **Frame-Specific Features**
   - Frame-specific UI components
   - Enhanced user experience in Frame context

3. **Analytics Integration**
   - Track Frame login success rates
   - Monitor user engagement in Frame context

## Troubleshooting

### Common Issues

1. **Frame SDK Not Loading**
   - Ensure `@farcaster/frame-sdk` is installed
   - Check for network connectivity issues

2. **Login Not Triggering**
   - Verify Frame context detection
   - Check Privy configuration
   - Ensure user is not already authenticated

3. **Embedded Wallet Creation Failing**
   - Check Privy app configuration
   - Verify embedded wallet settings

### Debug Information

Enable debug logging by checking browser console for:
- Frame context detection messages
- Login process steps
- Error details and stack traces

## Security Considerations

1. **Nonce Validation**
   - Privy handles nonce generation and validation
   - Prevents replay attacks

2. **Signature Verification**
   - Frame SDK handles signature creation
   - Privy verifies signatures before authentication

3. **Context Validation**
   - Frame context is validated before login
   - Prevents unauthorized login attempts 
