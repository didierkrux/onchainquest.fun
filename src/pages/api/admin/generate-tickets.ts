/* eslint-disable no-console */
import { NextApiRequest, NextApiResponse } from 'next'
import { verifyMessage } from 'viem'

import db from 'utils/db'
import { adminSignatureMessage, adminWallets } from 'config/index'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { signature, address, eventId, count = 10 } = req.body

    if (!signature || !address || !eventId) {
      return res.status(400).json({ message: 'Missing required parameters' })
    }

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

    // Validate count parameter
    const ticketCount = parseInt(count as string)
    if (isNaN(ticketCount) || ticketCount < 1 || ticketCount > 100) {
      return res.status(400).json({ message: 'Count must be between 1 and 100' })
    }

    // Check if event exists
    const event = await db('events').where('id', parseInt(eventId as string)).first()
    if (!event) {
      return res.status(404).json({ message: 'Event not found' })
    }

    // Generate random ticket codes
    const generateTicketCode = (): string => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let result = ''
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }

    // Generate unique codes
    const ticketCodes: string[] = []
    const existingCodes = await db('tickets').where('event_id', parseInt(eventId as string)).pluck('code')

    while (ticketCodes.length < ticketCount) {
      const code = generateTicketCode()
      if (!existingCodes.includes(code) && !ticketCodes.includes(code)) {
        ticketCodes.push(code)
      }
    }

    // Insert tickets into database
    const ticketsToInsert = ticketCodes.map(code => ({
      event_id: parseInt(eventId as string),
      code,
      is_used: false,
      created_at: new Date(),
      updated_at: new Date()
    }))

    await db('tickets').insert(ticketsToInsert)

    console.log(`Generated ${ticketCount} tickets for event ${eventId}`)

    res.status(200).json({
      message: `Successfully generated ${ticketCount} ticket codes`,
      tickets: ticketCodes,
      eventId: parseInt(eventId as string)
    })

  } catch (error) {
    console.error('Error generating tickets:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
} 
