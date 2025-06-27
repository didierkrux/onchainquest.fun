import { NextApiRequest, NextApiResponse } from 'next'

import db from 'utils/db'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    const { address, eventId, ticketCode } = req.query

    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({ message: 'Invalid eventId' })
    }

    // const { signature, address } = req.query

    // if (!signature || !address || typeof signature !== 'string' || typeof address !== 'string') {
    //   return res.status(400).json({ message: 'Invalid signature or address' })
    // }

    // // Verify if the address is in the adminWallets list
    // if (!adminWallets.includes(address.toLowerCase())) {
    //   return res.status(403).json({ message: 'Unauthorized address' })
    // }

    // // Verify the signature
    // const isValid = await verifyMessage({
    //   address: address as `0x${string}`,
    //   message: adminSignatureMessage,
    //   signature: signature as `0x${string}`,
    // })

    // if (!isValid) {
    //   return res.status(403).json({ message: 'Invalid signature' })
    // }

    // If ticketCode is provided, reset specific ticket
    if (ticketCode && typeof ticketCode === 'string') {
      // Check if ticket exists
      const ticket = await db('tickets')
        .where({
          code: ticketCode.toUpperCase(),
          event_id: parseInt(eventId)
        })
        .first()

      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' })
      }

      // Reset ticket
      const updatedCount = await db('tickets')
        .where({
          code: ticketCode.toUpperCase(),
          event_id: parseInt(eventId)
        })
        .update({
          user_id: null,
          is_used: false,
          used_at: null,
          attestation_tx_link: null,
          updated_at: new Date()
        })

      return res.status(200).json({
        message: `Reset ticket ${ticketCode} for event ${eventId}`,
        ticketCode: ticketCode.toUpperCase(),
        eventId: parseInt(eventId)
      })
    }

    // If address is provided, reset user profile and associated tickets
    if (address && typeof address === 'string') {
      // Get user first to get their ID
      const user = await db('users')
        .where('event_id', parseInt(eventId))
        .whereILike('address', address)
        .first()

      if (!user) {
        return res.status(404).json({ message: 'User not found' })
      }

      // Update user profile
      const updatedCount = await db('users')
        .where('event_id', parseInt(eventId))
        .whereILike('address', address)
        .update({
          tasks: { "0": { "id": 0, "points": 20, "isCompleted": true } },
          score: 20
        })

      // Reset associated tickets
      const resetTicketsCount = await db('tickets')
        .where({
          event_id: parseInt(eventId),
          user_id: user.id
        })
        .update({
          user_id: null,
          is_used: false,
          used_at: null,
          attestation_tx_link: null,
          updated_at: new Date()
        })

      return res.status(200).json({
        message: `Reset ${updatedCount} user(s) with address ${address}`,
        ticketsReset: resetTicketsCount
      })
    }

    return res.status(400).json({ message: 'Either address or ticketCode must be provided' })
  } catch (error) {
    console.error('Error resetting profile/ticket:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
