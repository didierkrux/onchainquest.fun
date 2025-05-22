/* eslint-disable no-console */
import { NextApiRequest, NextApiResponse } from 'next'

import db from 'utils/db'
import { calculateScore, userHasPoap, userHasSwappedTokens, userHasNft, verifyBalance, verifyTokenSend } from 'utils/index'
import { getTasks } from 'utils/queries'
import { TaskAction } from 'entities/data'
import { getBasename } from 'utils/basenames'
import { getBasenameAvatar } from 'utils/basenames'

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
        return res.status(400).json({ message: "You don't own this POAP." })
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
    } else if (taskAction === 'send-tokens') {
      const targetAddress = '0x767D1AF42CC93E15E72aFCF15477733C66e5460a';
      const amount = '0.00001';
      const hasSentTokens = await verifyTokenSend(address, targetAddress, amount);
      if (hasSentTokens) {
        userTasks[taskIdNum.toString()] = { id: taskIdNum, isCompleted: true, points: taskToSave.points }
        console.log('userTasks', userTasks)
      } else {
        return res.status(400).json({ message: "You haven't sent 0.00001 ETH to the specified address yet." })
      }
    } else {
      return res.status(400).json({ message: 'Task not available yet.' })
    }
    // getMoments -> check if user posted a moment
    // calculate score
    const score = calculateScore(userTasks, tasks)
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

      res.status(200).json({ ...profile, isSocialCronActive })
    } catch (error) {
      console.error('Error fetching profile:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  }
}
