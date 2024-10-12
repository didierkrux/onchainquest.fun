/* eslint-disable no-console */
import { NextApiRequest, NextApiResponse } from 'next'

import db from 'utils/db'
import { eventId } from 'config'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const { address } = req.query
  const { username } = req.body
  console.log('req.query', req.query)
  console.log('req.body', req.body)
  console.log('req.method', req.method)
  console.log('address', address)
  console.log('username', username)

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ message: 'Invalid address' })
  }

  if (req.method === 'POST' && username?.length > 0) {
    const profileToSave = { username, score: 10, tasks: { 1: { isCompleted: true, score: 5 }, 2: { isCompleted: true, score: 5 } } }
    console.log('Saving profile', profileToSave)

    const [profile] = await db('users')
      .update(profileToSave)
      .where('event_id', eventId)
      .whereILike('address', address)
      .returning('*')
    return res.status(200).json(profile)
  } else {
    try {
    const profile = await db('users')
      .select('*')
      .where('event_id', eventId)
      .whereILike('address', address)
      .first()

    if (!profile) {
      const profileToSave = { event_id: eventId, address, score: 5, tasks: { 1: { isCompleted: true, score: 5 } } }
      console.log('Saving profile', profileToSave)

      const [profile] = await db('users')
        .insert(profileToSave)
        .returning('*')
      return res.status(200).json(profile)
    }

    res.status(200).json(profile)
  } catch (error) {
      console.error('Error fetching profile:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  }
}
