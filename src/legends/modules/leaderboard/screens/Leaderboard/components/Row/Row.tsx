import React, { FC } from 'react'

import { STK_WALLET } from '@ambire-common/consts/addresses'
import { getTokenBalanceInUSD } from '@ambire-common/libs/portfolio/helpers'
import { faTrophy } from '@fortawesome/free-solid-svg-icons/faTrophy'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Address from '@legends/components/Address'
import useAccountContext from '@legends/hooks/useAccountContext'
import usePortfolioControllerState from '@legends/hooks/usePortfolioControllerState/usePortfolioControllerState'
import styles from '@legends/modules/leaderboard/screens/Leaderboard/Leaderboard.module.scss'
import { LeaderboardEntry } from '@legends/modules/leaderboard/types'

type Props = Omit<LeaderboardEntry['currentUser'], 'projectedRewards' | 'projectedRewardsUsd'> & {
  stickyPosition: string | null
  projectedRewardsSeason1?: number | string
  projectedRewardsSeason2Usd?: number
  currentUserRef: React.RefObject<HTMLDivElement>
  reward?: number | ''
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

function prettifyProjectedRewards(amount: number) {
  if (amount > 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(2)}B`
  if (amount > 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M`
  if (amount > 1_000) return `${(amount / 1_000).toFixed(2)}K`
  return Math.floor(amount)
}

const formatXp = (xp: number) => {
  return xp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

const Row: FC<Props> = ({
  account,
  rank,
  xp,
  level,
  points,
  image_avatar,
  projectedRewardsSeason1,
  projectedRewardsSeason2Usd,
  stickyPosition,
  currentUserRef,
  reward
}) => {
  const { connectedAccount } = useAccountContext()
  const { walletTokenInfo } = usePortfolioControllerState()
  const isConnectedAccountRow = account === connectedAccount

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
  const formattedXp = formatXp(xp || 0)

  const amountFormatted = reward ? Math.round(reward * 1e18) : 0
  const tokenBalanceInUSD = getTokenBalanceInUSD({
    chainId: BigInt(1),
    amount: BigInt(amountFormatted || 1),
    latestAmount: BigInt(amountFormatted || 1),
    pendingAmount: BigInt(amountFormatted || 1),
    address: STK_WALLET,
    symbol: 'stkWALLET',
    name: 'Staked $WALLET',
    decimals: 18,
    priceIn: [{ baseCurrency: 'usd', price: walletTokenInfo?.walletPrice || 0 }],
    flags: {
      onGasTank: false,
      rewardsType: 'wallet-projected-rewards' as const,
      canTopUpGasTank: false,
      isFeeToken: false
    }
  })

  return (
    <div
      key={account}
      className={`${styles.row} ${isConnectedAccountRow ? styles.currentUserRow : ''} ${
        rank <= 3 ? styles[`rankedRow${rank}`] : ''
      } ${reward ? styles.withReward : ''}`}
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
      {typeof level === 'number' && (
        <h5 className={`${styles.cell} ${styles.levelCell}`}>{level}</h5>
      )}
      {typeof projectedRewardsSeason1 !== 'undefined' && (
        <h5 className={`${styles.cell} ${styles.weight}`}>
          {typeof projectedRewardsSeason1 === 'number'
            ? prettifyProjectedRewards(projectedRewardsSeason1)
            : projectedRewardsSeason1}
        </h5>
      )}
      {typeof reward !== 'undefined' && (
        <>
          <h5 className={`${styles.cell} ${styles.reward}`}>
            {typeof reward === 'number' ? prettifyProjectedRewards(reward) : reward}
          </h5>
          <h5 className={`${styles.cell} ${styles.dollarReward}`}>
            $
            {Number(tokenBalanceInUSD).toLocaleString(undefined, {
              maximumFractionDigits: 0
            })}
          </h5>
        </>
      )}
      {typeof projectedRewardsSeason2Usd !== 'undefined' && (
        <h5 className={`${styles.cell} ${styles.dollarReward}`}>
          {Number(projectedRewardsSeason2Usd / (walletTokenInfo?.walletPrice || 0)).toLocaleString(
            undefined,
            {
              maximumFractionDigits: 0
            }
          )}
        </h5>
      )}

      <h5 className={styles.cell}>{points ? Math.floor(points) : formattedXp}</h5>
    </div>
  )
}

export default Row
