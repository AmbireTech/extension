import React, { useMemo } from 'react'

import InfoIcon from '@common/assets/svg/InfoIcon'
import { formatScore, getValueFromKey, Icon, SECTIONS, Stat } from '@common/components/RewardsStat'
import Tooltip from '@common/components/Tooltip'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons/faChevronDown'
import { faTrophy } from '@fortawesome/free-solid-svg-icons/faTrophy'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import ChevronDownIcon from '@legends/common/assets/svg/ChevronDownIcon'
import Page from '@legends/components/Page'
import useAccountContext from '@legends/hooks/useAccountContext'
import useLeaderboardContext from '@legends/hooks/useLeaderboardContext'
import usePortfolioControllerState from '@legends/hooks/usePortfolioControllerState/usePortfolioControllerState'
import FaqSection from '@legends/modules/Home/components/FaqSection'
import { reorderLeaderboardWithLiveData } from '@legends/utils/leaderboards'

import styles from './Dashboard.module.scss'
import Background1 from './media/Background1'
import Background2 from './media/Background2'
import Background3 from './media/Background3'

const Dashboard = () => {
  const { season2LeaderboardData } = useLeaderboardContext()
  const { userRewardsStats, isLoadingClaimableRewards } = usePortfolioControllerState()
  const [expandedId, setExpandedId] = React.useState<Stat['id'] | null>(null)
  const { connectedAccount } = useAccountContext()

  // since we reorder the leaderboard, the rank should be calculate dynamically
  const dynamicLiveRank: number | null = useMemo(() => {
    if (!season2LeaderboardData) return null
    return (
      reorderLeaderboardWithLiveData(season2LeaderboardData, userRewardsStats, connectedAccount)
        .currentUser?.rank || null
    )
  }, [connectedAccount, season2LeaderboardData, userRewardsStats])

  const sections: Stat[] = SECTIONS.map((section) => {
    const score = userRewardsStats ? Math.floor(userRewardsStats[section.id]) : 0

    let explanation = section.explanation

    if (section.id === 'multiplier') {
      explanation = `You receive 1.06X multiplier of your score for belonging to any of the following:
- Have pledged to the Trustless manifesto (Soon)
- Hold a LobsterDAO NFT (Soon)
- Hold a CryptoTesters NFT (Soon)
- Hold an Ambire Gas Tank NFT, Legends NFT, or any Ambire conference POAP (Soon)
- Hold Gitcoin passport NFT (Soon)
- Hold GHO passport NFT (Soon)
- ${
        (userRewardsStats?.multipliers || []).some((m) => m.type === 'WEEKLY_TX' && m.activated)
          ? '✅ '
          : ''
      }Have at least one Ethereum transaction per week, all weeks during the season, except up to 2`
    }

    return {
      ...section,
      explanation: explanation,
      score,
      value: getValueFromKey(section.id, userRewardsStats)
    }
  })

  return (
    <Page containerSize="responsive" contentClassName={styles.pageContent} showClaimRewardsModal>
      <div className={styles.wrapper}>
        <div className={styles.headerWrapper}>
          <h2 className={styles.title}>Your Rewards</h2>
          <div className={styles.seasonInfo}>
            <div className={styles.info}>
              <span className={styles.label}>Season</span>
              <span className={styles.value}>2</span>
            </div>
            <div className={styles.info}>
              <span className={styles.label}>End</span>
              <span className={styles.value}>Mar 15</span>
            </div>
          </div>
        </div>
        <div className={styles.panel}>
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
                  <div key={id} className={styles.statSkeleton} />
                ) : (
                  <div
                    className={`${styles.stat} ${expandedId === id ? styles.open : ''}`}
                    key={id}
                  >
                    <button
                      type="button"
                      className={styles.header}
                      onClick={() => setExpandedId(expandedId === id ? null : id)}
                    >
                      <div className={styles.score}>
                        <div className={styles.scoreBadge}>
                          <span className={styles.scoreText}>{formatScore(id, score)}</span>
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
                <span className={styles.badge}>{dynamicLiveRank || '-'}</span>
                <div className={styles.labelWithIcon}>
                  <FontAwesomeIcon icon={faTrophy} className={styles.icon} />
                  <span className={styles.label}>Rank</span>
                </div>
              </div>

              <Background3 className={styles.background} />
            </div>
          </div>
        </div>
      </div>
      <FaqSection />
    </Page>
  )
}

export default Dashboard
