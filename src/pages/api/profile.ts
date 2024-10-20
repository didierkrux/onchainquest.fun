/* eslint-disable no-console */
import { NextApiRequest, NextApiResponse } from 'next'

import db from 'utils/db'
import { eventId } from 'config/index'
import { calculateScore, userHasPoap, userHasSwappedTokens } from 'utils/index'
import { getTasks } from 'utils/queries'
import { TaskAction } from 'entities/data'
import { getBasename } from 'utils/basenames'
import { getBasenameAvatar } from 'utils/basenames'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const { address } = req.query
  const { username, avatar, role, taskId } = req.body
  console.log('req.query', req.query)
  console.log('req.body', req.body)
  console.log('req.method', req.method)
  console.log('address', address)
  console.log('username', username)
  console.log('avatar', avatar)
  console.log('role', role)
  console.log('taskId', taskId)

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ message: 'Invalid address' })
  }

  // Include task 7 (own-basename) in the POST method handling
  if (req.method === 'POST' && taskId && taskId >= 0) {
    // get tasks + profile
    const data = await db('events')
      .leftJoin('users', 'users.event_id', 'events.id')
      .select('events.data_en', 'users.tasks')
      .where('events.id', eventId)
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
    if (!(taskId in tasksArray)) {
      return res.status(400).json({ message: 'Invalid task' })
    }
    const taskAction: TaskAction = tasks[taskId].action
    console.log('taskAction', taskAction)
    const taskCondition = tasks[taskId].condition
    console.log('taskCondition', taskCondition)

    const taskToSave = tasks[taskId]
    console.log('taskToSave', taskToSave)

    // update profile (username + avatar)
    if (taskAction === 'setup-profile') {
      // check if username already exists
      if (username?.length > 0) {
      const userWithUsername = await db('users')
        .select('*')
        .where('event_id', eventId)
        .whereILike('username', username)
        .first()
        if (userWithUsername && userWithUsername.address?.toLowerCase() !== address?.toLowerCase()) {
          return res.status(400).json({ message: 'Username already exists' })
        }
      }
      userTasks[taskId.toString()] = { id: taskId, isCompleted: true, points: taskToSave.points }
      console.log('userTasks', userTasks)
    } else if (taskAction === 'claim-poap') {
      const poapId = taskCondition
      console.log('poapId', poapId)
      const hasPoap = await userHasPoap(address, poapId)
      console.log('hasPoap', hasPoap)
      if (hasPoap) {
        userTasks[taskId.toString()] = { id: taskId, isCompleted: true, points: taskToSave.points }
        console.log('userTasks', userTasks)
      } else {
        return res.status(400).json({ message: 'You do not have a POAP for this event' })
      }
    } else if (taskAction === 'click-link') {
      userTasks[taskId.toString()] = { id: taskId, isCompleted: true, points: taskToSave.points }
      console.log('userTasks', userTasks)
    } else if (taskAction === 'swap-tokens') {
      const swapCompleted = await userHasSwappedTokens(address, taskCondition)
      console.log('swapCompleted', swapCompleted)
      if (swapCompleted) {
        userTasks[taskId.toString()] = { id: taskId, isCompleted: true, points: taskToSave.points }
        console.log('userTasks', userTasks)
      } else {
        return res.status(400).json({ message: 'You have not swapped your tokens yet' })
      }
    } else if (taskAction === 'own-basename') {
      // Handle the 'own-basename' task here
      const basename = await getBasename(address as `0x${string}`)
      if (basename?.endsWith('.base.eth')) {
        userTasks[taskId.toString()] = { id: taskId, isCompleted: true, points: taskToSave.points }
        console.log('userTasks', userTasks)
      } else {
        return res.status(400).json({ message: 'You do not own a .base.eth basename' })
      }
    } else {
      return res.status(400).json({ message: 'Task not available yet.' })
    }
    // getMoments -> check if user posted a moment
    // calculate score
    const score = calculateScore(userTasks)
    const profileToSave = { username, avatar, role, score, tasks: userTasks }

    console.log('Saving profile', profileToSave)
    try {
      const updatedProfile = await db('users')
        .where('event_id', eventId)
        .whereILike('address', address)
        .update(profileToSave)
        .returning('*')

      if (updatedProfile && updatedProfile.length > 0) {
        return res.status(200).json(updatedProfile[0])
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
      .where('event_id', eventId)
      .whereILike('address', address)
      .first()

      if (!profile) {
        // task 0: connect-wallet
        const tasks = await getTasks(eventId)
        const taskAction = 'connect-wallet'
        const taskId = Object.values(tasks).findIndex((task: any) => task.action === taskAction)
        console.log('taskId', taskId)
        const userTasks = { [taskId]: { id: taskId, isCompleted: true, points: tasks[taskId].points } }
        const score = calculateScore(userTasks)
        const profileToSave = { event_id: eventId, address, score, tasks: userTasks }
        console.log('Saving profile', profileToSave)

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
          const tasks = await getTasks(eventId)
          const taskAction = 'own-basename'
          const taskId = Object.values(tasks).findIndex((task: any) => task.action === taskAction)
          console.log('taskId', taskId)
          userTasks[taskId.toString()] = { id: taskId, isCompleted: true, points: tasks[taskId].points }
          const score = calculateScore(userTasks)
          profile = await db('users')
            .where('event_id', eventId)
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
            .where('event_id', eventId)
            .whereILike('address', address)
            .update({ basename_avatar })
            .returning('*')
            .then(rows => rows[0])
        }
      }
      console.log('profile', profile)

      res.status(200).json(profile)
    } catch (error) {
      console.error('Error fetching profile:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  }
}
