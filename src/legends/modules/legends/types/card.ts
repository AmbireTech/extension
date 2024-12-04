export enum CardXpType {
  'global',
  'mainnet',
  'l2'
}

export enum CardActionType {
  'none',
  'calls',
  'predefined'
}

export interface CardAction {
  type: CardActionType
  calls?: [string, string, string][]
  predefinedId?: string
}

export enum CardType {
  'recurring',
  'done',
  'available'
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
  }
  image: string
  disabled?: boolean
}
