import { NextApiRequest, NextApiResponse } from 'next'
import db from 'utils/db'
import { adminWallets, eventId, adminSignatureMessage } from 'config/index'
import { verifyMessage } from 'viem'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { address, isSocialCronActive, adminSignature } = req.body

  if (!address || typeof address !== 'string' || !adminSignature) {
    return res.status(400).json({ message: 'Invalid request' })
  }

  try {
    // Verify if the address is in the adminWallets list
    if (!adminWallets.includes(address.toLowerCase())) {
      return res.status(403).json({ message: 'Unauthorized address' })
    }

    // Verify the signature
    const isValid = await verifyMessage({
      address: address as `0x${string}`,
      message: adminSignatureMessage,
      signature: adminSignature as `0x${string}`,
    })

    if (!isValid) {
      return res.status(403).json({ message: 'Invalid signature' })
    }

    await db.raw(
      `update "events" set "socials" = socials || ? where "id" = ?`,
      [{ isSocialCronActive }, eventId]
    )

    return res.status(200).json({ message: 'Social cron status updated successfully' })
  } catch (error) {
    console.error('Error updating social cron status:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
