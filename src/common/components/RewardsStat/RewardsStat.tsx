// @TODO: Refactor this somehow, no time now
import React from 'react'

import { ProjectedRewardsStats } from '@ambire-common/libs/portfolio/interfaces'
import AsteriskIcon from '@common/assets/svg/AsteriskIcon'
import HumidityIcon from '@common/assets/svg/HumidityIcon'
import LockIcon2 from '@common/assets/svg/LockIcon2'
import ScaleIcon from '@common/assets/svg/ScaleIcon'
import SwapIcon from '@common/assets/svg/SwapIcon'
import WalletIcon from '@common/assets/svg/WalletIcon2'

type Stat = {
  id: keyof ProjectedRewardsStats
  score: number | string
  label: string
  explanation: string
  value: string | null
}

const SECTIONS: Omit<Stat, 'score' | 'value'>[] = [
  {
    id: 'balanceScore',
    label: 'Wallet Balance (AVG)',
    explanation:
      'For every $1000 (on the eligible networks) in your wallet balance you receive 1 score point.'
  },
  {
    id: 'liquidityScore',
    label: 'Concentrated Liquidity (AVG)',
    explanation:
      'For every $1000 worth of $WALLET/$ETH liquidity provided on Uniswap you receive 30 score points.'
  },
  {
    id: 'stkWALLETScore',
    label: 'Staked $WALLET (AVG)',
    explanation: 'For every $1000 worth of $stkWALLET you hold you receive 20 score points.'
  },
  {
    id: 'swapVolumeScore',
    label: 'Swap & Bridge volume',
    explanation: 'For every $1000 generated in Swap & Bridge volume, you receive 10 score points.'
  },
  {
    id: 'governanceScore',
    label: 'Governance total weight in usd',
    explanation: `Governance vote score is calculated by the formula: 
governance_score = user.governance_proposals_voted_in.map(x => x.governance_weight).sum() * wallet_token.price / 2000`
  },
  {
    id: 'multiplier',
    label: 'Community multipliers',
    explanation: `You receive 1.06X multiplier of your score for belonging to any of the following:
- Have pledget to the Trustless manifesto
- Hold a LobsterDAO NFT
- Hold a CryptoTesters NFT
- Hold an Ambire Gas Tank NFT, Legends NFT, or any Ambire conference POAP
- Hold Gitcoin passport NFT
- Hold GHO passport NFT`
  }
]

const getValueFromKey = (id: Stat['id'], stats: ProjectedRewardsStats | null): string | null => {
  if (!stats) return '-'

  switch (id) {
    case 'balanceScore':
      return `$${stats.averageBalance.toLocaleString(undefined, {
        maximumFractionDigits: 2
      })}`
    case 'liquidityScore':
      return `$${stats.averageLiquidity.toLocaleString(undefined, {
        maximumFractionDigits: 2
      })}`
    case 'stkWALLETScore':
      return `$${stats.averageStkWalletBalance.toLocaleString(undefined, {
        maximumFractionDigits: 2
      })}`
    case 'swapVolumeScore':
      return `$${stats.swapVolume.toLocaleString(undefined, {
        maximumFractionDigits: 2
      })}`
    case 'governanceScore':
      return `$${stats.governanceWeight.toLocaleString(undefined, {
        maximumFractionDigits: 2
      })}`
    case 'multiplier':
      return null
    default:
      return '-'
  }
}

const Icon = ({ id }: { id: Stat['id'] }) => {
  switch (id) {
    case 'balanceScore':
      return <WalletIcon />
    case 'liquidityScore':
      return <HumidityIcon />
    case 'stkWALLETScore':
      return <LockIcon2 />
    case 'swapVolumeScore':
      return <SwapIcon />
    case 'multiplier':
      return <AsteriskIcon />
    case 'governanceScore':
      return <ScaleIcon />
    default:
      return null
  }
}

export { SECTIONS, getValueFromKey, Icon }

export type { Stat }
