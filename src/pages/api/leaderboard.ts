/* eslint-disable no-console */
import { NextApiRequest, NextApiResponse } from 'next'

import db from 'utils/db'
import { eventId } from 'config'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    const leaderboard = await db('users')
      .select('*')
      .where('event_id', eventId)
      .orderBy('score', 'desc')

    res.status(200).json(leaderboard)
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
