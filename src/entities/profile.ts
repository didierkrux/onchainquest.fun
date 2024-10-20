export type Task = {
  id: number
  points: number
  isCompleted: boolean
  txLink?: string
  condition?: string
}

export type Tasks = { [key: string]: Task }

export type Profile = {
  address: string
  username: string
  avatar: string
  role: string
  score: number
  tasks: Tasks
  basename?: string
  basename_avatar?: string
}
