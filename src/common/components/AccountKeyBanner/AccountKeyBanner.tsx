import React from 'react'

import LedgerLetterIcon from '@common/assets/svg/LedgerLetterIcon'
import SingleKeyIcon from '@common/assets/svg/SingleKeyIcon'
import TrezorLockIcon from '@common/assets/svg/TrezorLockIcon'
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

  // An icon is not displayed as GridPlus' icon is not suitable for short badges
  if (type === 'lattice') return <Wrapper text="GridPlus" children={null} />
  if (type === 'trezor')
    return (
      <Wrapper text="Trezor">
        <TrezorLockIcon {...props} />
      </Wrapper>
    )
  if (type === 'ledger')
    return (
      <Wrapper text="Ledger">
        <LedgerLetterIcon {...props} />
      </Wrapper>
    )

  return (
    <Wrapper text="internal">
      <SingleKeyIcon {...props} />
    </Wrapper>
  )
}

export default React.memo(AccountKeyBanner)
