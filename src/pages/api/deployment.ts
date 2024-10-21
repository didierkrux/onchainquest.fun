import { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // TODO: add Notification message in English + Thai?
  res.status(200).json({ deploymentId: process.env.VERCEL_DEPLOYMENT_ID || '' })
}
