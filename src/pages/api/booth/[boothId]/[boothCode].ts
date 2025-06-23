import { NextApiRequest, NextApiResponse } from 'next'
import { BOOTH_DATA } from 'config'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { boothId, boothCode } = req.query

  // Validate required parameters
  if (!boothId || typeof boothId !== 'string') {
    return res.status(400).json({
      valid: false,
      message: 'Booth ID is required'
    })
  }

  if (!boothCode || typeof boothCode !== 'string') {
    return res.status(400).json({
      valid: false,
      message: 'Booth code is required'
    })
  }

  try {
    // Check if booth exists in config
    const booth = BOOTH_DATA[boothId as keyof typeof BOOTH_DATA]

    if (!booth) {
      return res.status(404).json({
        valid: false,
        message: 'Booth not found'
      })
    }

    // Check if booth has a code defined
    if (!booth.code) {
      return res.status(400).json({
        valid: false,
        message: 'Booth does not have a validation code'
      })
    }

    // Validate the code (case-insensitive comparison)
    const isValid = booth.code.toLowerCase() === boothCode.toLowerCase()

    return res.status(200).json({
      valid: isValid,
      boothId: boothId,
      boothName: booth.name,
      message: isValid ? 'Code is valid' : 'Code is invalid'
    })

  } catch (error) {
    console.error('Error validating booth code:', error)
    return res.status(500).json({
      valid: false,
      message: 'Internal server error'
    })
  }
} 
