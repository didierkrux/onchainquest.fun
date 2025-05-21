import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { name } = req.query

  if (!name) {
    return res.status(400).json({ message: 'Name parameter is required' })
  }

  try {
    // Read the default avatar image
    const imagePath = path.join(process.cwd(), 'public', 'default-avatar.png')
    const imageBuffer = fs.readFileSync(imagePath)

    // Set appropriate headers
    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
    res.setHeader('Content-Length', imageBuffer.length)

    // Send the image
    res.status(200).send(imageBuffer)
  } catch (error) {
    console.error('Error serving avatar:', error)
    res.status(500).json({ message: 'Error serving avatar image' })
  }
} 
