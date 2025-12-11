import React from 'react'

import { ProjectedRewardsStats } from '@ambire-common/libs/portfolio/interfaces'
import AsteriskIcon from '@common/assets/svg/AsteriskIcon'
import HumidityIcon from '@common/assets/svg/HumidityIcon'
import InfoIcon from '@common/assets/svg/InfoIcon'
import LightningIcon from '@common/assets/svg/LightningIcon'
import LockIcon2 from '@common/assets/svg/LockIcon2'
import ScaleIcon from '@common/assets/svg/ScaleIcon'
import SwapIcon from '@common/assets/svg/SwapIcon/SwapIcon'
import WalletIcon from '@common/assets/svg/WalletIcon2'
import Tooltip from '@common/components/Tooltip'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons/faChevronDown'
import { faTrophy } from '@fortawesome/free-solid-svg-icons/faTrophy'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import ChevronDownIcon from '@legends/common/assets/svg/ChevronDownIcon'
import useLeaderboardContext from '@legends/hooks/useLeaderboardContext'
import usePortfolioControllerState from '@legends/hooks/usePortfolioControllerState/usePortfolioControllerState'

import Background1 from './media/Background1'
import Background2 from './media/Background2'
import Background3 from './media/Background3'
import styles from './UserDataSection.module.scss'

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
    label: 'Swap & Bridge volume (AVG)',
    explanation: 'For every $1000 generated in Swap & Bridge volume, you receive 10 score points.'
  },
  {
    id: 'governanceScore',
    label: 'Governance total weight',
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

const UserDataSection = () => {
  // @TODO: Replace with season 2 data
  const { season1LeaderboardData } = useLeaderboardContext()
  const { userRewardsStats } = usePortfolioControllerState()
  const [expandedId, setExpandedId] = React.useState<Stat['id'] | null>(null)

  const sections: Stat[] = SECTIONS.map((section) => {
    // const value = userRewardsStats ? userRewardsStats[section.id] : '-'
    let score = userRewardsStats ? userRewardsStats[section.id].toFixed(0) : 0

    if (section.id === 'multiplier') {
      score = `${score}x`
    }

    return {
      ...section,
      score,
      value: getValueFromKey(section.id, userRewardsStats)
    }
  })

  // @TODO: Loading state
  return (
    <div className={styles.wrapper}>
      <div className={styles.statsWrapper}>
        <div className={styles.header}>
          <span>Score</span>
          <span>Criteria</span>
          <span>Amount</span>
          <span />
        </div>
        <div className={styles.stats}>
          {sections.map(({ score, id, label, explanation, value }) => (
            <div className={`${styles.stat} ${expandedId === id ? styles.open : ''}`} key={id}>
              <button
                type="button"
                className={styles.header}
                onClick={() => setExpandedId(expandedId === id ? null : id)}
              >
                <div className={styles.score}>
                  <div className={styles.scoreBadge}>
                    <span className={styles.scoreText}>{score}</span>
                  </div>
                </div>
                <div className={styles.criteria}>
                  <div className={styles.icon}>
                    <Icon id={id} />
                  </div>
                  <span className={styles.label}>{label}</span>
                  <InfoIcon
                    width={12}
                    height={12}
                    color="currentColor"
                    className={styles.infoIcon}
                    data-tooltip-id={`${id}-info-tooltip`}
                  />
                  <Tooltip
                    style={{
                      backgroundColor: '#101114',
                      color: '#F4F4F7',
                      fontFamily: 'FunnelDisplay',
                      fontSize: 11,
                      lineHeight: '16px',
                      fontWeight: 300,
                      maxWidth: 244,
                      boxShadow: '0px 0px 12px 0px #191B20',
                      whiteSpace: 'pre-wrap'
                    }}
                    place="bottom"
                    id={`${id}-info-tooltip`}
                    content={explanation}
                  />
                </div>
                <span className={styles.value}>{value}</span>
                <FontAwesomeIcon className={`${styles.chevronIcon}`} icon={faChevronDown} />
              </button>
              <div className={styles.description}>{explanation}</div>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.rewardsWrapper}>
        <div className={styles.total}>
          <div className={styles.content}>
            <span className={styles.value}>
              {userRewardsStats ? userRewardsStats.totalScore : '-'}
            </span>
            <span className={styles.label}>Total score</span>
          </div>
          <Background1 className={styles.background} />
          <ChevronDownIcon className={styles.chevron} />
        </div>
        <div className={styles.wallet}>
          <div className={styles.content}>
            <span className={styles.kicker}>$WALLET</span>
            <span className={styles.value}>
              {userRewardsStats
                ? userRewardsStats.estimatedRewards.toLocaleString(undefined, {
                    maximumFractionDigits: 2
                  })
                : '-'}
            </span>
            <span className={styles.usd}>
              $
              {userRewardsStats
                ? userRewardsStats.estimatedRewardsUSD.toLocaleString(undefined, {
                    maximumFractionDigits: 2
                  })
                : '-'}
            </span>
            <span className={styles.label}>Estimated Rewards</span>
          </div>
          <Background2 className={styles.background} />
          <ChevronDownIcon className={styles.chevron} />
        </div>
        <div className={styles.rank}>
          <div className={styles.content}>
            <span className={styles.badge}>{season1LeaderboardData?.currentUser?.rank || '-'}</span>
            <div className={styles.labelWithIcon}>
              <FontAwesomeIcon icon={faTrophy} className={styles.icon} />
              <span className={styles.label}>Rank</span>
            </div>
          </div>

          <Background3 className={styles.background} />
        </div>
      </div>
    </div>
  )
}

export default UserDataSection
