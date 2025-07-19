import { NextApiRequest, NextApiResponse } from 'next'
import { eventDescription } from 'config'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const manifest = {
    // This manifest is structured similarly to manifest.ts, but for Farcaster integration
    "accountAssociation": {
      // These values may need to be updated for your actual Farcaster integration
      "header": process.env.FARCASTER_HEADER || "eyJmaWQiOjg3MDksInR5cGUiOiJhdXRoIiwia2V5IjoiMHg4MzU0YkJEQjU5MjYyQUE0ODlFNTY2M2YyNDY5OWQxMjY5ODZEYTkyIn0",
      "payload": process.env.FARCASTER_PAYLOAD || "eyJkb21haW4iOiJuZXd0b3dlYjMuaW8ifQ",
      "signature": process.env.FARCASTER_SIGNATURE || "GJrUJTfAoR9d1gA090QC0KiwzdMAMUOx1kPtTT7Rc5dRC05FmLpFM9GQLWY37GBhr9pjI1NWWsnBHTUASgb9/xw="
    },
    "frame": {
      "name": process.env.NEXT_PUBLIC_EVENT_NAME || "New to Web3",
      "version": "1",
      "iconUrl": process.env.NEXT_PUBLIC_APP_ICON
        ? `${process.env.NEXT_PUBLIC_APP_ICON}?v=1`
        : "https://newtoweb3.io/icon.png",
      "homeUrl": process.env.NEXT_PUBLIC_HOME_URL || "https://newtoweb3.io",
      "imageUrl": process.env.NEXT_PUBLIC_SOCIAL_IMAGE
        ? `${process.env.NEXT_PUBLIC_SOCIAL_IMAGE}?v=1`
        : "https://newtoweb3.io/image.png",
      "buttonTitle": "Start Learning",
      "splashImageUrl": process.env.NEXT_PUBLIC_APP_ICON
        ? `${process.env.NEXT_PUBLIC_APP_ICON}?v=1`
        : "https://newtoweb3.io/splash.png",
      "splashBackgroundColor": "#fbf5ee",
      "webhookUrl": process.env.NEXT_PUBLIC_WEBHOOK_URL || "https://newtoweb3.io/api/webhook",
      "subtitle": process.env.NEXT_PUBLIC_EVENT_SUBTITLE || "Learn Web3 and Crypto",
      "description": process.env.NEXT_PUBLIC_EVENT_DESCRIPTION || "\"New to Web3? Start Here\" is a day of activities to get you from 0 to 1 in Web3",
      "screenshotUrls": [
        process.env.NEXT_PUBLIC_SCREENSHOT_1 || "https://newtoweb3.io/images/screenshot1.jpg",
      ],
      "primaryCategory": "education",
      "tags": ["web3", "crypto", "defi", "blockchain", "learning"],
      "heroImageUrl": process.env.NEXT_PUBLIC_SOCIAL_IMAGE
        ? `${process.env.NEXT_PUBLIC_SOCIAL_IMAGE}?v=1`
        : "https://newtoweb3.io/image.png",
      "tagline": process.env.NEXT_PUBLIC_EVENT_TAGLINE || "Learn Web3 and Crypto",
      "ogTitle": process.env.NEXT_PUBLIC_EVENT_NAME || "New to Web3",
      "ogDescription": process.env.NEXT_PUBLIC_EVENT_DESCRIPTION || "\"New to Web3? Start Here\" is a day of activities to get you from 0 to 1 in Web3",
      "ogImageUrl": process.env.NEXT_PUBLIC_SOCIAL_IMAGE
        ? `${process.env.NEXT_PUBLIC_SOCIAL_IMAGE}?v=1`
        : "https://newtoweb3.io/image.png",
      "noindex": false
    }
  }

  res.status(200).json(manifest)
}
