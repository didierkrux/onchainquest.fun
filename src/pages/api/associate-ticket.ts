import { NextApiRequest, NextApiResponse } from 'next'
import db from 'utils/db'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { address, eventId, ticketCode } = req.body

    if (!address || !eventId || !ticketCode) {
      return res.status(400).json({ message: 'Missing required parameters' })
    }

    // Check if event exists
    const event = await db('events').where('id', parseInt(eventId)).first()
    if (!event) {
      return res.status(404).json({ message: 'Event not found' })
    }

    // Check if user exists
    const user = await db('users')
      .whereILike('address', address)
      .where('event_id', parseInt(eventId))
      .first()

    if (!user) {
      return res.status(404).json({ message: 'User not found for this event' })
    }

    // Check if user already has an associated ticket for this event
    const existingTicket = await db('tickets')
      .where({
        event_id: parseInt(eventId),
        user_id: user.id
      })
      .first()

    if (existingTicket) {
      return res.status(400).json({ message: 'You already have an associated ticket for this event' })
    }

    // Check if ticket exists and is valid
    const ticket = await db('tickets')
      .where({
        code: ticketCode.toUpperCase(),
        event_id: parseInt(eventId)
      })
      .first()

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' })
    }

    if (ticket.is_used) {
      return res.status(400).json({ message: 'Ticket has already been used' })
    }

    if (ticket.user_id) {
      return res.status(400).json({ message: 'Ticket is already associated with another user' })
    }

    // Associate ticket with user
    await db('tickets')
      .where('id', ticket.id)
      .update({
        user_id: user.id,
        is_used: true,
        used_at: new Date(),
        updated_at: new Date()
      })

    console.log(`Ticket ${ticketCode} associated with user ${address} for event ${eventId}`)

    res.status(200).json({
      message: 'Ticket successfully associated with user',
      ticketCode,
      userId: user.id,
      eventId: parseInt(eventId)
    })

  } catch (error) {
    console.error('Error associating ticket:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
} 
