import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import background from '@legends/common/assets/images/background.png'
import Alert from '@legends/components/Alert'
import Page from '@legends/components/Page'
import Spinner from '@legends/components/Spinner'
import useAccountContext from '@legends/hooks/useAccountContext'
import useLeaderboardContext from '@legends/hooks/useLeaderboardContext'
import usePortfolio from '@legends/hooks/usePortfolio'
import { reorderLeaderboardWithLiveData } from '@legends/utils/leaderboards'

import { LeaderboardEntry } from '../../types'
import Podium from './components/Podium'
import Row from './components/Row'
import styles from './Leaderboard.module.scss'

enum ActiveTab {
  Season0 = 'Season0',
  Season1 = 'Season1',
  Season2 = 'Season2'
}
const LeaderboardContainer: React.FC = () => {
  const {
    season0LeaderboardData,
    season1LeaderboardData,
    season2LeaderboardData,
    isLeaderboardLoading: loading,
    error,
    updateLeaderboard
  } = useLeaderboardContext()

  const { userRewardsStats, isLoadingClaimableRewards } = usePortfolio()
  const { connectedAccount } = useAccountContext()

  const tableRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const currentUserRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>(ActiveTab.Season2)

  const [stickyPosition, setStickyPosition] = useState<'top' | 'bottom' | null>(null)
  const leaderboardSources = useMemo(
    () => ({
      [ActiveTab.Season0]: season0LeaderboardData,
      [ActiveTab.Season1]: season1LeaderboardData,
      [ActiveTab.Season2]: season2LeaderboardData
    }),
    [season0LeaderboardData, season1LeaderboardData, season2LeaderboardData]
  )

  const {
    entries: leaderboardData,
    currentUser: userLeaderboardData
  }: {
    entries: LeaderboardEntry['entries'] | null
    currentUser?: LeaderboardEntry['currentUser'] | null
  } = useMemo(() => {
    const fullLeaderboardData = leaderboardSources[activeTab]
    if (!fullLeaderboardData) return { entries: null, currentUser: null }
    if (activeTab !== ActiveTab.Season2) {
      return {
        entries: fullLeaderboardData.entries,
        currentUser: fullLeaderboardData.currentUser
      }
    }
    if (isLoadingClaimableRewards) return { entries: null, currentUser: null }
    return reorderLeaderboardWithLiveData(fullLeaderboardData, userRewardsStats, connectedAccount)
  }, [activeTab, leaderboardSources, userRewardsStats, isLoadingClaimableRewards, connectedAccount])

  useLayoutEffect(() => {
    const handleScroll = () => {
      if (!userLeaderboardData || !currentUserRef.current) return

      const userRect = currentUserRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight
      if (userRect.top < 0) {
        setStickyPosition('top')
      } else if (userRect.bottom > windowHeight) {
        setStickyPosition('bottom')
      }
    }

    const pageElement = pageRef.current
    if (pageElement) {
      pageElement.addEventListener('scroll', handleScroll, { passive: true })
      handleScroll()
    }

    return () => {
      if (pageElement) {
        pageElement.removeEventListener('scroll', handleScroll)
      }
    }
  }, [currentUserRef, leaderboardData, userLeaderboardData])

  useEffect(() => {
    if (loading) return

    void updateLeaderboard()
  }, [loading, updateLeaderboard])

  return (
    <Page
      containerSize="lg"
      pageRef={pageRef}
      style={{
        backgroundImage: `url(${background})`,
        backgroundPosition: 'top right',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover'
      }}
    >
      <div className={styles.wrapper}>
        <div className={styles.heading}>
          <h1 className={styles.title}>Historical Leaderboard</h1>
          <div className={styles.intro}>
            <p className={styles.introParagraph}>
              <span className={styles.introLead}>
                Ambire Rewards is a currently paused incentive program{' '}
              </span>
              <span className={styles.introMuted}>
                designed to reward real usage of the Ambire Wallet with its native token, $WALLET.
              </span>
            </p>
            <br />
            <p className={styles.introParagraph}>
              <span className={styles.introEmphasis}>
                At its core, the idea has always been simple:
              </span>
              <span className={styles.introMuted}>
                {' '}
                the more value a user brings into the wallet - by holding assets, using features
                like swaps and bridges, or engaging with the ecosystem - the more rewards they can
                earn.
              </span>
            </p>
          </div>
        </div>
        {error && <Alert className={styles.leaderboardError} type="error" title={error} />}
        {loading && <Spinner />}

        {leaderboardData && leaderboardData.length ? (
          <>
            <div className={styles.tabs}>
              <button
                type="button"
                className={`${styles.tab} ${activeTab === ActiveTab.Season0 ? styles.active : ''}`}
                onClick={() => setActiveTab(ActiveTab.Season0)}
              >
                Season 0
              </button>
              <button
                type="button"
                className={`${styles.tab} ${activeTab === ActiveTab.Season1 ? styles.active : ''}`}
                onClick={() => setActiveTab(ActiveTab.Season1)}
              >
                Season 1
              </button>
              <button
                type="button"
                className={`${styles.tab} ${activeTab === ActiveTab.Season2 ? styles.active : ''}`}
                onClick={() => setActiveTab(ActiveTab.Season2)}
              >
                Season 2
              </button>
            </div>
            <Podium data={leaderboardData.slice(0, 3)} />
            <div ref={tableRef} className={styles.table}>
              <div className={styles.header}>
                <div className={styles.cell}>
                  <h5>#</h5>
                  <h5 className={styles.playerCell}>Account/User</h5>
                </div>
                <h5 className={`${styles.cell} ${styles.scoreCell}`}>Score</h5>
              </div>
              {leaderboardData.map((item) => (
                <Row
                  key={item.account}
                  {...item}
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
