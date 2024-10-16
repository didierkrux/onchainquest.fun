export type AgendaItem = {
  time: string
  title: string
  location: string
}

export type Sponsor = {
  name: string
  description: string
  link: string
  image: string
}

export type Booth = {
  name: string
  description: string
}

export type Venue = {
  name: string
  image: string
}

export type Prize = {
  name: string
  description: string
}

export type TaskAction =
  | 'connect-wallet'
  | 'setup-profile'
  | 'claim-poap'
  | 'secret-word'
  | 'click-link'
  | 'claim-tokens'
  | 'swap-tokens'
  | 'poap-picture'

export type Quest = {
  id: number
  name: string
  points: number
  description: string
  action: TaskAction
  condition?: string
  actionField?: React.ReactNode
}

export const Empty = {
  agenda: [],
  sponsors: [],
  booths: [],
  venue: [],
  prizes: [],
  tasks: [],
}

export interface Event {
  agenda: AgendaItem[]
  sponsors: Sponsor[]
  booths: Booth[]
  venue: Venue[]
  prizes: Prize[]
  tasks: Quest[]
}

export interface EventData {
  data_en: Event
  data_tr: Event
}
