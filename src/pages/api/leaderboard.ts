/* eslint-disable no-console */
import { NextApiRequest, NextApiResponse } from 'next'

import db from 'utils/db'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    const { eventId } = req.query

    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({ message: 'Event ID is required' })
    }

    const leaderboard = await db('users')
      .select('*')
      .where('event_id', eventId)
      .orderBy('score', 'desc')

    // remove duplicates
    const uniqueLeaderboard = leaderboard.filter((value, index, self) =>
      index === self.findIndex((t) => t.address === value.address)
    )

    res.status(200).json(uniqueLeaderboard)
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
