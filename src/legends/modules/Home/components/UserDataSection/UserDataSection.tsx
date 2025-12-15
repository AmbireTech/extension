import React from 'react'

import InfoIcon from '@common/assets/svg/InfoIcon'
import { getValueFromKey, Icon, SECTIONS, Stat } from '@common/components/RewardsStat'
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

const UserDataSection = () => {
  const { season2LeaderboardData } = useLeaderboardContext()
  const { userRewardsStats, isLoadingClaimableRewards } = usePortfolioControllerState()
  const [expandedId, setExpandedId] = React.useState<Stat['id'] | null>(null)

  const sections: Stat[] = SECTIONS.map((section) => {
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
          {sections.map(({ score, id, label, explanation, value }) =>
            isLoadingClaimableRewards ? (
              <div className={styles.statSkeleton} />
            ) : (
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
            )
          )}
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
            <span className={styles.badge}>{season2LeaderboardData?.currentUser?.rank || '-'}</span>
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
