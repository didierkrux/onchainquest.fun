import { NextApiRequest, NextApiResponse } from 'next'
import db from 'utils/db'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { ticketCode, eventId } = req.query

  // Validate required parameters
  if (!ticketCode || typeof ticketCode !== 'string') {
    return res.status(400).json({
      valid: false,
      message: 'Ticket code is required'
    })
  }

  if (!eventId || typeof eventId !== 'string') {
    return res.status(400).json({
      valid: false,
      message: 'Event ID is required'
    })
  }

  try {
    // Check if ticket exists in database
    const ticket = await db('tickets')
      .where({
        code: ticketCode.toUpperCase(),
        event_id: parseInt(eventId)
      })
      .first()

    if (!ticket) {
      return res.status(404).json({
        valid: false,
        message: 'Ticket not found'
      })
    }

    // Check if ticket has already been used
    if (ticket.is_used) {
      // Get ticket owner information even for used tickets
      let ticketOwner = null
      if (ticket.user_id) {
        ticketOwner = await db('users')
          .where('id', ticket.user_id)
          .first()
      }

      return res.status(400).json({
        valid: false,
        message: 'Ticket has already been used',
        usedAt: ticket.used_at,
        ticketOwner: ticketOwner ? {
          address: ticketOwner.address,
          username: ticketOwner.username,
          subname: ticketOwner.subname,
          basename: ticketOwner.basename
        } : null
      })
    }

    // Get event information
    const event = await db('events')
      .where('id', parseInt(eventId))
      .first()

    // Get ticket owner information if ticket is associated
    let ticketOwner = null
    if (ticket.user_id) {
      ticketOwner = await db('users')
        .where('id', ticket.user_id)
        .first()
    }

    return res.status(200).json({
      valid: true,
      ticketId: ticket.id,
      ticketCode: ticket.code,
      eventId: ticket.event_id,
      eventName: event?.name || 'Unknown Event',
      isUsed: ticket.is_used,
      ticketOwner: ticketOwner ? {
        address: ticketOwner.address,
        username: ticketOwner.username,
        subname: ticketOwner.subname,
        basename: ticketOwner.basename
      } : null,
      message: 'Ticket is valid'
    })

  } catch (error) {
    console.error('Error validating ticket code:', error)
    return res.status(500).json({
      valid: false,
      message: 'Internal server error'
    })
  }
} 
