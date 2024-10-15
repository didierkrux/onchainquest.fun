/* eslint-disable no-console */
import { NextApiRequest, NextApiResponse } from 'next'

import db from 'utils/db'
import { eventId } from 'config/index'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    const eventData = await db('events')
      .select('data_en', 'data_tr')
      .where('id', eventId)
      .first()

    if (!eventData) {
      res.status(404).json({ message: 'Event data not found' })
      return
    }

    res.status(200).json(eventData)
  } catch (error) {
    console.error('Error fetching event data:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
