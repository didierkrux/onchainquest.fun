// default event id
export const eventId = parseInt(process.env.NEXT_PUBLIC_EVENT_ID || '2')

export const eventName = process.env.NEXT_PUBLIC_EVENT_NAME || 'New to Web3'

export const ENS_DOMAIN = 'newtoweb3.eth'

export const eventDescription =
  process.env.NEXT_PUBLIC_EVENT_DESCRIPTION ||
  '"New to Web3? Start Here" is a day of activities to get you from 0 to 1 in Web3'

export const adminWallets = [
  '0xBD19a3F0A9CaCE18513A1e2863d648D13975CB30'.toLowerCase(), // didierkrux.eth
  '0x479FeE75Dab026070c29c3b55bf16B54E1fCd7f1'.toLowerCase(), // didierkrux embedded
  '0x8354bBDB59262AA489E5663f24699d126986Da92'.toLowerCase(), // didierkrux FC
  '0x1B15A52532712a430e3869f97B4697f36AB0b32E'.toLowerCase(), // didierkrux Base smart wallet
  '0xcaa931B1d91ADD3c26B80f51dEA5dfdaaa00FCba'.toLowerCase(), // didierkrux privy
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

export const BOOTH_DATA = {
  '1': {
    name: 'Setup your wallet',
    description: 'Create a wallet and connect it to the app',
    code: 'k9m2x7',
  },
  '2': {
    name: 'Crypto onramp',
    description: 'Buy crypto with fiat',
    code: 'p4n8q1',
  },
  '3': {
    name: 'Get an ENS name',
    description: 'Get an ENS name',
    code: 'r6t3v9',
  },
  '4': {
    name: 'Swap tokens',
    description: 'Swap your crypto',
    code: 'w2y5z8',
  },
  '5': {
    name: 'Buy NFTs',
    description: 'Buy NFTs',
    code: 'a7c4f1',
  },
  '6': {
    name: 'Do a onchain loan',
    description: 'Do a onchain loan',
    code: 'h3j6l9',
  },
}
export const PROJECT_WALLET_TYPE: 'privy' | 'walletconnect' = 'privy'
