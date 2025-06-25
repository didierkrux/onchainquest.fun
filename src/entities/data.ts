export type ProgramItem = {
  emoji: string
  time: string
  title: string
  location: string
  locationColor: string
  highlight?: boolean
  format: string
  people?: string
}

export type Sponsor = {
  name: string
  // description: string
  sponsorCategory: string
  link: string
  image: string
}

export type Booth = {
  name: string
  description: string
}

export type VenueItem = {
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
  | 'send-tokens'
  | 'verify-balance'
  | 'swap-tokens'
  | 'poap-picture'
  | 'own-basename'
  | 'mint-nft'
  | 'claim-subname'
  | 'booth-checkin'
  | 'buy-shop'
  | 'feedback-form'

export type Quest = {
  id: number
  name: string
  points: number
  description: string
  image?: string
  action: TaskAction
  condition?: string
  actionField?: React.ReactNode
  completedField?: React.ReactNode
  lock?: number
  button?: string
}

export const Empty = {
  program: [],
  sponsors: [],
  booths: [],
  venue: [],
  prizes: [],
  tasks: [],
}

export interface Config {
  eventId: number
  eventName: string
  eventLanguage: string[]
}

export interface Event {
  program: ProgramItem[]
  sponsors: Sponsor[]
  booths: Booth[]
  venue: VenueItem[]
  prizes: Prize[]
  tasks: Quest[]
  config?: Config
}

export interface EventData {
  data_en: Event
  data_tr: Event
  config: Config
}
