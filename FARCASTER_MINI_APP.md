# Farcaster Mini App Integration

This document describes the Farcaster Mini App integration for the Onchain Quest platform.

## Overview

The Onchain Quest platform has been enhanced to work as a Farcaster Mini App, providing users with a seamless experience within Farcaster clients like Warpcast.

## Features

### ✅ Implemented Features

1. **Mini App SDK Integration**
   - Automatic detection of Mini App context
   - Proper `ready()` call to hide splash screen
   - Context-aware UI adjustments

2. **Wallet Integration**
   - Automatic wallet connection in Mini App context
   - Farcaster Ethereum provider integration
   - Seamless wallet experience without popups
   - Fallback to regular wallet providers outside Mini App

3. **Manifest Configuration**
   - Proper `farcaster.json` manifest at `/.well-known/farcaster.json`
   - Mini App embed metadata for social sharing
   - Account association for domain verification

4. **User Experience**
   - "Add to Farcaster" button for Mini App installation
   - Mini App-specific features panel
   - Wallet connection status indicator
   - Share quest completions via casts
   - Enhanced UI for Mini App context

5. **Notifications System**
   - Webhook endpoint for handling Mini App events
   - Notification token management
   - Utility functions for sending notifications
   - Quest completion notifications
   - Event reminders
   - Leaderboard updates

6. **Social Integration**
   - Compose casts from within the app
   - Share quest progress with the community
   - Farcaster-specific UI enhancements

## Technical Implementation

### Core Components

1. **MiniAppSDK.tsx**
   - Wraps the entire app
   - Detects Mini App context
   - Calls `sdk.actions.ready()` when appropriate
   - Provides context to child components

2. **useFarcasterWallet.ts**
   - Specialized hook for Farcaster wallet integration
   - Automatically connects to user's wallet in Mini App context
   - Falls back to regular wallet providers outside Mini App
   - Handles wallet connection states and errors

3. **MiniAppWalletStatus.tsx**
   - Shows wallet connection status in Mini App context
   - Provides connection/retry buttons
   - Displays wallet address when connected

4. **AddMiniAppButton.tsx**
   - Allows users to add the Mini App to their Farcaster client
   - Only visible in Mini App context
   - Handles success/error states

5. **MiniAppFeatures.tsx**
   - Shows Mini App-specific features
   - Provides social sharing options
   - Enhanced user experience

6. **miniapp-notifications.ts**
   - Manages notification tokens
   - Sends notifications to users
   - Handles batch notifications

### API Endpoints

1. **`/api/farcaster`**
   - Serves the Mini App manifest
   - Configurable via environment variables

2. **`/api/webhook`**
   - Handles Mini App events
   - Manages notification tokens
   - Processes user actions

### Environment Variables

```env
# Farcaster Mini App Configuration
FARCASTER_HEADER=your_signed_header
FARCASTER_PAYLOAD=your_signed_payload
FARCASTER_SIGNATURE=your_signature

# Mini App Metadata
NEXT_PUBLIC_APP_ICON=https://your-domain.com/app-icon.png
NEXT_PUBLIC_SOCIAL_IMAGE=https://your-domain.com/social.jpg
NEXT_PUBLIC_HOME_URL=https://your-domain.com
NEXT_PUBLIC_WEBHOOK_URL=https://your-domain.com/api/webhook

# Event Configuration
NEXT_PUBLIC_EVENT_NAME=Your Event Name
NEXT_PUBLIC_EVENT_DESCRIPTION=Your event description
NEXT_PUBLIC_EVENT_SUBTITLE=Event subtitle
NEXT_PUBLIC_EVENT_TAGLINE=Event tagline
```

## Setup Instructions

### 1. Install Dependencies

```bash
yarn add @farcaster/miniapp-sdk
```

### 2. Configure Environment Variables

Set up the required environment variables for your domain and event.

### 3. Sign Your Manifest

1. Visit [Farcaster Mini App Manifest Tool](https://farcaster.xyz/~/developers/mini-apps/manifest)
2. Enter your domain and app details
3. Sign the manifest with your Farcaster account
4. Update the `accountAssociation` in `/api/farcaster.ts`

### 4. Deploy Your App

Deploy to your production domain. Mini Apps require a production domain (not development tunnels).

### 5. Test Your Mini App

1. Use the [Farcaster Mini App Preview Tool](https://farcaster.xyz/~/developers/mini-apps/preview)
2. Test in Warpcast or other Farcaster clients
3. Verify notifications work correctly

## Usage

### For Users

1. **Discover the Mini App**
   - Users can find the Mini App in Farcaster search
   - Share links will show Mini App embeds

2. **Add to Farcaster**
   - Click "Add to Farcaster" button
   - Mini App will be available in their app collection

3. **Use Mini App Features**
   - Complete quests and earn rewards
   - Share progress with the community
   - Receive notifications for updates

### For Developers

1. **Wallet Integration**

```typescript
import { useFarcasterWallet } from 'hooks/useFarcasterWallet'

function MyComponent() {
  const { isConnected, address, isMiniApp, connectWallet } = useFarcasterWallet()
  
  if (isMiniApp && !isConnected) {
    return <button onClick={connectWallet}>Connect Farcaster Wallet</button>
  }
}
```

2. **Sending Notifications**

```typescript
import { sendQuestCompletionNotification } from 'utils/miniapp-notifications'

// Send a quest completion notification
await sendQuestCompletionNotification(userId, 'Wallet Setup Quest')
```

3. **Checking Mini App Context**

```typescript
import { useMiniAppContext } from 'components/MiniAppSDK'

function MyComponent() {
  const { isMiniApp, sdk } = useMiniAppContext()
  
  if (isMiniApp) {
    // Show Mini App specific features
  }
}
```

4. **Composing Casts**

```typescript
await sdk.actions.composeCast({
  text: 'Just completed a quest! 🎉'
})
```

## Best Practices

1. **Always call `ready()`**
   - The Mini App SDK must call `ready()` to hide the splash screen
   - This is handled automatically by `MiniAppSDK.tsx`

2. **Handle context gracefully**
   - Your app should work both as a website and Mini App
   - Use `useMiniAppContext()` to detect context

3. **Manage notifications carefully**
   - Respect rate limits (1 per 30 seconds, 100 per day)
   - Use stable notification IDs for deduplication
   - Handle webhook events properly

4. **Test thoroughly**
   - Test in both web and Mini App contexts
   - Verify notifications work correctly
   - Test social sharing features

## Troubleshooting

### Common Issues

1. **App not loading in Mini App**
   - Ensure `ready()` is called
   - Check console for SDK errors
   - Verify manifest is accessible

2. **Notifications not working**
   - Check webhook endpoint is accessible
   - Verify notification tokens are stored
   - Check rate limits

3. **Manifest not found**
   - Ensure `/.well-known/farcaster.json` is accessible
   - Verify domain matches signed manifest
   - Check for redirects

### Debug Tools

1. **Farcaster Developer Tools**
   - [Manifest Tool](https://farcaster.xyz/~/developers/mini-apps/manifest)
   - [Preview Tool](https://farcaster.xyz/~/developers/mini-apps/preview)
   - [Debug Tool](https://farcaster.xyz/~/developers/mini-apps/debug)

2. **Console Logging**
   - Mini App context detection is logged
   - Webhook events are logged
   - Notification sending is logged

## Resources

- [Farcaster Mini Apps Documentation](https://miniapps.farcaster.xyz/)
- [Mini App SDK](https://github.com/farcasterxyz/miniapps)
- [Warpcast Developer Tools](https://farcaster.xyz/~/developers)

## Support

For issues with the Mini App integration:
1. Check the console logs for errors
2. Verify your manifest configuration
3. Test in the Farcaster preview tools
4. Reach out to the Farcaster team on Farcaster (@pirosb3, @linda, @deodad) 
