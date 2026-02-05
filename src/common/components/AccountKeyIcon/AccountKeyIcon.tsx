import React from 'react'
import { ColorValue } from 'react-native'

import LatticeIcon from '@common/assets/svg/LatticeIcon'
import LedgerLetterIcon from '@common/assets/svg/LedgerLetterIcon'
import NoKeysIcon from '@common/assets/svg/NoKeysIcon'
import SingleKeyIcon from '@common/assets/svg/SingleKeyIcon'
import TrezorLockIcon from '@common/assets/svg/TrezorLockIcon'
import { KeyType } from '@common/components/AccountKeyIcons/AccountKeyIcons'

const AccountKeyIcon = ({ type, color }: { type: KeyType; color?: string | ColorValue }) => {
  const props = {
    color,
    width: 16,
    height: 16
  }

  if (type === 'lattice') return <LatticeIcon {...props} />
  if (type === 'trezor') return <TrezorLockIcon {...props} />
  if (type === 'ledger') return <LedgerLetterIcon {...props} />
  if (type === 'none') return <NoKeysIcon {...props} />

  return <SingleKeyIcon {...props} />
}

export default React.memo(AccountKeyIcon)
