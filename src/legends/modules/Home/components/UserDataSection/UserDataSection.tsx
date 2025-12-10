import React from 'react'

import InfoIcon from '@common/assets/svg/InfoIcon'
import Tooltip from '@common/components/Tooltip'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons/faChevronDown'
import { faTrophy } from '@fortawesome/free-solid-svg-icons/faTrophy'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import ChevronDownIcon from '@legends/common/assets/svg/ChevronDownIcon'
import HumidityIcon from '@legends/common/assets/svg/HumidityIcon'
import LockIcon2 from '@legends/common/assets/svg/LockIcon2'
import SwapIcon from '@legends/common/assets/svg/SwapIcon/SwapIcon'
import WalletIcon from '@legends/common/assets/svg/WalletIcon'
import useLeaderboardContext from '@legends/hooks/useLeaderboardContext'

import Background1 from './media/Background1'
import Background2 from './media/Background2'
import Background3 from './media/Background3'
import styles from './UserDataSection.module.scss'

type Stat = {
  id: 'balance' | 'liquidity' | 'staked' | 'swap-volume'
  score: number
  label: string
  explanation: string
  description: string
  value: string
}

// @TODO: Get rid of mock data
const MOCK_STATS: Stat[] = [
  {
    id: 'balance',
    score: 1200,
    label: 'Wallet Balance (AVG)',
    explanation: 'Average wallet balance over the last 30 days.',
    description: 'This is calculated based on daily snapshots of your wallet balance.',
    value: '$5,432.10'
  },
  {
    id: 'liquidity',
    score: 950,
    label: 'Concentrated Liquidity (AVG)',
    explanation: 'Average liquidity provided in concentrated pools over the last 30 days.',
    description: 'This reflects your participation in liquidity pools with specific price ranges.',
    value: '$3,210.75'
  },
  {
    id: 'staked',
    score: 1100,
    label: 'Staked $WALLET (AVG)',
    explanation: 'Average value of $WALLET staked over the last 30 days.',
    description: 'Staking $WALLET helps secure the network and earn rewards.',
    value: '$1,250.00'
  }
]

const MOCK_DATA = {
  totalScore: 617,
  rewards: {
    amount: 120845.01,
    usd: 1234
  }
}

const Icon = ({ id }: { id: Stat['id'] }) => {
  switch (id) {
    case 'balance':
      return <WalletIcon />
    case 'liquidity':
      return <HumidityIcon />
    case 'staked':
      return <LockIcon2 />
    case 'swap-volume':
      return <SwapIcon />
    default:
      return null
  }
}

const UserDataSection = () => {
  // @TODO: Replace with season 2 data
  const { season1LeaderboardData } = useLeaderboardContext()
  const [expandedId, setExpandedId] = React.useState<Stat['id'] | null>(null)

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
          {MOCK_STATS.map(({ score, id, label, explanation, description, value }) => (
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
                      boxShadow: '0px 0px 12.1px 0px #191B20'
                    }}
                    place="bottom"
                    id={`${id}-info-tooltip`}
                    content={explanation}
                  />
                </div>
                <span className={styles.value}>{value}</span>
                <FontAwesomeIcon className={`${styles.chevronIcon}`} icon={faChevronDown} />
              </button>
              <div className={styles.description}>{description}</div>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.rewardsWrapper}>
        <div className={styles.total}>
          <div className={styles.content}>
            <span className={styles.value}>{MOCK_DATA.totalScore}</span>
            <span className={styles.label}>Total score</span>
          </div>
          <Background1 className={styles.background} />
          <ChevronDownIcon className={styles.chevron} />
        </div>
        <div className={styles.wallet}>
          <div className={styles.content}>
            <span className={styles.kicker}>$WALLET</span>
            <span className={styles.value}>
              {MOCK_DATA.rewards.amount.toLocaleString(undefined, {
                maximumFractionDigits: 2
              })}
            </span>
            <span className={styles.usd}>
              $
              {MOCK_DATA.rewards.usd.toLocaleString(undefined, {
                maximumFractionDigits: 2
              })}
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
