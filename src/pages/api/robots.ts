import { NextApiRequest, NextApiResponse } from 'next'

import { IS_PROD } from 'config/index'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'text/plain')
  res.status(200).send(IS_PROD ?
    // allow all
    `User-agent: *
Allow: /`
    : // disallow all
    `User-agent: *
Disallow: /`)
}
