import { NextApiRequest, NextApiResponse } from 'next'

import db from 'utils/db'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    const { address, eventId } = req.query

    if (!address || typeof address !== 'string') {
      return res.status(400).json({ message: 'Invalid address' })
    }

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

    // Update user profile instead of deleting
    const updatedCount = await db('users')
      .where('event_id', eventId)
      .whereILike('address', address)
      .update({
        tasks: { "0": { "id": 0, "points": 20, "isCompleted": true } },
        score: 20
      })

    res.status(200).json({ message: `Reset ${updatedCount} user(s) with address ${address}` })
  } catch (error) {
    console.error('Error resetting profile:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
