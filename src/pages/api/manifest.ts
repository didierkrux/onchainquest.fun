import { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const manifest = {
    "name": process.env.NEXT_PUBLIC_EVENT_NAME || "New to Web3",
    "short_name": process.env.NEXT_PUBLIC_EVENT_NAME || "New to Web3",
    "theme_color": "#fbf5ee",
    "background_color": "#000000",
    "start_url": "/?pwa=true",
    "icons": [
      {
        "src": process.env.NEXT_PUBLIC_APP_ICON || "/app-icon.png",
        "sizes": "512x512",
        "type": "image/png"
      }
    ],
    "scope": "/",
    "display": "standalone",
    "orientation": "portrait"
  }

  res.status(200).json(manifest)
}
