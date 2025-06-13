// default event id
export const eventId = parseInt(process.env.NEXT_PUBLIC_EVENT_ID || '2')

export const eventName = process.env.NEXT_PUBLIC_EVENT_NAME || 'New to Web3'

export const ENS_DOMAIN = 'newtoweb3.eth'

export const eventDescription =
  process.env.NEXT_PUBLIC_EVENT_DESCRIPTION ||
  '"New to Web3? Start Here" is a day of activities to get you from 0 to 1 in Web3'

export const adminWallets = [
  '0xBD19a3F0A9CaCE18513A1e2863d648D13975CB30'.toLowerCase(), // didierkrux.eth
  '0xb749A586080436e616f097f193Ba9CB6A25E7Ea6'.toLowerCase(), // ornellaweb3.eth
]

export const adminSignatureMessage = `I'm verifying my wallet signature.`

// Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID

export const potionUrl = 'https://potion.banklessacademy.com/table?id=37a9e401c55747d29af74e5d4d9f5c5b'

if (!projectId) {
  throw new Error('Project ID is not defined')
}

export const MENU = [
  {
    label: 'Event',
    href: '/event/[eventId]',
  },
  {
    label: 'Social',
    href: '/event/[eventId]/social',
  },
  {
    label: 'Onboarding',
    href: '/event/[eventId]/onboarding',
  },
  {
    label: 'Leaderboard',
    href: '/event/[eventId]/leaderboard',
  },
  {
    label: 'Profile',
    href: '/event/[eventId]/profile',
  },
]

export const IS_PROD = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'

export const DOMAIN_URL =
  process.env.NODE_ENV === 'development'
    ? `http://localhost:3000`
    : IS_PROD
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
      : `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
