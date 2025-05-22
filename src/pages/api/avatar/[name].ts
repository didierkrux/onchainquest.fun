import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import db from 'utils/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { name } = req.query

  if (!name) {
    return res.status(400).json({ message: 'Name parameter is required' })
  }

  try {
    // Read the default avatar image
    const imagePath = path.join(process.cwd(), 'public', 'default-avatar.png')
    let imageBuffer = fs.readFileSync(imagePath)
    let contentType = 'image/png'

    // get subname from db
    const profile = await db('users').where('subname', name).first()
    if (profile?.avatar) {
      // download avatar from url (subname is an url)
      const response = await fetch(profile.avatar)
      if (!response.ok) throw new Error(`Failed to fetch avatar: ${response.status}`)
      const avatarBuffer = await response.arrayBuffer()
      imageBuffer = Buffer.from(avatarBuffer)
      contentType = 'image/svg+xml'
    }

    // Set appropriate headers
    res.setHeader('Content-Type', contentType)
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
