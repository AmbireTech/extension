export enum CardXpType {
  'global',
  'mainnet',
  'l2'
}

export enum CardActionType {
  'none',
  'calls',
  'predefined',
  'link',
  'walletRoute'
}

export type CardActionCalls = {
  type: CardActionType.calls
  calls: [string, string, string][]
}

export type CardActionPredefined = {
  type: CardActionType.predefined
  predefinedId: string
}

export type CardActionLink = {
  type: CardActionType.link
  link: string
}

export type CardActionWalletRoute = {
  type: CardActionType.walletRoute // for opening connected wallet urls
  route: string
}

export type CardAction =
  | CardActionCalls
  | CardActionPredefined
  | CardActionLink
  | CardActionWalletRoute

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

export type Networks = '1' | '10' | '8453' | '534352' | '42161'
export interface CardXp {
  type: CardXpType
  from: number
  to: number
  minUsdThreshold: number
  chains: Networks[] | null
}

export interface CardFromResponse {
  id: string
  title: string
  xp: CardXp[]
  action: CardAction
  card: {
    type: CardType
    status: CardStatus
  }
  image: string
  timesCollectedToday: number
  meta?: {
    invitationKey?: string
    timesUsed?: number
    maxHits?: number
    timesCollectedSoFar?: number
    streak?: number
    points?: number[]
    expiresOrResetsAt?: string
    alreadyLinkedAccounts?: string[]
    alreadyInvitedAccounts?: string[]
    usersInvitationHistory?: {
      invitee: string
      date: string
      status: 'pending' | 'expired' | 'accepted'
    }[]
    usedInvitationSlots?: number
    accountLinkingHistory: { invitedEoaOrV1: string; date: string }[]
  }
  contentSteps?: string[]
  contentImage?: string
  contentVideo?: string
}

export interface ChestCard extends Omit<CardFromResponse, 'id' | 'meta'> {
  id: 'chest'
  meta: {
    streak: number
    points: number[]
    expiresOrResetsAt: string
  }
}
