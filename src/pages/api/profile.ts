/* eslint-disable no-console */
import { NextApiRequest, NextApiResponse } from 'next'

import db from 'utils/db'
import { eventId } from 'config'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const { address } = req.query
  const { username, taskId } = req.body
  console.log('req.query', req.query)
  console.log('req.body', req.body)
  console.log('req.method', req.method)
  console.log('address', address)
  console.log('username', username)
  console.log('taskId', taskId)

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ message: 'Invalid address' })
  }

  if (req.method === 'POST' && taskId > 0) {
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

    const eventTasks = data?.data_en?.tasks
    const eventTasksArray = eventTasks.map((task: any) => task.id)
    const userTasks = data?.tasks
    console.log('eventTasks', eventTasks)
    console.log('userTasks', userTasks)
    if (!(taskId in eventTasksArray)) {
      return res.status(400).json({ message: 'Invalid task' })
    }
    // update profile: username + avatar
    if (taskId === 2 && username?.length > 0) {
      // check if username already exists
      const userWithUsername = await db('users')
        .select('*')
        .where('event_id', eventId)
        .whereILike('username', username)
        .first()
      if (userWithUsername) {
        return res.status(400).json({ message: 'Username already exists' })
      }
      const taskToSave = eventTasks[taskId]
      console.log('taskToSave', taskToSave)
      userTasks[taskId.toString()] = { isCompleted: true, points: taskToSave.points }
      console.log('userTasks', userTasks)
    }
    // calculate score
    const score = Object.values(userTasks).reduce((acc, task: any) => acc + task?.points, 0)
    const profileToSave = { username, score, tasks: userTasks }

    console.log('Saving profile', profileToSave)
    const [profile] = await db('users')
      .update(profileToSave)
      .where('event_id', eventId)
      .whereILike('address', address)
      .returning('*')
    return res.status(200).json(profile)
  } else {
    try {
    const profile = await db('users')
      .select('*')
      .where('event_id', eventId)
      .whereILike('address', address)
      .first()

    if (!profile) {
      const profileToSave = { event_id: eventId, address, score: 5, tasks: { 1: { isCompleted: true, points: 5 } } }
      console.log('Saving profile', profileToSave)

      const [profile] = await db('users')
        .insert(profileToSave)
        .returning('*')
      return res.status(200).json(profile)
    }

    res.status(200).json(profile)
  } catch (error) {
      console.error('Error fetching profile:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  }
}
