import React from 'react'

import Tooltip from '@common/components/Tooltip'
import DisconnectIcon from '@legends/common/assets/svg/DisconnectIcon'
import Address from '@legends/components/Address'
import useAccountContext from '@legends/hooks/useAccountContext'
import useCharacterContext from '@legends/hooks/useCharacterContext'
import useLeaderboardContext from '@legends/hooks/useLeaderboardContext'

import styles from './AccountInfo.module.scss'

// TODO: Add logic to handle account switching from the dropdown
const AccountInfo = ({
  wrapperClassName,
  addressClassName,
  displayTooltip = false
}: {
  wrapperClassName?: string
  addressClassName?: string
  displayTooltip?: boolean
}) => {
  const { connectedAccount, disconnectAccount } = useAccountContext()
  const { season1LeaderboardData } = useLeaderboardContext()

  const { character } = useCharacterContext()

  return (
    <div
      className={`${styles.wrapper} ${
        connectedAccount ? styles.connected : ''
      } ${wrapperClassName}`}
    >
      <div className={styles.avatarWrapper}>
        <img alt="avatar" className={styles.avatar} src={character!.image_avatar} />
      </div>
      <div className={styles.account}>
        <div className={styles.accountAndArrowWrapper}>
          <Address
            skeletonClassName={styles.addressSkeleton}
            className={`${styles.address} ${addressClassName}`}
            address={connectedAccount!}
            maxAddressLength={12}
          />
          <DisconnectIcon
            onClick={disconnectAccount}
            className={styles.disconnectIcon}
            data-tooltip-id="disconnect-info"
          />
          {displayTooltip && (
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
              id="disconnect-info"
              content="Disconnect Account"
            />
          )}
        </div>

        <p className={`${styles.levelAndRank} ${styles.activityDot}`}>
          Level {season1LeaderboardData?.currentUser?.level || 0}
        </p>
      </div>
    </div>
  )
}

export default AccountInfo
