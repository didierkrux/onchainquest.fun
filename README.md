# onchainquest.fun

## Features

### Farcaster Integration (Event ID 3)

For Event ID 3, the application includes integration with Farcaster to display messages from the DevConnect channel using the Neynar API.

#### Setup

1. Add your Neynar API key to the environment variables:

   ```bash
   NEYNAR_API_KEY=your_neynar_api_key_here
   ```

2. The feature will automatically load and display the latest 20 messages from the DevConnect channel on Farcaster.

#### Features

- Real-time message fetching from DevConnect channel
- Display of user avatars, display names, and usernames
- Verification badges for verified users
- Message timestamps with relative time formatting
- Support for message embeds and links
- Reaction counts display
- Auto-refresh every 30 seconds
- Responsive design with Chakra UI components
- **Real Messages**: Uses Neynar API to fetch actual channel messages
- **Professional API**: Reliable and well-documented

#### API Details

- **Endpoint**: `https://api.neynar.com`
- **Cost**: Free tier available
- **Auth**: API key required
- **Rate Limit**: 100 requests/minute (free tier)
- **Type**: REST API
- **Maintained by**: Neynar

#### Getting a Neynar API Key

1. Visit [Neynar's website](https://neynar.com)
2. Sign up for a free account
3. Generate an API key from your dashboard
4. Add the key to your environment variables

#### Components

- `FarcasterMessages` - Main component for displaying messages
- `useFarcasterMessages` - Custom hook for fetching data
- `/api/farcaster-messages` - API endpoint using Neynar API
- `utils/farcaster-apis.ts` - API configuration utilities

#### Dependencies

- `@tanstack/react-query` - For data fetching and caching
- `date-fns` - For timestamp formatting
- `@chakra-ui/react` - For UI components

The Farcaster integration is only active for Event ID 3 and will not appear for other events.
