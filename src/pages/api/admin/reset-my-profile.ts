import { NextApiRequest, NextApiResponse } from 'next'
import { verifyMessage } from 'viem'

import db from 'utils/db'
import { adminSignatureMessage, adminWallets, eventId } from 'config/index'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    const { signature, address } = req.query

    if (!signature || !address || typeof signature !== 'string' || typeof address !== 'string') {
      return res.status(400).json({ message: 'Invalid signature or address' })
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

    // Delete all users with the specified address
    const deletedCount = await db('users')
      .where('event_id', eventId)
      .whereILike('address', address)
      .del()

    res.status(200).json({ message: `Deleted ${deletedCount} user(s) with address ${address}` })
  } catch (error) {
    console.error('Error resetting profile:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
