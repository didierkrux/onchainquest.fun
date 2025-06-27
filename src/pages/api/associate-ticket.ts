import { NextApiRequest, NextApiResponse } from 'next'
import { EAS, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk'
import { ethers } from 'ethers'
import db from 'utils/db'

const RPC_URL = process.env.ALCHEMY_API_KEY
  ? `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
  : 'https://mainnet.base.org'

const OWNER_ADDRESS = process.env.OWNER_ADDRESS as string
const PRIVATE_KEY = process.env.PRIVATE_KEY as string

// EAS configuration
const easContractAddress = "0x4200000000000000000000000000000000000021"
const schemaUID = "0xef1b64c8b49daf8ba1832fc590798e0af6f9a81cc345bfb2f2f44598b74d01f5"

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

    // Generate EAS attestation
    let attestationTxLink = null
    try {
      // Create provider and signer
      const provider = new ethers.JsonRpcProvider(RPC_URL)
      const signer = new ethers.Wallet(PRIVATE_KEY, provider)

      // Initialize EAS
      const eas = new EAS(easContractAddress)
      await eas.connect(signer)

      // Initialize SchemaEncoder with the schema string
      const schemaEncoder = new SchemaEncoder("string eventName,string eventLocation,bytes32 eventID,uint64 checkInTime,bytes32 ticketID")

      // Get current timestamp
      const checkInTime = Math.floor(Date.now() / 1000)

      // Encode the attestation data
      const encodedData = schemaEncoder.encodeData([
        { name: "eventName", value: "Onchain quest: EthCC", type: "string" },
        { name: "eventLocation", value: "Cannes, France", type: "string" },
        { name: "eventID", value: "OQ-ETHCC", type: "bytes32" },
        { name: "checkInTime", value: BigInt(checkInTime), type: "uint64" },
        { name: "ticketID", value: ticketCode.toUpperCase(), type: "bytes32" }
      ])

      // Create the attestation
      const tx = await eas.attest({
        schema: schemaUID,
        data: {
          recipient: address,
          expirationTime: BigInt(0),
          revocable: true,
          data: encodedData,
        },
      })

      // Wait for transaction to be mined and get the attestation UID
      const attestationUID = await tx.wait()
      console.log("New attestation UID:", attestationUID)
      attestationTxLink = `https://basescan.org/tx/${attestationUID}`

    } catch (error) {
      console.error('Error generating attestation:', error)
      // Continue with ticket association even if attestation fails
    }

    // Associate ticket with user
    await db('tickets')
      .where('id', ticket.id)
      .update({
        user_id: user.id,
        is_used: true,
        used_at: new Date(),
        attestation_tx_link: attestationTxLink,
        updated_at: new Date()
      })

    console.log(`Ticket ${ticketCode} associated with user ${address} for event ${eventId}`)

    res.status(200).json({
      message: 'Ticket successfully associated with user',
      ticketCode,
      userId: user.id,
      eventId: parseInt(eventId),
      attestationTxLink
    })

  } catch (error) {
    console.error('Error associating ticket:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
} 
