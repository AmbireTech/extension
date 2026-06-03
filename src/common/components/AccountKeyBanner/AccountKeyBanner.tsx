import React from 'react'

import GridPlusIcon from '@common/assets/svg/GridPlusIcon'
import LedgerBadgeIcon from '@common/assets/svg/LedgerBadgeIcon'
import ReceiveIcon from '@common/assets/svg/ReceiveIcon'
import SafeBadgeIcon from '@common/assets/svg/SafeBadgeIcon'
import SingleKeyIcon from '@common/assets/svg/SingleKeyIcon'
import TrezorBadgeIcon from '@common/assets/svg/TrezorBadgeIcon'
import { KeyType } from '@common/components/AccountKeyIcons/AccountKeyIcons'
import useTheme from '@common/hooks/useTheme'

import Wrapper from './Wrapper'

const AccountKeyBanner = ({ type }: { type: KeyType }) => {
  if (type === 'none') return null

  const { theme } = useTheme()

  const props = {
    color: theme.secondaryAccent400,
    width: 16,
    height: 16
  }

  if (type === 'lattice')
    return (
      <Wrapper text="GridPlus">
        <GridPlusIcon {...props} />
      </Wrapper>
    )
  if (type === 'trezor')
    return (
      <Wrapper text="Trezor">
        <TrezorBadgeIcon {...props} />
      </Wrapper>
    )
  if (type === 'ledger')
    return (
      <Wrapper text="Ledger">
        <LedgerBadgeIcon {...props} />
      </Wrapper>
    )

  if (type === 'safe')
    return (
      <Wrapper text="Safe">
        <SafeBadgeIcon {...props} />
      </Wrapper>
    )

  if (type === 'qr')
    return (
      <Wrapper text="Qr-based">
        <ReceiveIcon {...props} />
      </Wrapper>
    )

  return (
    <Wrapper text="internal">
      <SingleKeyIcon {...props} />
    </Wrapper>
  )
}

export default React.memo(AccountKeyBanner)
