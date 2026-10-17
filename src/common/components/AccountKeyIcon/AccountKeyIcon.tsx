import React from 'react'
import { ColorValue } from 'react-native'

import { Key } from '@ambire-common/interfaces/keystore'
import GridPlusIcon from '@common/assets/svg/GridPlusIcon'
import LedgerBadgeIcon from '@common/assets/svg/LedgerBadgeIcon'
import NfcIcon from '@common/assets/svg/NfcIcon'
import NoKeysIcon from '@common/assets/svg/NoKeysIcon'
import OneKeyIcon from '@common/assets/svg/OneKeyIcon'
import QrCodeIcon from '@common/assets/svg/QrCodeIcon'
import SafeIcon, { SAFE_ICON_INLINE_SCALE } from '@common/assets/svg/SafeIcon'
import SingleKeyIcon from '@common/assets/svg/SingleKeyIcon'
import TrezorBadgeIcon from '@common/assets/svg/TrezorBadgeIcon'

export type KeyType = Key['type'] | 'none' | 'safe'

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
  if (type === 'onekey') return <OneKeyIcon {...props} />
  if (type === 'ledger') return <LedgerBadgeIcon {...props} />
  if (type === 'none') return <NoKeysIcon {...props} />
  if (type === 'safe') {
    const safeIconSize = iconSize * SAFE_ICON_INLINE_SCALE

    return <SafeIcon width={safeIconSize} height={safeIconSize} />
  }
  if (type === 'qr') return <QrCodeIcon {...props} />
  if (type === 'nfc') return <NfcIcon {...props} />

  return <SingleKeyIcon {...props} />
}

export default React.memo(AccountKeyIcon)
