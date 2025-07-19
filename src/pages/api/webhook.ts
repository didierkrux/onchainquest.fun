import { NextApiRequest, NextApiResponse } from 'next'
import { addNotificationToken, removeNotificationToken } from 'utils/miniapp-notifications'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = req.body
    console.log('📨 Webhook received:', body)

    // Extract user ID from the signed payload (in production, verify the signature)
    // For now, we'll use a placeholder - you should extract the actual FID
    const userId = body.fid || 'unknown-user'

    // Handle different event types
    switch (body.event) {
      case 'miniapp_added':
        console.log('✅ Mini App added by user:', userId)
        if (body.notificationDetails) {
          console.log('🔔 Notifications enabled with token:', body.notificationDetails.token)
          addNotificationToken(userId, body.notificationDetails)
        }
        break

      case 'miniapp_removed':
        console.log('❌ Mini App removed by user:', userId)
        removeNotificationToken(userId)
        break

      case 'notifications_enabled':
        console.log('🔔 Notifications enabled for user:', userId)
        if (body.notificationDetails) {
          console.log('📱 New notification token:', body.notificationDetails.token)
          addNotificationToken(userId, body.notificationDetails)
        }
        break

      case 'notifications_disabled':
        console.log('🔕 Notifications disabled for user:', userId)
        removeNotificationToken(userId)
        break

      default:
        console.log('❓ Unknown event type:', body.event)
    }

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('❌ Webhook error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
} 
