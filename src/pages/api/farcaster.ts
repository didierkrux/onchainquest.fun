import { NextApiRequest, NextApiResponse } from 'next'
import { eventDescription } from 'config'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const manifest = {
    // This manifest is structured similarly to manifest.ts, but for Farcaster integration
    "accountAssociation": {
      // These values may need to be updated for your actual Farcaster integration
      "header": process.env.FARCASTER_HEADER || "",
      "payload": process.env.FARCASTER_PAYLOAD || "",
      "signature": process.env.FARCASTER_SIGNATURE || ""
    },
    "frame": {
      "name": process.env.NEXT_PUBLIC_EVENT_NAME || "New to Web3",
      "version": "1",
      "iconUrl": process.env.NEXT_PUBLIC_APP_ICON
        ? `${process.env.NEXT_PUBLIC_APP_ICON}?v=1`
        : "/app-icon.png",
      "homeUrl": process.env.NEXT_PUBLIC_HOME_URL || "/?webapp=true",
      "imageUrl": process.env.NEXT_PUBLIC_SOCIAL_IMAGE
        ? `${process.env.NEXT_PUBLIC_SOCIAL_IMAGE}?v=1`
        : "/social.jpg",
      "buttonTitle": "Start Learning",
      "splashImageUrl": process.env.NEXT_PUBLIC_APP_ICON
        ? `${process.env.NEXT_PUBLIC_APP_ICON}?v=1`
        : "/app-icon.png",
      "splashBackgroundColor": "#000000",
      "webhookUrl": process.env.NEXT_PUBLIC_WEBHOOK_URL || "/api/webhook",
      "subtitle": process.env.NEXT_PUBLIC_EVENT_SUBTITLE || "Learn Web3 and Crypto",
      "description": eventDescription,
      "screenshotUrls": [
        process.env.NEXT_PUBLIC_SCREENSHOT_1 || "/images/screenshot1.png",
        process.env.NEXT_PUBLIC_SCREENSHOT_2 || "/images/screenshot2.png",
        process.env.NEXT_PUBLIC_SCREENSHOT_3 || "/images/screenshot3.png"
      ],
      "primaryCategory": "education",
      "tags": ["web3", "crypto", "defi", "blockchain", "learning"],
      "heroImageUrl": process.env.NEXT_PUBLIC_SOCIAL_IMAGE
        ? `${process.env.NEXT_PUBLIC_SOCIAL_IMAGE}?v=1`
        : "/social.jpg",
      "tagline": process.env.NEXT_PUBLIC_EVENT_TAGLINE || "Learn Web3 and Crypto",
      "ogTitle": process.env.NEXT_PUBLIC_EVENT_NAME || "New to Web3",
      "ogDescription": eventDescription,
      "ogImageUrl": process.env.NEXT_PUBLIC_SOCIAL_IMAGE
        ? `${process.env.NEXT_PUBLIC_SOCIAL_IMAGE}?v=1`
        : "/social.jpg",
      "noindex": false
    }
  }

  res.status(200).json(manifest)
}
