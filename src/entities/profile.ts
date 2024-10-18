export type Task = {
  id: number
  points: number
  isCompleted: boolean
}

export type Profile = {
  address: string
  username: string
  avatar: string
  role: string
  score: number
  tasks: Record<string, Task>
  basename?: string
  basename_avatar?: string
}
