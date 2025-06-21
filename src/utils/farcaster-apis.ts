// Farcaster API Configuration - Using Neynar API for channel feeds
export const FARCASTER_API_CONFIG = {
  baseUrl: 'https://api.neynar.com',
  requiresAuth: true,
  authHeader: 'api_key',
  rateLimit: 100, // requests per minute (free tier)
  description: 'Neynar API (Free tier available)'
}

// Build headers for API requests
export const buildAPIHeaders = (): Record<string, string> => {
  const apiKey = process.env.NEYNAR_API_KEY || 'demo'
  return {
    'accept': 'application/json',
    'api_key': apiKey,
  }
}

// Get the channel feed endpoint
export const getChannelFeedEndpoint = (channelIds: string): string => {
  return `${FARCASTER_API_CONFIG.baseUrl}/v2/farcaster/feed/channels?channel_ids=${channelIds}`
} 
