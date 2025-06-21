import { NextApiRequest, NextApiResponse } from 'next'
import { buildAPIHeaders, getChannelFeedEndpoint } from 'utils/farcaster-apis'

// Function to extract image URLs from text and embeds
const extractImages = (text: string, embeds: any[] = []): string[] => {
  const images: string[] = []

  // Extract images from embeds
  embeds.forEach(embed => {
    // Handle different types of embeds
    if (embed.images && embed.images.length > 0) {
      // Direct image embeds
      images.push(...embed.images.map((img: any) => img.url))
    }
    if (embed.og_image) {
      // Open Graph images
      images.push(embed.og_image)
    }
    if (embed.image) {
      // Single image
      images.push(embed.image)
    }
    if (embed.thumbnail_url) {
      // Thumbnail images
      images.push(embed.thumbnail_url)
    }

    // Handle metadata.html.ogImage structure
    if (embed.metadata?.html?.ogImage && Array.isArray(embed.metadata.html.ogImage)) {
      embed.metadata.html.ogImage.forEach((ogImg: any) => {
        if (ogImg.url) {
          images.push(ogImg.url)
        }
      })
    }

    // Handle direct image embeds (when embed.url is an image)
    if (embed.url && embed.metadata?.content_type?.startsWith('image/')) {
      images.push(embed.url)
    }
  })

  // Extract image URLs from text (basic regex for common image formats)
  const imageRegex = /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg)(\?[^\s]*)?/gi
  const textImages = text.match(imageRegex) || []
  images.push(...textImages)

  // Filter out invalid URLs and remove duplicates
  const validImages = images
    .filter(url => url && typeof url === 'string' && url.startsWith('http'))
    .map(url => url.trim())

  return Array.from(new Set(validImages)) // Remove duplicates
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { eventId, cursor } = req.query

  // Only allow for event ID 3
  if (!eventId || eventId !== '3') {
    return res.status(400).json({ message: 'This endpoint is only available for event ID 3' })
  }

  const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY
  if (!NEYNAR_API_KEY) {
    return res.status(500).json({ message: 'Neynar API key not configured. Please set NEYNAR_API_KEY environment variable.' })
  }

  try {
    // DevConnect channel ID on Farcaster
    const channelId = 'devconnect'

    console.log('Fetching DevConnect channel feed from Neynar API')

    // Build URL with cursor for pagination
    let url = getChannelFeedEndpoint(channelId)
    if (cursor) {
      url += `&cursor=${cursor}`
    }

    // Fetch feed from DevConnect channel using Neynar API
    const response = await fetch(url, {
      method: 'GET',
      headers: buildAPIHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Neynar API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Transform the data to a more usable format and limit to first 10
    const messages = (data.casts?.slice(0, 10) || []).map((cast: any) => {
      const images = extractImages(cast.text, cast.embeds)

      // Construct the Farcaster cast URL
      const castUrl = `https://farcaster.xyz/${cast.author.username}/${cast.hash}`

      // Filter reactions to only include count properties and remove empty arrays
      const filteredReactions: any = {}
      if (cast.reactions) {
        Object.entries(cast.reactions).forEach(([key, value]) => {
          if (key.endsWith('_count') && typeof value === 'number') {
            filteredReactions[key] = value
          }
        })
      }

      return {
        id: cast.hash,
        text: cast.text,
        author: {
          username: cast.author.username,
          displayName: cast.author.display_name,
          pfp: cast.author.pfp_url,
          verified: cast.author.verified,
        },
        timestamp: cast.timestamp,
        reactions: filteredReactions,
        embeds: cast.embeds,
        images: images, // Add extracted images
        castUrl: castUrl, // Add the cast URL
      }
    })

    res.status(200).json({
      messages,
      channel: {
        id: channelId,
        name: 'DevConnect',
        description: 'Official DevConnect channel on Farcaster'
      },
      nextCursor: data.next?.cursor // Include next cursor for pagination
    })
  } catch (error) {
    console.error('Error fetching Farcaster messages:', error)
    res.status(500).json({ error: 'Failed to fetch Farcaster messages' })
  }
} 
