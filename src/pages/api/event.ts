/* eslint-disable no-console */
import { NextApiRequest, NextApiResponse } from 'next'

import db from 'utils/db'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const { eventId, id } = req.query
  const eventIdParam = eventId || id

  if (!eventIdParam || typeof eventIdParam !== 'string') {
    return res.status(400).json({ message: 'Event ID is required' })
  }

  const eventIdNum = parseInt(eventIdParam, 10)
  if (isNaN(eventIdNum)) {
    return res.status(400).json({ message: 'Invalid Event ID format' })
  }

  try {
    const eventData = await db('events')
      .select('data_en', 'data_tr', 'config', 'name')
      .where('id', eventIdNum)
      .first()

    if (!eventData) {
      res.status(404).json({ message: 'Event data not found' })
      return
    }

    // Ensure config exists and has required fields
    const config = eventData.config || {}
    const eventConfig = {
      eventId: eventIdNum,
      eventName: eventData.name,
      ...config,
    }

    res.status(200).json({
      ...eventData,
      config: eventConfig,
    })
  } catch (error) {
    console.error('Error fetching event data:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
