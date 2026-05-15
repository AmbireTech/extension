import React, { FC } from 'react'

import { faTrophy } from '@fortawesome/free-solid-svg-icons/faTrophy'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Address from '@legends/components/Address'
import useAccountContext from '@legends/hooks/useAccountContext'
import styles from '@legends/modules/leaderboard/screens/Leaderboard/Leaderboard.module.scss'
import { LeaderboardEntry } from '@legends/modules/leaderboard/types'
import { formatIntegerWithSpaceThousands } from '@legends/modules/leaderboard/utils/formatIntegerWithSpaceThousands'

type Props = Omit<
  NonNullable<LeaderboardEntry['currentUser']>,
  'projectedRewards' | 'projectedRewardsUsd'
> & {
  stickyPosition: string | null
  currentUserRef: React.RefObject<HTMLDivElement>
  image_avatar?: string
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

const Row: FC<Props> = ({
  account,
  rank,
  xp,
  points,
  image_avatar,
  stickyPosition,
  currentUserRef
}) => {
  const { connectedAccount } = useAccountContext()
  const isConnectedAccountRow = account === connectedAccount

  const [maxAddressLength, setMaxAddressLength] = React.useState(23)

  React.useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768
      setMaxAddressLength(isMobile ? 8 : 23)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const displayScore =
    typeof points === 'number'
      ? formatIntegerWithSpaceThousands(points)
      : formatIntegerWithSpaceThousands(xp || 0)

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
        {!!image_avatar && <img src={image_avatar} alt="avatar" className={styles.avatar} />}
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
      <h5 className={`${styles.cell} ${styles.scoreValue}`}>{displayScore}</h5>
    </div>
  )
}

export default Row
