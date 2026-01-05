import React from 'react'

import { faTrophy } from '@fortawesome/free-solid-svg-icons/faTrophy'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Address from '@legends/components/Address'
import useAccountContext from '@legends/hooks/useAccountContext'
import { LeaderboardEntry } from '@legends/modules/leaderboard/types'

import styles from './Podium.module.scss'

interface PodiumProps {
  data: LeaderboardEntry['entries']
}

const Podium: React.FC<PodiumProps> = ({ data }) => {
  const { connectedAccount } = useAccountContext()

  const formatXp = (xp: number) => {
    return xp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  return (
    <div className={styles.podium}>
      {data.map((item, index) => (
        <div
          key={`${item.account}-podium`}
          className={`${styles.step} ${styles[`position${index + 1}`]}`}
        >
          <div className={styles.contentWrapper}>
            <FontAwesomeIcon icon={faTrophy} className={styles.trophy} />
            {item.account === connectedAccount ? (
              <div className={styles.currentUserWrapper}>
                You
                <div className={styles.currentUserContentWrapper}>
                  (
                  <Address className={styles.name} address={item.account} maxAddressLength={11} />)
                </div>
              </div>
            ) : (
              <Address address={item.account} className={styles.name} maxAddressLength={11} />
            )}
            <h4 className={styles.xp}>
              {item.xp ? formatXp(item.xp) : Math.floor(item.points || 0)}
            </h4>
          </div>
        </div>
      ))}
    </div>
  )
}

export default Podium
