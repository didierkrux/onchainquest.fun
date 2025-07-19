/* eslint-disable no-console */
import { NextApiRequest, NextApiResponse } from 'next'

import { fetchPotionData, translateData, verifySignature } from 'utils/index'
import db from 'utils/db'
import { adminSignatureMessage, adminWallets } from 'config/index'

export const maxDuration = 90 // 90 seconds

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    const { signature, address, eventId } = req.query

    if (!signature || !address || typeof signature !== 'string' || typeof address !== 'string') {
      return res.status(400).json({ message: 'Invalid signature or address' })
    }

    // Verify if the address is in the adminWallets list
    if (!adminWallets.includes(address.toLowerCase())) {
      return res.status(403).json({ message: 'Unauthorized address' })
    }

    // Verify the signature
    const isValid = await verifySignature({
      address: address as string,
      message: adminSignatureMessage,
      signature: signature as string,
      alchemyKey: process.env.ALCHEMY_API_KEY,
    })

    if (!isValid) {
      return res.status(403).json({ message: 'Invalid signature' })
    }

    const data = await fetchPotionData(parseInt(eventId as string))
    console.log('data', data)
    // save to db
    await db('events').update({ data_en: data }).where('id', parseInt(eventId as string))
    res.status(200).json({ message: 'English data synced successfully' })

    // const translatedData = await translateData(data, 'Thai')
    // if (translatedData) {
    //   console.log('translatedData', translatedData)

    //   // save to db
    //   await db('events').update({ data_en: data, data_tr: translatedData })
    //   res.status(200).json({ message: 'Data synced successfully' })
    // } else {
    //   res.status(200).json({ message: 'Issue with translation' })
    // }
  } catch (error) {
    console.error('Error syncing data:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
