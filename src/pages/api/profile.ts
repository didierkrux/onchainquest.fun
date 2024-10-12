/* eslint-disable no-console */
import { NextApiRequest, NextApiResponse } from 'next'

import db from 'utils/db'
import { eventId } from 'config'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const { address } = req.query

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ message: 'Invalid address' })
  }

  try {
    const profile = await db('users')
      .select('*')
      .where('event_id', eventId)
      .whereILike('address', address)
      .first()

    if (!profile) {
      res.status(404).json({ message: 'Profile not found' })
      return
    }

    res.status(200).json(profile)
  } catch (error) {
    console.error('Error fetching profile:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
