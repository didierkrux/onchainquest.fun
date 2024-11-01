import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Log the 404 error
  console.error(`404 - Page not found: ${req.url}`)

  // Redirect all 404s to home page
  res.redirect(307, '/')
}
