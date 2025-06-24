import { NextApiRequest, NextApiResponse } from 'next'
import { verifyMessage } from 'viem'
import db from 'utils/db'
import { adminSignatureMessage, adminWallets } from 'config'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { eventId, signature, address } = req.query

    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({ message: 'Event ID is required' })
    }

    // If signature and address are provided, verify admin access
    if (signature && address && typeof signature === 'string' && typeof address === 'string') {
      // Verify if the address is in the adminWallets list
      if (!adminWallets.includes(address.toLowerCase())) {
        return res.status(403).json({ message: 'Unauthorized address' })
      }

      // Verify the signature
      const isValid = await verifyMessage({
        address: address as `0x${string}`,
        message: adminSignatureMessage,
        signature: signature as `0x${string}`,
      })

      if (!isValid) {
        return res.status(403).json({ message: 'Invalid signature' })
      }
    }

    // Check if event exists
    const event = await db('events').where('id', parseInt(eventId)).first()
    if (!event) {
      return res.status(404).json({ message: 'Event not found' })
    }

    // Fetch all tickets for the event
    const tickets = await db('tickets')
      .where('event_id', parseInt(eventId))
      .orderBy('created_at', 'desc')

    res.status(200).json({
      tickets,
      event: {
        id: event.id,
        name: event.name
      }
    })

  } catch (error) {
    console.error('Error fetching tickets:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
} 
