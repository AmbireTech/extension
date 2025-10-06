import React, { FC } from 'react'

import { faTrophy } from '@fortawesome/free-solid-svg-icons/faTrophy'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Address from '@legends/components/Address'
import useAccountContext from '@legends/hooks/useAccountContext'
import styles from '@legends/modules/leaderboard/screens/Leaderboard/Leaderboard.module.scss'
import { LeaderboardEntry } from '@legends/modules/leaderboard/types'

type Props = LeaderboardEntry['currentUser'] & {
  stickyPosition: string | null
  projectedRewards?: number
  currentUserRef: React.RefObject<HTMLDivElement>
}

const calculateRowStyle = (isConnectedAccountRow: boolean, stickyPosition: string | null) => {
  return {
    position: (isConnectedAccountRow && stickyPosition ? 'sticky' : 'relative') as
      | 'sticky'
      | 'relative',
    top: stickyPosition === 'top' && isConnectedAccountRow ? 0 : 'auto',
    bottom: stickyPosition === 'bottom' && isConnectedAccountRow ? 0 : 'auto',
    zIndex: isConnectedAccountRow ? 10 : 0
  }
}

const getBadge = (rank: number) => {
  switch (rank) {
    case 1:
      return <FontAwesomeIcon icon={faTrophy} className={styles.trophy} />
    case 2:
      return <FontAwesomeIcon icon={faTrophy} className={styles.trophy} />
    case 3:
      return <FontAwesomeIcon icon={faTrophy} className={styles.trophy} />
    default:
      return null
  }
}

function prettifyProjectedRewards(amount: number) {
  if (amount > 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(2)}B`
  if (amount > 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M`
  if (amount > 1_000) return `${(amount / 1_000).toFixed(2)}K`
  return Math.floor(amount)
}

const Row: FC<Props> = ({
  account,
  image_avatar,
  rank,
  xp,
  projectedRewards,
  level,
  stickyPosition,
  currentUserRef
}) => {
  const { connectedAccount } = useAccountContext()
  const isConnectedAccountRow = account === connectedAccount
  const formatXp = (xp: number) => {
    return xp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  const [maxAddressLength, setMaxAddressLength] = React.useState(23)

  React.useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768
      setMaxAddressLength(isMobile ? 8 : 23)
    }

    // Set initial value
    handleResize()

    // Add event listener
    window.addEventListener('resize', handleResize)

    // Clean up
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  const formattedXp = formatXp(xp)
  return (
    <div
      key={account}
      className={`${styles.row} ${isConnectedAccountRow ? styles.currentUserRow : ''} ${
        rank <= 3 ? styles[`rankedRow${rank}`] : ''
      }`}
      ref={isConnectedAccountRow ? currentUserRef : null}
      style={calculateRowStyle(isConnectedAccountRow, stickyPosition)}
    >
      <div className={styles.cell}>
        <div className={styles.rankWrapper}>{rank > 3 ? rank : getBadge(rank)}</div>
        <img src={image_avatar} alt="avatar" className={styles.avatar} />
        {isConnectedAccountRow ? (
          <>
            You (
            <Address
              skeletonClassName={styles.addressSkeleton}
              className={styles.address}
              address={account}
              maxAddressLength={maxAddressLength}
            />
            )
          </>
        ) : (
          <Address
            skeletonClassName={styles.addressSkeleton}
            className={styles.address}
            address={account}
            maxAddressLength={maxAddressLength}
          />
        )}
      </div>
      <h5 className={styles.cell}>{level}</h5>
      {typeof projectedRewards !== 'undefined' && (
        <h5 className={`${styles.cell} ${styles.weight}`}>
          {typeof projectedRewards === 'number'
            ? prettifyProjectedRewards(projectedRewards)
            : 'Loading...'}
        </h5>
      )}
      <h5 className={styles.cell}>{formattedXp}</h5>
    </div>
  )
}

export default Row
