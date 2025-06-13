import { NextApiRequest, NextApiResponse } from 'next'
import path from 'path'
import fs from 'fs'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const faviconPath = path.join(process.cwd(), 'public', process.env.NEXT_PUBLIC_FAVICON || 'favicon_default.ico')
  const favicon = fs.readFileSync(faviconPath)

  res.setHeader('Content-Type', 'image/x-icon')
  res.setHeader('Content-Disposition', 'inline')
  return res.status(200).send(favicon)
}
