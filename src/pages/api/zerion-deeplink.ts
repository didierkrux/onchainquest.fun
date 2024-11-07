import { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query

  if (!url) {
    res.status(400).json({ error: 'Missing url parameter' })
    return
  }

  const encodedUrl = encodeURIComponent(url as string)
  const userAgent = req.headers['user-agent'] || ''
  let redirectUrl = ''

  if (/android/i.test(userAgent)) {
    redirectUrl = `intent://browser?url=${encodedUrl}#Intent;scheme=zerion;package=io.zerion.android;end`
  } else {
    redirectUrl = `zerion://browser?url=${encodedUrl}`
  }

  res.redirect(redirectUrl)
}
