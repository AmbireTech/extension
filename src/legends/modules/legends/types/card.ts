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
  chainId?: number
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

export type Networks = '1' | '10' | '8453' | '534352' | '42161' | '56'
export interface CardXp {
  type: CardXpType
  from?: number
  to?: number
  minUsdThreshold?: number
  linearMultiplier?: number
  chains: Networks[] | null
}

export enum CardGroup {
  Show = 'show',
  SwapAndBridge = 'swap-and-bridge',
  Supporter = 'supporter',
  GasTank = 'gas-tank',
  Transactions = 'transactions',
  Seasonal = 'seasonal',
  MiniGame = 'mini-game',
  Partners = 'partners'
}

export enum CardGroupNameMapping {
  'show' = 'Show',
  'swap-and-bridge' = 'Swap And Bridge',
  'supporter' = 'Supporter',
  'gas-tank' = 'Gas Tank',
  'transactions' = 'Transactions',
  'seasonal' = 'Seasonal',
  'mini-game' = 'Daily Quests',
  'partners' = 'Partners'
}

export interface CardFromResponse {
  id: string
  title: string
  shortTitle: string
  xp: CardXp[]
  action: CardAction
  card: {
    type: CardType
    status: CardStatus
  }
  image: string
  imageV2?: string
  timesCollectedToday: number
  group: CardGroup
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
    availableToClaim?: number
    notMetLvlThreshold?: true
    hasAlreadyMigrated?: true
    hasPenalty?: boolean
    initial7702Xp?: number
    code?: string
    allCollected?: boolean
    activeProposals?: { id: string; title: string; created: number; end: number }[]
    revealedMascotLetter?: boolean
  }
  contentSteps?: string[]
  contentImageV2?: string
  contentVideoV2?: string
}
