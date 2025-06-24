/* eslint-disable no-console */
import { NextApiRequest, NextApiResponse } from 'next'

import db from 'utils/db'
import { calculateScore, userHasPoap, userHasSwappedTokens, userHasNft, verifyBalance, verifyTokenSend } from 'utils/index'
import { getTasks } from 'utils/queries'
import { TaskAction } from 'entities/data'
import { getBasename } from 'utils/basenames'
import { getBasenameAvatar } from 'utils/basenames'
import { BOOTH_DATA } from 'config'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const { address, eventId, taskId } = req.query
  const { username, avatar, role, email } = req.body
  console.log('req.query', req.query)
  console.log('req.body', req.body)
  console.log('req.method', req.method)
  console.log('address', address)
  console.log('username', username)
  console.log('avatar', avatar)
  console.log('role', role)
  console.log('email', email)
  console.log('taskId', taskId)
  const taskIdNum = parseInt(taskId as string, 10)
  console.log('taskIdNum', taskIdNum)
  if (!address || typeof address !== 'string') {
    return res.status(400).json({ message: 'Invalid address' })
  }

  if (!eventId || typeof eventId !== 'string') {
    return res.status(400).json({ message: 'Event ID is required' })
  }

  const eventIdNum = parseInt(eventId, 10)
  if (isNaN(eventIdNum)) {
    return res.status(400).json({ message: 'Invalid Event ID format' })
  }

  const { socials: { isSocialCronActive } } = await db('events')
    .select('socials')
    .where('id', eventIdNum)
    .first()

  console.log('isSocialCronActive', isSocialCronActive)

  // Include task 7 (own-basename) in the POST method handling
  if (req.method === 'POST' && taskIdNum >= 0) {
    // get tasks + profile
    const data = await db('events')
      .leftJoin('users', 'users.event_id', 'events.id')
      .select('events.data_en', 'users.tasks', 'users.username', 'users.basename')
      .where('events.id', eventIdNum)
      .whereILike('users.address', address)
      .first()

    console.log('data', data);

    if (!data || !data?.data_en || !data?.tasks) {
      return res.status(400).json({ message: 'Profile not found' })
    }

    const tasks = data?.data_en?.tasks
    const tasksArray = tasks.map((task: any) => task.id)
    const userTasks = data?.tasks || {} // Ensure userTasks is an object
    console.log('tasks', tasks)
    console.log('userTasks', userTasks)
    if (!(taskIdNum in tasksArray)) {
      return res.status(400).json({ message: 'Invalid task' })
    }
    const taskAction: TaskAction = tasks[taskIdNum].action
    console.log('taskAction', taskAction)
    const taskCondition = tasks[taskIdNum].condition
    console.log('taskCondition', taskCondition)

    const taskToSave = tasks[taskIdNum]
    console.log('taskToSave', taskToSave)

    // update profile (username + avatar)
    if (taskAction === 'setup-profile') {
      // check if username already exists
      if (username?.length > 0) {
      const userWithUsername = await db('users')
        .select('*')
        .where('event_id', eventIdNum)
        .whereILike('username', username)
        .orWhereILike('basename', username)
        .first()
        if (userWithUsername && userWithUsername.address?.toLowerCase() !== address?.toLowerCase()) {
          return res.status(400).json({ message: 'Username already exists' })
        }
      } else if (!data.username?.length && !data.basename?.length) {
        return res.status(400).json({ message: 'Username is required' })
      }
      userTasks[taskIdNum.toString()] = { id: taskIdNum, isCompleted: true, points: taskToSave.points }
      console.log('userTasks', userTasks)
    } else if (taskAction === 'claim-poap') {
      const poapId = taskCondition
      console.log('poapId', poapId)
      const hasPoap = await userHasPoap(address, poapId)
      console.log('hasPoap', hasPoap)
      if (hasPoap) {
        userTasks[taskIdNum.toString()] = { id: taskIdNum, isCompleted: true, points: taskToSave.points }
        console.log('userTasks', userTasks)
      } else {
        return res.status(400).json({ message: "You don't own this POAP yet. Tap your phone to the black IYK 🛜 POAP disk to claim it." })
      }
    } else if (taskAction === 'click-link') {
      userTasks[taskIdNum.toString()] = { id: taskIdNum, isCompleted: true, points: taskToSave.points }
      console.log('userTasks', userTasks)
    } else if (taskAction === 'verify-balance') {
      const [tokenAddress, minBalance, tokenName] = taskCondition?.split(',')
      const userHasEnoughBalance = await verifyBalance(address, tokenAddress, minBalance)
      if (userHasEnoughBalance) {
        userTasks[taskIdNum.toString()] = { id: taskIdNum, isCompleted: true, points: taskToSave.points }
        console.log('userTasks', userTasks)
      } else {
        return res.status(400).json({ message: `You need to own at least ${minBalance} ${tokenName} on Optimism.` })
      }
    } else if (taskAction === 'swap-tokens') {
      const swapCompleted = await userHasSwappedTokens(address, taskCondition)
      console.log('swapCompleted', swapCompleted)
      if (swapCompleted) {
        userTasks[taskIdNum.toString()] = { id: taskIdNum, isCompleted: true, points: taskToSave.points }
        console.log('userTasks', userTasks)
      } else {
        return res.status(400).json({ message: 'You have not swapped your tokens yet' })
      }
    } else if (taskAction === 'own-basename') {
      // Handle the 'own-basename' task here
      const basename = await getBasename(address as `0x${string}`)
      if (basename?.endsWith('.base.eth')) {
        userTasks[taskIdNum.toString()] = { id: taskIdNum, isCompleted: true, points: taskToSave.points }
        console.log('userTasks', userTasks)
      } else {
        return res.status(400).json({ message: "You don't own a .base.eth basename." })
      }
    } else if (taskAction === 'mint-nft') {
      // base:0x87c3e3bbde274f5a0e27cded29df1f7526de85ec/1
      const [network, contract, tokenId] = taskCondition?.replace(':', '/')?.split('/')
      // verify ownership
      const hasNft = await userHasNft(address, network, contract, tokenId)
      if (hasNft) {
        userTasks[taskIdNum.toString()] = { id: taskIdNum, isCompleted: true, points: taskToSave.points, nftLink: taskCondition }
        console.log('userTasks', userTasks)
      } else {
        return res.status(400).json({ message: "You don't own this NFT." })
      }
    } else if (taskAction === 'booth-checkin') {
      const { qrCode } = req.query

      if (!qrCode || typeof qrCode !== 'string') {
        return res.status(400).json({ message: "QR code is required" })
      }

      // Extract booth ID and code from QR code
      // Support new QR code format: https://onchainquest.fun/event/3/booth/6/h3j6l9
      let boothId: string
      let boothCode: string

      try {
        // Parse URL to extract booth ID and code
        const url = new URL(qrCode)
        const pathParts = url.pathname.split('/')

        console.log('QR Code URL:', qrCode)
        console.log('Path parts:', pathParts)

        // Find the index of 'booth' in the path
        const boothIndex = pathParts.findIndex(part => part === 'booth')

        console.log('Booth index:', boothIndex)

        if (boothIndex === -1 || boothIndex + 2 >= pathParts.length) {
          return res.status(400).json({ message: "Invalid QR code format - missing booth information" })
        }

        boothId = pathParts[boothIndex + 1]
        boothCode = pathParts[boothIndex + 2]

        console.log('Extracted booth ID:', boothId)
        console.log('Extracted booth code:', boothCode)

        if (!boothId || !boothCode) {
          return res.status(400).json({ message: "Invalid QR code format - missing booth ID or code" })
        }
      } catch (error) {
        console.error('Error parsing QR code URL:', error)
        return res.status(400).json({ message: "Invalid QR code format - not a valid URL" })
      }

      // Validate the booth code directly against BOOTH_DATA
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

        if (!isValid) {
          return res.status(400).json({ message: "Invalid booth code" })
        }

        // Get existing check-ins or initialize empty array
        const existingCheckins = userTasks[taskIdNum.toString()]?.checkins || []

        // Check if this booth was already checked in
        if (existingCheckins.includes(boothId)) {
          return res.status(400).json({ message: `You have already checked in at booth ${boothId}` })
        }

        // Add new booth to check-ins
        const updatedCheckins = [...existingCheckins, boothId]
        const totalPoints = taskToSave.points * updatedCheckins.length

        // Task is only complete when ALL booths have been checked in
        const allBoothIds = Object.keys(BOOTH_DATA)
        const isCompleted = allBoothIds.every(boothId => updatedCheckins.includes(boothId))

        // For booth check-in, we need to store the cumulative points since calculateScore uses task.points
        // We mark it as completed for scoring purposes even if not all booths are checked in
        // This allows points to accumulate as users check in at more booths
        userTasks[taskIdNum.toString()] = {
          id: taskIdNum,
          isCompleted: isCompleted, // Only true when all booths checked in
          points: totalPoints, // Store cumulative points for calculateScore
          checkins: updatedCheckins,
          action: taskAction // Store action for calculateScore to identify booth check-in tasks
        }
        console.log('userTasks', userTasks)
      } catch (error) {
        console.error('Error validating booth code:', error)
        return res.status(500).json({ message: "Failed to validate booth code" })
      }
    } else if (taskAction === 'buy-shop') {
      const [shopUrl, amount, tokenAddress, targetAddress] = taskCondition?.split(',')
      console.log('shopUrl', shopUrl)
      console.log('amount', amount)
      console.log('tokenAddress', tokenAddress)
      console.log('targetAddress', targetAddress)
      const hasSentTokens = await verifyTokenSend(address, targetAddress, amount, tokenAddress);
      if (hasSentTokens) {
        userTasks[taskIdNum.toString()] = { id: taskIdNum, isCompleted: true, points: taskToSave.points }
        console.log('userTasks', userTasks)
      } else {
        return res.status(400).json({ message: "You haven't made a purchase from the shop yet." })
      }
    } else if (taskAction === 'send-tokens') {
      const [amount, tokenAddress, targetAddress] = taskCondition?.split(',')
      console.log('amount', amount)
      console.log('tokenAddress', tokenAddress)
      console.log('targetAddress', targetAddress)
      const hasSentTokens = await verifyTokenSend(address, targetAddress, amount, tokenAddress);
      if (hasSentTokens) {
        userTasks[taskIdNum.toString()] = { id: taskIdNum, isCompleted: true, points: taskToSave.points }
        console.log('userTasks', userTasks)
      } else {
        return res.status(400).json({ message: `You haven't sent ${amount} ${tokenAddress} to the specified address yet.` })
      }
    } else {
      return res.status(400).json({ message: 'Task not available yet.' })
    }
    // getMoments -> check if user posted a moment
    // calculate score
    console.log('Before calculateScore - userTasks:', userTasks)
    console.log('Before calculateScore - tasks:', tasks)
    const score = calculateScore(userTasks, tasks)
    console.log('Calculated score:', score)
    const profileToSave = { username, avatar, role, email, score, tasks: userTasks }

    console.log('Saving profile', profileToSave)
    try {
      const updatedProfile = await db('users')
        .where('event_id', eventIdNum)
        .whereILike('address', address)
        .update(profileToSave)
        .returning('*')

      if (updatedProfile && updatedProfile.length > 0) {
        if (updatedProfile[0]?.email) {
          updatedProfile[0].emailOK = true
          delete updatedProfile[0].email
        }
        return res.status(200).json({ ...updatedProfile[0], isSocialCronActive })
      } else {
        return res.status(404).json({ message: 'Profile not found or not updated' })
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  } else {
    try {
      let profile = await db('users')
      .select('*')
        .where('event_id', eventIdNum)
      .whereILike('address', address)
      .first()

      if (!profile) {
        // task 0: connect-wallet
        const tasks = await getTasks(eventIdNum)
        const taskAction = 'connect-wallet'
        const taskId = Object.values(tasks).findIndex((task: any) => task.action === taskAction)
        console.log('taskId', taskId)
        const userTasks = { [taskId]: { id: taskId, isCompleted: true, points: tasks[taskId].points } }
        const score = calculateScore(userTasks, tasks)
        const profileToSave = { event_id: eventIdNum, address, score, tasks: userTasks }
        console.log('Saving profile', profileToSave)

        // TODO: fix bug where users get created multiple times
        profile = await db('users')
          .insert(profileToSave)
          .returning('*')
          .then(rows => rows[0])
      }
      console.log('profile', profile)

      // Fetch associated tickets for this user
      const associatedTickets = await db('tickets')
        .select('code', 'is_used', 'used_at')
        .where('event_id', eventIdNum)
        .where('user_id', profile.id)
        .orderBy('created_at', 'desc')

      if (!profile.basename) {
        const basename = await getBasename(address as `0x${string}`)
        if (basename?.endsWith('.base.eth')) {
          console.log('updating basename', basename)
          const userTasks = profile.tasks || {} // Ensure userTasks is an object
          console.log('userTasks', userTasks)
          const tasks = await getTasks(eventIdNum)
          const taskAction = 'own-basename'
          const taskId = Object.values(tasks).findIndex((task: any) => task.action === taskAction)
          console.log('taskId', taskId)
          userTasks[taskId.toString()] = { id: taskId, isCompleted: true, points: tasks[taskId].points }
          const score = calculateScore(userTasks, tasks)
          profile = await db('users')
            .where('event_id', eventIdNum)
            .whereILike('address', address)
            .update({ basename, tasks: userTasks, score })
            .returning('*')
            .then(rows => rows[0])
        }
      }
      if (!profile.basename_avatar && profile.basename?.endsWith('.base.eth')) {
        const basename_avatar = await getBasenameAvatar(profile.basename)
        if (basename_avatar) {
          console.log('updating basename_avatar', basename_avatar)
          profile = await db('users')
            .where('event_id', eventIdNum)
            .whereILike('address', address)
            .update({ basename_avatar })
            .returning('*')
            .then(rows => rows[0])
        }
      }
      console.log('profile', profile)

      if (profile?.email) {
        profile.emailOK = true
        delete profile.email
      }

      res.status(200).json({ ...profile, isSocialCronActive, associatedTickets })
    } catch (error) {
      console.error('Error fetching profile:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  }
}
