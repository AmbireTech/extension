import React from 'react'

import Avatar from '@common/components/Avatar'
import Tooltip from '@common/components/Tooltip'
import DisconnectIcon from '@legends/common/assets/svg/DisconnectIcon'
import Address from '@legends/components/Address'
import useAccountContext from '@legends/hooks/useAccountContext'
import useProviderContext from '@legends/hooks/useProviderContext'

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
  const { disconnectProvider } = useProviderContext()
  const { connectedAccount } = useAccountContext()

  return (
    <div
      className={`${styles.wrapper} ${
        connectedAccount ? styles.connected : ''
      } ${wrapperClassName}`}
    >
      <Avatar size={32} address={connectedAccount!} pfp={connectedAccount || ''} isSmart={false} />
      <div className={styles.account}>
        <div className={styles.accountAndArrowWrapper}>
          <Address
            skeletonClassName={styles.addressSkeleton}
            className={`${styles.address} ${addressClassName}`}
            address={connectedAccount!}
            maxAddressLength={12}
          />
          <DisconnectIcon
            onClick={disconnectProvider}
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
      </div>
    </div>
  )
}

export default AccountInfo
