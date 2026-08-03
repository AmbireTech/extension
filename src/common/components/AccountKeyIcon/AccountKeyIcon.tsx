import React from 'react'
import { ColorValue } from 'react-native'

import GridPlusIcon from '@common/assets/svg/GridPlusIcon'
import HWIcon from '@common/assets/svg/HWIcon'
import LedgerBadgeIcon from '@common/assets/svg/LedgerBadgeIcon'
import NoKeysIcon from '@common/assets/svg/NoKeysIcon'
import ReceiveIcon from '@common/assets/svg/ReceiveIcon'
import SafeIcon from '@common/assets/svg/SafeIcon'
import SingleKeyIcon from '@common/assets/svg/SingleKeyIcon'
import TrezorBadgeIcon from '@common/assets/svg/TrezorBadgeIcon'
import { KeyType } from '@common/components/AccountKeyIcons/AccountKeyIcons'

const AccountKeyIcon = ({
  type,
  color,
  iconSize = 16
}: {
  type: KeyType
  color?: string | ColorValue
  iconSize?: number
}) => {
  const props = {
    color,
    width: iconSize,
    height: iconSize
  }

  if (type === 'lattice') return <GridPlusIcon {...props} />
  if (type === 'trezor') return <TrezorBadgeIcon {...props} />
  if (type === 'ledger') return <LedgerBadgeIcon {...props} />
  if (type === 'none') return <NoKeysIcon {...props} />
  if (type === 'safe') return <SafeIcon width={iconSize} height={iconSize} />
  if (type === 'qr') return <ReceiveIcon {...props} />
  // TODO: no NFC / contactless card icon exists in @common/assets/svg yet,
  // falling back to the generic hardware wallet one. Please add a proper icon.
  if (type === 'nfc') return <HWIcon {...props} />

  return <SingleKeyIcon {...props} />
}

export default React.memo(AccountKeyIcon)
