interface NotificationDetails {
  url: string
  token: string
}

interface SendNotificationRequest {
  notificationId: string
  title: string
  body: string
  targetUrl?: string
}

interface SendNotificationResponse {
  success: boolean
  message?: string
}

// Store notification tokens in memory (in production, use a database)
const notificationTokens = new Map<string, NotificationDetails>()

// Add a notification token for a user
export function addNotificationToken(userId: string, details: NotificationDetails) {
  notificationTokens.set(userId, details)
  console.log(`📱 Added notification token for user ${userId}`)
}

// Remove a notification token for a user
export function removeNotificationToken(userId: string) {
  notificationTokens.delete(userId)
  console.log(`🗑️ Removed notification token for user ${userId}`)
}

// Send a notification to a specific user
export async function sendNotificationToUser(
  userId: string,
  notification: SendNotificationRequest
): Promise<SendNotificationResponse> {
  const tokenDetails = notificationTokens.get(userId)
  
  if (!tokenDetails) {
    return {
      success: false,
      message: 'User not found or notifications not enabled'
    }
  }

  try {
    const response = await fetch(tokenDetails.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: tokenDetails.token,
        ...notification
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    
    if (result.success) {
      console.log(`✅ Notification sent to user ${userId}: ${notification.title}`)
      return { success: true }
    } else {
      console.error(`❌ Failed to send notification to user ${userId}:`, result.message)
      return { success: false, message: result.message }
    }
  } catch (error) {
    console.error(`❌ Error sending notification to user ${userId}:`, error)
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Send a notification to multiple users
export async function sendNotificationToUsers(
  userIds: string[],
  notification: SendNotificationRequest
): Promise<{ success: boolean; results: Array<{ userId: string; success: boolean; message?: string }> }> {
  const results = await Promise.all(
    userIds.map(async (userId) => {
      const result = await sendNotificationToUser(userId, notification)
      return {
        userId,
        success: result.success,
        message: result.message
      }
    })
  )

  const successCount = results.filter(r => r.success).length
  console.log(`📨 Sent notification to ${successCount}/${userIds.length} users`)

  return {
    success: successCount > 0,
    results
  }
}

// Example usage functions
export async function sendQuestCompletionNotification(userId: string, questName: string) {
  return sendNotificationToUser(userId, {
    notificationId: `quest-completion-${Date.now()}`,
    title: 'Quest Completed! 🎉',
    body: `Congratulations! You've completed the "${questName}" quest.`,
    targetUrl: '/event/2/onboarding'
  })
}

export async function sendEventReminderNotification(userId: string, eventName: string) {
  return sendNotificationToUser(userId, {
    notificationId: `event-reminder-${Date.now()}`,
    title: 'Event Reminder 📅',
    body: `Don't forget about "${eventName}"! Complete your quests to earn rewards.`,
    targetUrl: '/event/2'
  })
}

export async function sendLeaderboardUpdateNotification(userId: string, rank: number) {
  return sendNotificationToUser(userId, {
    notificationId: `leaderboard-update-${Date.now()}`,
    title: 'Leaderboard Update 🏆',
    body: `You're now ranked #${rank} on the leaderboard! Keep up the great work.`,
    targetUrl: '/event/2/leaderboard'
  })
} 
