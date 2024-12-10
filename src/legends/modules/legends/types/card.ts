export enum CardXpType {
  'global',
  'mainnet',
  'l2'
}

export type CardAction =
  | {
      type: 'calls'
      calls: [string, string, string][]
    }
  | {
      type: 'predefined'
      predefinedId: string
    }
  | {
      type: 'link'
      link: string
    }
  | {
      type: 'wallet-route' // for opening connected wallet urls
      route: string
    }

export enum CardType {
  'oneTime',
  'daily',
  'recurring',
  'weekly'
}

export enum CardStatus {
  'active',
  'disabled',
  'completed'
}

export type Networks = 'ethereum' | 'optimism' | 'base' | 'scroll' | 'arbitrum'
export interface CardXp {
  type: CardXpType
  from: number
  to: number
  minUsdThreshold: number
  chains: Networks[] | null
}

export interface CardFromResponse {
  title: string
  description: string
  flavor: string
  xp: CardXp[]
  action: CardAction
  card: {
    type: CardType
    status: CardStatus
  }
  image: string
  timesCollectedToday: number
  contentSteps?: string[]
  contentImage?: string
}
