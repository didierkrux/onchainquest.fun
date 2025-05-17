/* eslint-disable no-console */
import { eventId } from 'config'
import { NextApiRequest, NextApiResponse } from 'next'

import db from 'utils/db'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const eventId = req.query.id as string
  try {
    const eventData = await db('events')
      .select('data_en', 'data_tr', 'config', 'name')
      .where('id', eventId)
      .first()

    if (!eventData) {
      res.status(404).json({ message: 'Event data not found' })
      return
    }

    res.status(200).json({
      ...eventData,
      config: {
        eventId,
        eventName: eventData.name,
        ...eventData.config,
      },
    })
  } catch (error) {
    console.error('Error fetching event data:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
