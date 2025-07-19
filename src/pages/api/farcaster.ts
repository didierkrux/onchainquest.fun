import { NextApiRequest, NextApiResponse } from 'next'
import { eventDescription, eventName, DOMAIN_URL } from 'config'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const manifest = {
    // This manifest is structured for Farcaster Mini App integration
    "accountAssociation": {
      // These values need to be updated with actual signed data from the Farcaster manifest tool
      "header": process.env.FARCASTER_HEADER || "eyJmaWQiOjg3MDksInR5cGUiOiJhdXRoIiwia2V5IjoiMHg4MzU0YkJEQjU5MjYyQUE0ODlFNTY2M2YyNDY5OWQxMjY5ODZEYTkyIn0",
      "payload": process.env.FARCASTER_PAYLOAD || "eyJkb21haW4iOiJuZXd0b3dlYjMuaW8ifQ",
      "signature": process.env.FARCASTER_SIGNATURE || "GJrUJTfAoR9d1gA090QC0KiwzdMAMUOx1kPtTT7Rc5dRC05FmLpFM9GQLWY37GBhr9pjI1NWWsnBHTUASgb9/xw="
    },
    "miniapp": {
      "version": "1",
      "name": process.env.NEXT_PUBLIC_EVENT_NAME || eventName,
      "iconUrl": process.env.NEXT_PUBLIC_APP_ICON
        ? `${process.env.NEXT_PUBLIC_APP_ICON}?v=1`
        : `${DOMAIN_URL}/app-icon.png`,
      "homeUrl": process.env.NEXT_PUBLIC_HOME_URL || DOMAIN_URL,
      "imageUrl": process.env.NEXT_PUBLIC_SOCIAL_IMAGE
        ? `${process.env.NEXT_PUBLIC_SOCIAL_IMAGE}?v=1`
        : `${DOMAIN_URL}/social.jpg`,
      "buttonTitle": "Start Quest",
      "splashImageUrl": process.env.NEXT_PUBLIC_APP_ICON
        ? `${process.env.NEXT_PUBLIC_APP_ICON}?v=1`
        : `${DOMAIN_URL}/app-icon.png`,
      "splashBackgroundColor": "#fbf5ee",
      "webhookUrl": process.env.NEXT_PUBLIC_WEBHOOK_URL || `${DOMAIN_URL}/api/webhook`,
      "subtitle": process.env.NEXT_PUBLIC_EVENT_SUBTITLE || "Web3 Event Platform",
      "description": process.env.NEXT_PUBLIC_EVENT_DESCRIPTION || eventDescription,
      "screenshotUrls": [
        process.env.NEXT_PUBLIC_SCREENSHOT_1 || `${DOMAIN_URL}/images/screenshot1.jpg`,
      ],
      "primaryCategory": "education",
      "tags": ["web3", "crypto", "defi", "blockchain", "learning", "events", "quests"],
      "heroImageUrl": process.env.NEXT_PUBLIC_SOCIAL_IMAGE
        ? `${process.env.NEXT_PUBLIC_SOCIAL_IMAGE}?v=1`
        : `${DOMAIN_URL}/social.jpg`,
      "tagline": process.env.NEXT_PUBLIC_EVENT_TAGLINE || "Complete Web3 Quests",
      "ogTitle": process.env.NEXT_PUBLIC_EVENT_NAME || eventName,
      "ogDescription": process.env.NEXT_PUBLIC_EVENT_DESCRIPTION || eventDescription,
      "ogImageUrl": process.env.NEXT_PUBLIC_SOCIAL_IMAGE
        ? `${process.env.NEXT_PUBLIC_SOCIAL_IMAGE}?v=1`
        : `${DOMAIN_URL}/social.jpg`,
      "noindex": false
    }
  }

  res.status(200).json(manifest)
}
