export const eventId = 1

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
    label: 'Agenda',
    href: '/',
  },
  {
    label: 'Venue',
    href: '/venue',
  },
  {
    label: 'Onboarding',
    href: '/onboarding',
  },
  {
    label: 'Leaderboard',
    href: '/leaderboard',
  },
  {
    label: 'Profile',
    href: '/profile',
  },
]

export const DOMAIN_URL = process.env.NODE_ENV === 'development' ? `http://localhost:3000` : `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
