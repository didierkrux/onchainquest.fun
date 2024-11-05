import { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query

  if (!url) {
    res.status(400).json({ error: 'Missing url parameter' })
    return
  }

  const encodedUrl = encodeURIComponent(url as string)
  const zerionUrl = `zerion://browser?url=${encodedUrl}`

  res.redirect(zerionUrl)
}
