import React from 'react'

import LatticeIcon from '@common/assets/svg/LatticeIcon'
import LedgerLetterIcon from '@common/assets/svg/LedgerLetterIcon'
import SingleKeyIcon from '@common/assets/svg/SingleKeyIcon'
import TrezorLockIcon from '@common/assets/svg/TrezorLockIcon'
import { KeyType } from '@common/components/AccountKeyIcons/AccountKeyIcons'
import useTheme from '@common/hooks/useTheme'

import Wrapper from './Wrapper'

const AccountKeyBanner = ({ type }: { type: KeyType }) => {
  if (type === 'none') return null

  const { theme } = useTheme()

  if (type === 'lattice')
    return (
      <Wrapper text="">
        <LatticeIcon color={theme.secondaryText} width={32} height={32} />
      </Wrapper>
    )
  if (type === 'trezor')
    return (
      <Wrapper text="Trezor">
        <TrezorLockIcon width={14} height={14} />
      </Wrapper>
    )
  if (type === 'ledger')
    return (
      <Wrapper text="Ledger">
        <LedgerLetterIcon width={14} height={14} />
      </Wrapper>
    )

  return (
    <Wrapper text="Internal">
      <SingleKeyIcon color={theme.secondaryText} width={14} height={14} />
    </Wrapper>
  )
}

export default React.memo(AccountKeyBanner)
