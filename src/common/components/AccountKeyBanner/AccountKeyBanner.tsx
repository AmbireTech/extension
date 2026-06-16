import React from 'react'

import GridPlusIcon from '@common/assets/svg/GridPlusIcon'
import LedgerBadgeIcon from '@common/assets/svg/LedgerBadgeIcon'
import ReceiveIcon from '@common/assets/svg/ReceiveIcon'
import SafeIcon from '@common/assets/svg/SafeIcon'
import SingleKeyIcon from '@common/assets/svg/SingleKeyIcon'
import TrezorBadgeIcon from '@common/assets/svg/TrezorBadgeIcon'
import { KeyType } from '@common/components/AccountKeyIcons/AccountKeyIcons'
import useTheme from '@common/hooks/useTheme'

import Wrapper from './Wrapper'

const AccountKeyBanner = ({ type }: { type: KeyType }) => {
  const { theme } = useTheme()

  if (type === 'none') return null

  const iconProps = {
    color: theme.secondaryAccent400,
    width: 16,
    height: 16
  }

  if (type === 'lattice')
    return (
      <Wrapper text="GridPlus">
        <GridPlusIcon {...iconProps} />
      </Wrapper>
    )
  if (type === 'trezor')
    return (
      <Wrapper text="Trezor">
        <TrezorBadgeIcon {...iconProps} />
      </Wrapper>
    )
  if (type === 'ledger')
    return (
      <Wrapper text="Ledger">
        <LedgerBadgeIcon {...iconProps} />
      </Wrapper>
    )

  if (type === 'safe')
    return (
      <Wrapper text="Safe">
        <SafeIcon width={iconProps.width} height={iconProps.height} />
      </Wrapper>
    )

  if (type === 'qr')
    return (
      <Wrapper text="Qr-based">
        <ReceiveIcon {...iconProps} />
      </Wrapper>
    )

  return (
    <Wrapper text="internal">
      <SingleKeyIcon {...iconProps} />
    </Wrapper>
  )
}

export default React.memo(AccountKeyBanner)
