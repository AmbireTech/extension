import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import Page from '@legends/components/Page'
import Spinner from '@legends/components/Spinner'
import useAccountContext from '@legends/hooks/useAccountContext'
import { LeaderboardEntry } from '@legends/modules/leaderboard/types'

import Podium from './components/Podium'
import Row from './components/Row/Row'
import { getLeaderboard } from './helpers'
import styles from './Leaderboard.module.scss'

// TODO: Error and loading states
const LeaderboardContainer: React.FC = () => {
  const [loading, setLoading] = useState(true)

  const [leaderboardData, setLeaderboardData] = useState<Array<LeaderboardEntry>>([])
  const [userLeaderboardData, setUserLeaderboardData] = useState<LeaderboardEntry | null>(null)

  const { connectedAccount } = useAccountContext()

  const tableRef = useRef<HTMLDivElement>(null)

  const pageRef = useRef<HTMLDivElement>(null)
  const currentUserRef = useRef<HTMLDivElement>(null)

  const [stickyPosition, setStickyPosition] = useState<'top' | 'bottom' | null>(null)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { leaderboard, currentUser } = await getLeaderboard(connectedAccount ?? undefined)

        setLeaderboardData(leaderboard)
        currentUser && setUserLeaderboardData(currentUser)
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [connectedAccount])

  const sortedData = useMemo(
    () =>
      [
        ...leaderboardData,
        (userLeaderboardData &&
          !leaderboardData.find((user) => user.account === userLeaderboardData.account) &&
          userLeaderboardData) ||
          []
      ]
        .flat()
        .sort((a, b) => b.xp - a.xp),
    [leaderboardData, userLeaderboardData]
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
      } else {
        // Reset sticky behavior when the current user's row is in the viewport
        setStickyPosition(null)
      }
    }

    const pageElement = pageRef.current
    if (pageElement) {
      // Attach the scroll event listener
      pageElement.addEventListener('scroll', handleScroll)

      // Trigger the handleScroll function immediately after component mount
      handleScroll()
    }

    return () => {
      if (pageElement) {
        // Clean up the event listener on component unmount
        pageElement.removeEventListener('scroll', handleScroll)
      }
    }
  }, [currentUserRef, sortedData, userLeaderboardData])

  return (
    <Page pageRef={pageRef}>
      <div className={styles.wrapper}>
        <div className={styles.heading}>
          <h1 className={styles.title}>Leaderboard</h1>
          <p className={styles.subtitle}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi id nisl fringilla,
            aliquet elit sit amet, feugiat nisi. Vestibulum condimentum aliquet tortor, eu laoreet
            magna luctus et.
          </p>
        </div>
        {loading ? (
          <Spinner />
        ) : (
          <>
            <Podium data={sortedData.slice(0, 3)} />
            <div ref={tableRef} className={styles.table}>
              <div className={styles.header}>
                <h5 className={styles.cell}>player</h5>
                <h5 className={styles.cell}>Level</h5>
                <h5 className={styles.cell}>XP</h5>
              </div>
              {sortedData.map((item) => (
                <Row
                  key={item.account}
                  {...item}
                  stickyPosition={stickyPosition}
                  currentUserRef={currentUserRef}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </Page>
  )
}

export default LeaderboardContainer
