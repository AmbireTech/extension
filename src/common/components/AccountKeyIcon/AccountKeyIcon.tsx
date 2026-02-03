import React from 'react'

import LatticeIcon from '@common/assets/svg/LatticeIcon'
import LedgerLetterIcon from '@common/assets/svg/LedgerLetterIcon'
import NoKeysIcon from '@common/assets/svg/NoKeysIcon'
import SingleKeyIcon from '@common/assets/svg/SingleKeyIcon'
import TrezorLockIcon from '@common/assets/svg/TrezorLockIcon'
import { KeyType } from '@common/components/AccountKeyIcons/AccountKeyIcons'
import useTheme from '@common/hooks/useTheme'

const AccountKeyIcon = ({ type, color }: { type: KeyType; color?: string }) => {
  const { theme } = useTheme()

  if (type === 'lattice') return <LatticeIcon color={color} width={32} height={32} />
  if (type === 'trezor') return <TrezorLockIcon color={color} width={20} height={20} />
  if (type === 'ledger') return <LedgerLetterIcon color={color} width={20} height={20} />
  if (type === 'none') return <NoKeysIcon color={theme.secondaryText} width={20} height={20} />

  return <SingleKeyIcon color={color} width={20} height={20} />
}

export default React.memo(AccountKeyIcon)
