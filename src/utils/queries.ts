import db from './db'
import { Tasks } from 'entities/profile'

export const getTasks = async (eventId: number): Promise<Tasks> => {
  const {
    data_en: { tasks },
  } = await db('events').where('id', eventId).first().select('data_en')
  return tasks || {}
}
