import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { calculateRewardsForSeason } from '@ambire-common/utils/rewards'
import InfoIcon from '@common/assets/svg/InfoIcon'
import Tooltip from '@common/components/Tooltip'
import Alert from '@legends/components/Alert'
import Page from '@legends/components/Page'
import Spinner from '@legends/components/Spinner'
import useAccountContext from '@legends/hooks/useAccountContext'
import useLeaderboardContext from '@legends/hooks/useLeaderboardContext'
import usePortfolioControllerState from '@legends/hooks/usePortfolioControllerState/usePortfolioControllerState'

import Podium from './components/Podium'
import Row from './components/Row'
import styles from './Leaderboard.module.scss'
import Ribbon from './Ribbon'
import smokeAndLights from './Smoke-and-lights.png'

const LeaderboardContainer: React.FC = () => {
  const {
    fullLeaderboardData,
    season0LeaderboardData,
    season1LeaderboardData,
    isLeaderboardLoading: loading,
    error,
    updateLeaderboard
  } = useLeaderboardContext()

  const { rewardsProjectionData, accountPortfolio } = usePortfolioControllerState()
  const { connectedAccount } = useAccountContext()

  const currentTotalBalanceOnSupportedChains =
    (accountPortfolio && accountPortfolio?.amount) || undefined

  const parsedSnapshotsBalance = rewardsProjectionData?.currentSeasonSnapshots.map(
    (snapshot: { week: number; balance: number }) => snapshot.balance
  )

  const projectedAmount =
    rewardsProjectionData &&
    calculateRewardsForSeason(
      rewardsProjectionData?.userLevel,
      parsedSnapshotsBalance,
      currentTotalBalanceOnSupportedChains ?? 0,
      rewardsProjectionData?.numberOfWeeksSinceStartOfSeason,
      rewardsProjectionData?.totalWeightNonUser,
      rewardsProjectionData?.walletPrice,
      rewardsProjectionData?.totalRewardsPool,
      rewardsProjectionData?.minLvl,
      rewardsProjectionData?.minBalance
    )

  const tableRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const currentUserRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState(2)

  const [stickyPosition, setStickyPosition] = useState<'top' | 'bottom' | null>(null)
  const leaderboardSources = useMemo(
    () => [fullLeaderboardData, season0LeaderboardData, season1LeaderboardData],
    [fullLeaderboardData, season0LeaderboardData, season1LeaderboardData]
  )

  const leaderboardData = useMemo(
    () => leaderboardSources[activeTab]?.entries || [],
    [leaderboardSources, activeTab]
  )

  const userLeaderboardData = useMemo(
    () => leaderboardSources[activeTab]?.currentUser,
    [leaderboardSources, activeTab]
  )

  useLayoutEffect(() => {
    const handleScroll = () => {
      if (!userLeaderboardData || !currentUserRef.current) return

      const userRect = currentUserRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight
      // Check if the current user's row is above the viewport (scrolling down)
      if (userRect.top < 0) {
        // If the user is above the viewport, pin to the top
        setStickyPosition('top')
      } else if (userRect.bottom > windowHeight) {
        // If the user is below the viewport, pin to the bottom
        setStickyPosition('bottom')
      }
    }

    const pageElement = pageRef.current
    if (pageElement) {
      // Attach the scroll event listener
      pageElement.addEventListener('scroll', handleScroll, { passive: true })

      // Trigger the handleScroll function immediately after component mount
      handleScroll()
    }

    return () => {
      if (pageElement) {
        // Clean up the event listener on component unmount
        pageElement.removeEventListener('scroll', handleScroll)
      }
    }
  }, [currentUserRef, leaderboardData, userLeaderboardData])

  useEffect(() => {
    if (loading) return

    updateLeaderboard()
  }, [updateLeaderboard])

  return (
    <Page
      containerSize="lg"
      pageRef={pageRef}
      style={{
        backgroundImage: `url(${smokeAndLights})`,
        backgroundPosition: 'top right',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover'
      }}
    >
      <div className={styles.wrapper}>
        <div className={styles.heading}>
          <h1 className={styles.title}>Leaderboard</h1>
          <p className={styles.subtitle}>
            Complete quests, earn XP and climb the leaderboard to secure Ambire rewards.
          </p>
        </div>
        {error && <Alert className={styles.leaderboardError} type="error" title={error} />}
        {loading && <Spinner />}

        {leaderboardData && leaderboardData.length ? (
          <>
            <div className={styles.tabs}>
              <button
                type="button"
                className={`${styles.tab} ${!activeTab ? styles.active : ''}`}
                onClick={() => setActiveTab(0)}
              >
                Total XP
              </button>
              <button
                type="button"
                className={`${styles.tab} ${activeTab === 1 ? styles.active : ''}`}
                onClick={() => setActiveTab(1)}
              >
                Season 0
              </button>
              <button
                type="button"
                className={`${styles.tab} ${activeTab === 2 ? styles.active : ''}`}
                onClick={() => setActiveTab(2)}
              >
                <Ribbon className={styles.ribbon} />
                Season 1<span className={styles.current}>current</span>
              </button>
            </div>
            <Podium data={leaderboardData.slice(0, 3)} />
            <div
              ref={tableRef}
              className={`${styles.table} ${leaderboardData[0].reward ? styles.withReward : ''}`}
            >
              <div className={styles.header}>
                <div className={styles.cell}>
                  <h5>#</h5>
                  <h5 className={styles.playerCell}>player</h5>
                </div>
                {leaderboardData.some((i) => i.level) && <h5 className={styles.cell}>Level</h5>}
                {leaderboardData.some((i) => i.reward) && (
                  <div className={styles.cell}>
                    <h5 className={styles.weightText}>Reward</h5>
                    <InfoIcon
                      width={10}
                      height={10}
                      color="currentColor"
                      className={styles.infoIcon}
                      data-tooltip-id="reward-info"
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
                      id="reward-info"
                      content="$WALLET rewards for the season"
                    />
                  </div>
                )}
                {leaderboardData.some((i) => i.reward) && (
                  <div className={styles.cell}>
                    <h5 className={styles.weightText}>$Reward</h5>
                    <InfoIcon
                      width={10}
                      height={10}
                      color="currentColor"
                      className={styles.infoIcon}
                      data-tooltip-id="dollar-reward-info"
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
                      id="dollar-reward-info"
                      content="The $ value of $WALLET rewards for the season"
                    />
                  </div>
                )}
                {leaderboardData.some((i) => i.projectedRewards) && (
                  <div className={styles.cell}>
                    <h5 className={styles.weightText}>Rewards</h5>
                    <InfoIcon
                      width={10}
                      height={10}
                      color="currentColor"
                      className={styles.infoIcon}
                      data-tooltip-id="weight-info"
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
                      id="weight-info"
                      content="Your projected $stkWALLET rewards at the end of the season. This number is only an estimate — it will fluctuate as the season progresses, new users join, and balances shift"
                    />
                  </div>
                )}
                <h5 className={styles.cell}>XP</h5>
              </div>
              {leaderboardData.map((item) => (
                <Row
                  key={item.account}
                  {...item}
                  projectedRewards={
                    activeTab === 2
                      ? connectedAccount === item.account
                        ? projectedAmount?.walletRewards
                        : typeof item.projectedRewards === 'number'
                        ? item.projectedRewards
                        : 'Loading...'
                      : undefined
                  }
                  stickyPosition={stickyPosition}
                  currentUserRef={currentUserRef}
                />
              ))}
              {userLeaderboardData &&
                !leaderboardData.some(
                  ({ account }) => account === userLeaderboardData?.account
                ) && (
                  <Row
                    key={userLeaderboardData.account}
                    {...userLeaderboardData}
                    projectedRewards={activeTab === 2 ? projectedAmount?.walletRewards : undefined}
                    stickyPosition={stickyPosition}
                    currentUserRef={currentUserRef}
                  />
                )}
            </div>
          </>
        ) : null}
      </div>
    </Page>
  )
}

export default LeaderboardContainer
