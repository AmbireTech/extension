import React, { useEffect, useMemo, useState } from 'react'

import { networks } from '@ambire-common/consts/networks'
// import { faChevronDown } from '@fortawesome/free-solid-svg-icons/faChevronDown'
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Address from '@legends/components/Address'
import useAccountContext from '@legends/hooks/useAccountContext'
import useCharacterContext from '@legends/hooks/useCharacterContext'
import useLeaderboardContext from '@legends/hooks/useLeaderboardContext'

import styles from './AccountDropdown.module.scss'

const AccountDropdown = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { connectedAccount, disconnectAccount, chainId } = useAccountContext()
  const { character } = useCharacterContext()
  const { userLeaderboardData } = useLeaderboardContext()

  // const toggleIsOpen = () => setIsOpen((prev) => !prev)

  const networkData = useMemo(() => {
    return networks.find((network) => network.chainId === chainId)
  }, [chainId])

  // Hide the dropdown when the user clicks outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement

      if (!target.closest(`.${styles.wrapper}`)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [])

  return (
    <div className={`${styles.wrapper} ${connectedAccount ? styles.connected : ''}`}>
      {/* TODO: Implement disconnectAccount and add back the dropdown logic */}
      <button className={styles.button} type="button">
        <div className={styles.avatarWrapper}>
          <img alt="avatar" className={styles.avatar} src={character!.image_avatar} />
        </div>
        <div className={styles.account}>
          <Address
            skeletonClassName={styles.addressSkeleton}
            className={styles.address}
            address={connectedAccount!}
            maxAddressLength={12}
          />
          <p className={`${styles.levelAndRank} ${styles.activityDot}`}>Level {character!.level}</p>
        </div>
        {/* <FontAwesomeIcon
          className={`${styles.chevronIcon} ${isOpen ? styles.open : ''}`}
          icon={faChevronDown}
        /> */}
      </button>
      <div className={`${styles.dropdown} ${isOpen ? styles.open : ''}`}>
        <p className={styles.network}>
          Connected on {networkData?.name || `Unknown Network (${String(chainId)})`}
        </p>
        <button className={styles.disconnectButton} type="button" onClick={disconnectAccount}>
          Disconnect
        </button>
      </div>
    </div>
  )
}

export default AccountDropdown
